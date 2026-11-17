import { Request, Response, NextFunction } from 'express';
import mongoose from 'mongoose';
import { AuthRequest } from '../middleware/auth';
import { Review } from '../models/Review';
import { Product } from '../models/Product';
import { ApiError } from '../utils/apiError';

/**
 * Helper to recalculate and sync product rating and approved review count.
 * Only APPROVED reviews are factored into the product's public rating.
 */
export const updateProductRatingStats = async (productId: string | mongoose.Types.ObjectId) => {
  const approvedReviews = await Review.find({ product: productId, isApproved: true });
  const product = await Product.findById(productId);
  if (product) {
    if (approvedReviews.length > 0) {
      const avg = approvedReviews.reduce((sum, r) => sum + r.rating, 0) / approvedReviews.length;
      product.rating = Number(avg.toFixed(1));
      product.reviewCount = approvedReviews.length;
    } else {
      product.rating = 5.0;
      product.reviewCount = 0;
    }
    await product.save();
  }
};

/**
 * Customer / Public: Get Reviews for a Product
 * Only approved reviews are returned to general visitors.
 * If logged in, customer also sees their own pending review.
 * Admins see all reviews for the product.
 */
export const getProductReviews = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { productId } = req.params;

    // Resolve product by _id or slug
    let targetProductId = productId;
    if (!mongoose.Types.ObjectId.isValid(productId)) {
      const prod = await Product.findOne({ slug: productId }).select('_id');
      if (prod) {
        targetProductId = prod._id.toString();
      }
    }

    // Determine query filter based on viewer role
    let filter: any = { product: targetProductId };

    if (req.user?.role === 'admin') {
      // Admins see all reviews for this product
      filter = { product: targetProductId };
    } else if (req.user?._id) {
      // Authenticated customer: see all approved reviews + their own review (even if pending)
      filter = {
        product: targetProductId,
        $or: [{ isApproved: true }, { user: req.user._id }],
      };
    } else {
      // Public / Guest: only see approved reviews
      filter = { product: targetProductId, isApproved: true };
    }

    const reviews = await Review.find(filter)
      .populate('user', 'name avatar email')
      .sort({ createdAt: -1 });

    // Total count of all reviews on this product (for 10 max limit check)
    const totalCount = await Review.countDocuments({ product: targetProductId });

    res.status(200).json({
      success: true,
      count: reviews.length,
      totalCount,
      maxLimit: 10,
      data: reviews,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Customer: Create or Update Review for a Product
 * Enforces maximum 10 reviews per product.
 * Requires admin approval before appearing publicly.
 */
export const createReview = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { productId } = req.params;
    const { rating, title, comment } = req.body;

    if (!rating || !comment || !title) {
      return next(new ApiError('Please provide rating, title and review comment', 400));
    }

    if (Number(rating) < 1 || Number(rating) > 5) {
      return next(new ApiError('Rating must be between 1 and 5 stars', 400));
    }

    // Process uploaded review images (via multipart files or URLs passed in body)
    const uploadedFiles = (req.files as Express.Multer.File[]) || (req.file ? [req.file] : []);
    const fileUrls = uploadedFiles.map((file) => `/uploads/reviews/${file.filename}`);

    let bodyImages: string[] = [];
    if (req.body.images) {
      if (Array.isArray(req.body.images)) {
        bodyImages = req.body.images;
      } else if (typeof req.body.images === 'string') {
        try {
          const parsed = JSON.parse(req.body.images);
          if (Array.isArray(parsed)) bodyImages = parsed;
          else if (parsed) bodyImages = [parsed];
        } catch {
          bodyImages = [req.body.images];
        }
      }
    }

    // Combine any new files with existing/body image URLs
    const finalImages = [...fileUrls, ...bodyImages].filter(Boolean);

    // Resolve product
    let product = await Product.findById(productId);
    if (!product && !mongoose.Types.ObjectId.isValid(productId)) {
      product = await Product.findOne({ slug: productId });
    }

    if (!product) {
      return next(new ApiError('Product not found', 404));
    }

    // Check if user already reviewed this product
    const existingReview = await Review.findOne({
      product: product._id,
      user: req.user?._id,
    });

    if (existingReview) {
      // Update existing review (does not increase product review count)
      existingReview.rating = Number(rating);
      existingReview.title = title.trim();
      existingReview.comment = comment.trim();
      if (finalImages.length > 0 || req.body.images !== undefined) {
        existingReview.images = finalImages;
      }
      existingReview.isApproved = false; // requires re-approval upon edit
      await existingReview.save();

      await updateProductRatingStats(product._id);

      res.status(200).json({
        success: true,
        message: 'Review updated successfully! It will appear publicly once verified by an admin.',
        data: existingReview,
      });
      return;
    }

    // Check 10 reviews maximum limit per product
    const currentReviewCount = await Review.countDocuments({ product: product._id });
    if (currentReviewCount >= 10) {
      return next(
        new ApiError(
          'Maximum limit of 10 reviews has already been reached for this product.',
          400
        )
      );
    }

    // Create new review in Pending state
    const newReview = await Review.create({
      product: product._id,
      user: req.user?._id,
      rating: Number(rating),
      title: title.trim(),
      comment: comment.trim(),
      images: finalImages,
      isApproved: false,
      verifiedPurchase: true,
    });

    await updateProductRatingStats(product._id);

    res.status(201).json({
      success: true,
      message: 'Review submitted successfully! It will appear publicly once approved by an admin.',
      data: newReview,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Customer: Upload review images independently
 */
export const uploadReviewImagesHandler = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const files = (req.files as Express.Multer.File[]) || (req.file ? [req.file] : []);
    if (!files || files.length === 0) {
      return next(new ApiError('No review image files provided', 400));
    }

    const host = req.get('host') || 'localhost:5012';
    const imageUrls = files.map((f) => `${req.protocol}://${host}/uploads/reviews/${f.filename}`);
    const relativeUrls = files.map((f) => `/uploads/reviews/${f.filename}`);

    res.status(200).json({
      success: true,
      imageUrls,
      relativeUrls,
      count: imageUrls.length,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Admin: Get All Reviews (Product-Wise & Filterable)
 */
export const getAllReviewsAdmin = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { productId, status, search } = req.query;

    const filter: any = {};

    if (productId && productId !== 'all') {
      filter.product = productId;
    }

    if (status === 'approved') {
      filter.isApproved = true;
    } else if (status === 'pending') {
      filter.isApproved = false;
    }

    let reviewsQuery = Review.find(filter)
      .populate('user', 'name email avatar phone')
      .populate('product', 'name images price category slug')
      .sort({ createdAt: -1 });

    const reviews = await reviewsQuery;

    // Filter by search term if provided
    let filteredReviews = reviews;
    if (search && typeof search === 'string') {
      const q = search.toLowerCase();
      filteredReviews = reviews.filter((r: any) => {
        const userName = r.user?.name?.toLowerCase() || '';
        const userEmail = r.user?.email?.toLowerCase() || '';
        const prodName = r.product?.name?.toLowerCase() || '';
        const title = r.title?.toLowerCase() || '';
        const comment = r.comment?.toLowerCase() || '';
        return (
          userName.includes(q) ||
          userEmail.includes(q) ||
          prodName.includes(q) ||
          title.includes(q) ||
          comment.includes(q)
        );
      });
    }

    // Overall metrics for admin dashboard
    const totalAll = await Review.countDocuments({});
    const totalApproved = await Review.countDocuments({ isApproved: true });
    const totalPending = await Review.countDocuments({ isApproved: false });

    // Distinct products with review counts
    const productStats = await Review.aggregate([
      {
        $group: {
          _id: '$product',
          totalReviews: { $sum: 1 },
          approvedReviews: { $sum: { $cond: ['$isApproved', 1, 0] } },
          pendingReviews: { $sum: { $cond: ['$isApproved', 0, 1] } },
          avgRating: { $avg: '$rating' },
        },
      },
      {
        $lookup: {
          from: 'products',
          localField: '_id',
          foreignField: '_id',
          as: 'productDetails',
        },
      },
      { $unwind: '$productDetails' },
      {
        $project: {
          _id: 1,
          totalReviews: 1,
          approvedReviews: 1,
          pendingReviews: 1,
          avgRating: { $round: ['$avgRating', 1] },
          productName: '$productDetails.name',
          productImage: { $arrayElemAt: ['$productDetails.images', 0] },
          productCategory: '$productDetails.category',
          productSlug: '$productDetails.slug',
        },
      },
      { $sort: { totalReviews: -1 } },
    ]);

    res.status(200).json({
      success: true,
      count: filteredReviews.length,
      stats: {
        total: totalAll,
        approved: totalApproved,
        pending: totalPending,
        productsCount: productStats.length,
      },
      productStats,
      data: filteredReviews,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Admin: Approve / Unapprove Review
 */
export const toggleApproveReview = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { id } = req.params;
    const review = await Review.findById(id).populate('product', 'name');

    if (!review) {
      return next(new ApiError('Review not found', 404));
    }

    if (typeof req.body.isApproved === 'boolean') {
      review.isApproved = req.body.isApproved;
    } else {
      review.isApproved = !review.isApproved;
    }

    await review.save();

    // Recalculate product rating with new approval status
    await updateProductRatingStats(review.product);

    res.status(200).json({
      success: true,
      message: review.isApproved
        ? 'Review approved successfully! It is now visible on the product page.'
        : 'Review unapproved and set back to pending moderation.',
      data: review,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Customer / Admin: Delete Review
 * Allowed for:
 * 1. The customer who wrote the review
 * 2. Admin
 */
export const deleteReview = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { id } = req.params;
    const review = await Review.findById(id);

    if (!review) {
      return next(new ApiError('Review not found', 404));
    }

    const isOwner = req.user && review.user.toString() === req.user._id.toString();
    const isAdmin = req.user?.role === 'admin';

    if (!isOwner && !isAdmin) {
      return next(
        new ApiError('Not authorized to delete this review. You can only delete your own reviews.', 403)
      );
    }

    const productId = review.product;
    await review.deleteOne();

    // Recalculate product rating
    await updateProductRatingStats(productId);

    res.status(200).json({
      success: true,
      message: 'Review deleted successfully',
      data: { reviewId: id, productId },
    });
  } catch (error) {
    next(error);
  }
};
