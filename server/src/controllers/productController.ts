import { Request, Response, NextFunction } from 'express';
import { Product } from '../models/Product';
import { ApiError } from '../utils/apiError';
import cloudinary from '../config/cloudinary';

// Helper to normalize input into string arrays
const parseStringArray = (input: any): string[] => {
  if (!input) return [];
  if (Array.isArray(input)) {
    return input.map((item) => String(item).trim()).filter(Boolean);
  }
  if (typeof input === 'string') {
    return input
      .split(/[\n,]+/)
      .map((s) => s.trim())
      .filter(Boolean);
  }
  return [];
};

// Helper to generate a unique SEO-friendly slug
const generateUniqueSlug = async (name: string, excludeId?: string): Promise<string> => {
  let baseSlug = name
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');

  if (!baseSlug) {
    baseSlug = `formulation-${Date.now().toString(36)}`;
  }

  let slug = baseSlug;
  let counter = 1;

  while (true) {
    const query: any = { slug };
    if (excludeId) {
      query._id = { $ne: excludeId };
    }
    const exists = await Product.findOne(query).select('_id');
    if (!exists) {
      break;
    }
    slug = `${baseSlug}-${counter}`;
    counter++;
  }

  return slug;
};

// Product photos are mandatory (1-6), supplied by the admin. No automatic fallback image.
const MAX_PRODUCT_IMAGES = 6;

// 1. Get all products with full dynamic filters, sorting, search, and pagination
export const getAllProducts = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const {
      search,
      category,
      subcategory,
      tag,
      minPrice,
      maxPrice,
      rating,
      inStock,
      sort,
      page = 1,
      limit = 12,
      featured,
      bestseller,
      all,
      isActive,
    } = req.query;

    const query: any = {};

    // Filter by active status (Public client sees active only; Admin can pass all=true or specific isActive)
    if (String(all) !== 'true') {
      if (isActive !== undefined) {
        query.isActive = String(isActive) === 'true';
      } else {
        query.isActive = true;
      }
    }

    // Dynamic search across multiple fields
    if (search && String(search).trim()) {
      const term = String(search).trim();
      const regex = new RegExp(term, 'i');
      query.$or = [
        { name: regex },
        { subtitle: regex },
        { description: regex },
        { category: regex },
        { subcategory: regex },
        { tag: regex },
        { ingredients: regex },
      ];
    }

    // Category filter
    if (category && category !== 'All' && category !== 'All Products') {
      query.category = { $regex: new RegExp(`^${category}$`, 'i') };
    }

    // Subcategory filter
    if (subcategory && subcategory !== 'All') {
      query.subcategory = { $regex: new RegExp(`^${subcategory}$`, 'i') };
    }

    // Tag filter
    if (tag && tag !== 'All') {
      query.tag = { $regex: new RegExp(`^${tag}$`, 'i') };
    }

    // Featured / Bestseller flags
    if (String(featured) === 'true') {
      query.isFeatured = true;
    }
    if (String(bestseller) === 'true') {
      query.isBestSeller = true;
    }

    // In stock filter
    if (String(inStock) === 'true') {
      query.stock = { $gt: 0 };
    }

    // Price range filter
    if (minPrice !== undefined || maxPrice !== undefined) {
      query.price = {};
      if (minPrice !== undefined && !isNaN(Number(minPrice))) {
        query.price.$gte = Number(minPrice);
      }
      if (maxPrice !== undefined && !isNaN(Number(maxPrice))) {
        query.price.$lte = Number(maxPrice);
      }
    }

    // Rating filter
    if (rating !== undefined && !isNaN(Number(rating))) {
      query.rating = { $gte: Number(rating) };
    }

    // Dynamic sorting
    let sortQuery: any = { createdAt: -1 };
    switch (sort) {
      case 'price-asc':
        sortQuery = { price: 1, _id: 1 };
        break;
      case 'price-desc':
        sortQuery = { price: -1, _id: -1 };
        break;
      case 'rating':
        sortQuery = { rating: -1, reviewCount: -1 };
        break;
      case 'popular':
        sortQuery = { isBestSeller: -1, reviewCount: -1, rating: -1 };
        break;
      case 'newest':
        sortQuery = { createdAt: -1 };
        break;
      case 'name-asc':
        sortQuery = { name: 1 };
        break;
      case 'name-desc':
        sortQuery = { name: -1 };
        break;
      default:
        sortQuery = { createdAt: -1 };
    }

    const pageNum = Math.max(1, parseInt(page as string, 10) || 1);
    const limitNum = Math.min(100, Math.max(1, parseInt(limit as string, 10) || 12));
    const skip = (pageNum - 1) * limitNum;

    const [total, products] = await Promise.all([
      Product.countDocuments(query),
      Product.find(query).sort(sortQuery).skip(skip).limit(limitNum),
    ]);

    res.status(200).json({
      success: true,
      count: products.length,
      total,
      totalPages: Math.ceil(total / limitNum) || 1,
      currentPage: pageNum,
      data: products,
    });
  } catch (error) {
    next(error);
  }
};

// 2. Get single product by ID or Slug
export const getProductByIdOrSlug = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { idOrSlug } = req.params;
    let product;

    if (idOrSlug.match(/^[0-9a-fA-F]{24}$/)) {
      product = await Product.findById(idOrSlug);
    } else {
      product = await Product.findOne({ slug: idOrSlug });
    }

    if (!product) {
      return next(new ApiError('Product not found', 404));
    }

    // Related products from the same category
    const relatedProducts = await Product.find({
      category: product.category,
      _id: { $ne: product._id },
      isActive: true,
    })
      .limit(4)
      .sort({ rating: -1 });

    res.status(200).json({
      success: true,
      data: {
        product,
        relatedProducts,
      },
    });
  } catch (error) {
    next(error);
  }
};

// 3. Create real dynamic product (Admin)
export const createProduct = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const {
      name,
      subtitle,
      description,
      price,
      originalPrice,
      category,
      subcategory,
      tag,
      images,
      stock,
      ingredients,
      keyBenefits,
      howToUse,
      size,
      skinType,
      isBestSeller,
      isFeatured,
      isActive,
    } = req.body;

    if (!name || !name.trim()) {
      return next(new ApiError('Product name is required', 400));
    }
    if (!description || !description.trim()) {
      return next(new ApiError('Product description is required', 400));
    }
    if (price === undefined || isNaN(Number(price))) {
      return next(new ApiError('Valid product price is required', 400));
    }
    if (!category || !category.trim()) {
      return next(new ApiError('Category is required', 400));
    }

    const numPrice = Math.max(0, Number(price));
    const numOriginalPrice = originalPrice !== undefined && !isNaN(Number(originalPrice))
      ? Math.max(0, Number(originalPrice))
      : numPrice;

    const discountPercentage = numOriginalPrice > numPrice
      ? Math.round(((numOriginalPrice - numPrice) / numOriginalPrice) * 100)
      : 0;

    const parsedImages = parseStringArray(images);
    if (parsedImages.length === 0) {
      return next(new ApiError('At least one product photo is required', 400));
    }
    if (parsedImages.length > MAX_PRODUCT_IMAGES) {
      return next(new ApiError(`A product can have at most ${MAX_PRODUCT_IMAGES} photos`, 400));
    }

    const slug = await generateUniqueSlug(name);

    const product = await Product.create({
      name: name.trim(),
      slug,
      subtitle: subtitle ? subtitle.trim() : '',
      description: description.trim(),
      price: numPrice,
      originalPrice: numOriginalPrice,
      discountPercentage,
      category: category.trim(),
      subcategory: subcategory ? subcategory.trim() : '',
      tag: tag ? tag.trim() : '',
      images: parsedImages,
      stock: stock !== undefined && !isNaN(Number(stock)) ? Math.max(0, Number(stock)) : 50,
      size: size ? size.trim() : '50ml',
      ingredients: parseStringArray(ingredients),
      keyBenefits: parseStringArray(keyBenefits),
      howToUse: parseStringArray(howToUse),
      skinType: parseStringArray(skinType).length > 0 ? parseStringArray(skinType) : ['All Skin Types'],
      isBestSeller: Boolean(isBestSeller),
      isFeatured: isFeatured !== undefined ? Boolean(isFeatured) : false,
      isActive: isActive !== undefined ? Boolean(isActive) : true,
      rating: 5.0,
      reviewCount: 0,
    });

    res.status(201).json({
      success: true,
      message: 'Product created and saved successfully',
      data: product,
    });
  } catch (error) {
    next(error);
  }
};

// 4. Update product (Admin)
export const updateProduct = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { id } = req.params;

    const product = await Product.findById(id);
    if (!product) {
      return next(new ApiError('Product not found', 404));
    }

    const updates: any = { ...req.body };

    // Regenerate unique slug if name changed and slug not explicitly updated
    if (updates.name && updates.name.trim() !== product.name && !updates.slug) {
      updates.slug = await generateUniqueSlug(updates.name, product._id.toString());
    }

    // Price and discount calculations
    if (updates.price !== undefined || updates.originalPrice !== undefined) {
      const newPrice = updates.price !== undefined ? Math.max(0, Number(updates.price)) : product.price;
      const newOriginalPrice = updates.originalPrice !== undefined
        ? Math.max(0, Number(updates.originalPrice))
        : product.originalPrice;

      updates.price = newPrice;
      updates.originalPrice = newOriginalPrice;
      updates.discountPercentage = newOriginalPrice > newPrice
        ? Math.round(((newOriginalPrice - newPrice) / newOriginalPrice) * 100)
        : 0;
    }

    // Normalize arrays if provided
    if (updates.images !== undefined) {
      const parsedImages = parseStringArray(updates.images);
      if (parsedImages.length === 0) {
        return next(new ApiError('At least one product photo is required', 400));
      }
      if (parsedImages.length > MAX_PRODUCT_IMAGES) {
        return next(new ApiError(`A product can have at most ${MAX_PRODUCT_IMAGES} photos`, 400));
      }
      updates.images = parsedImages;
    }
    if (updates.ingredients !== undefined) {
      updates.ingredients = parseStringArray(updates.ingredients);
    }
    if (updates.keyBenefits !== undefined) {
      updates.keyBenefits = parseStringArray(updates.keyBenefits);
    }
    if (updates.howToUse !== undefined) {
      updates.howToUse = parseStringArray(updates.howToUse);
    }
    if (updates.skinType !== undefined) {
      updates.skinType = parseStringArray(updates.skinType);
    }

    if (updates.stock !== undefined && !isNaN(Number(updates.stock))) {
      updates.stock = Math.max(0, Number(updates.stock));
    }

    const updatedProduct = await Product.findByIdAndUpdate(id, updates, {
      new: true,
      runValidators: true,
    });

    res.status(200).json({
      success: true,
      message: 'Product updated successfully',
      data: updatedProduct,
    });
  } catch (error) {
    next(error);
  }
};

// 5. Delete product (Admin)
export const deleteProduct = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { id } = req.params;

    const product = await Product.findById(id);
    if (!product) {
      return next(new ApiError('Product not found', 404));
    }

    await product.deleteOne();

    res.status(200).json({
      success: true,
      message: 'Product deleted successfully',
      data: { id },
    });
  } catch (error) {
    next(error);
  }
};

// 6. Get all categories with dynamic counts
export const getCategories = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { all } = req.query;
    const matchQuery: any = {};
    if (String(all) !== 'true') {
      matchQuery.isActive = true;
    }

    const categoriesWithCount = await Product.aggregate([
      { $match: matchQuery },
      { $group: { _id: '$category', count: { $sum: 1 } } },
      { $sort: { count: -1 } },
    ]);

    res.status(200).json({
      success: true,
      data: categoriesWithCount.map((c) => ({
        name: c._id,
        count: c.count,
      })),
    });
  } catch (error) {
    next(error);
  }
};

// 7. Get dynamic subcategories
export const getSubcategories = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { category, all } = req.query;
    const matchQuery: any = { subcategory: { $exists: true, $ne: '' } };

    if (String(all) !== 'true') {
      matchQuery.isActive = true;
    }

    if (category && category !== 'All' && category !== 'All Products') {
      matchQuery.category = { $regex: new RegExp(`^${category}$`, 'i') };
    }

    const subcategories = await Product.distinct('subcategory', matchQuery);

    res.status(200).json({
      success: true,
      data: subcategories.filter(Boolean),
    });
  } catch (error) {
    next(error);
  }
};

// 8. Upload product image handler (Multer Disk Storage + Cloudinary option)
export const uploadProductImage = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    if (!req.file) {
      return next(new ApiError('No image file provided', 400));
    }

    const host = req.get('host') || 'localhost:5012';
    const proto = (req.get('x-forwarded-proto') || req.protocol).split(',')[0];
    const fullUrl = `${proto}://${host}/uploads/products/${req.file.filename}`;
    const localUrl = `/uploads/products/${req.file.filename}`;

    // If real Cloudinary credentials are configured, sync to Cloudinary
    if (
      process.env.CLOUDINARY_CLOUD_NAME &&
      process.env.CLOUDINARY_CLOUD_NAME !== 'hydra-demo' &&
      process.env.CLOUDINARY_API_KEY &&
      process.env.CLOUDINARY_API_KEY !== '123456789012345'
    ) {
      try {
        const uploadRes = await cloudinary.uploader.upload(req.file.path, {
          folder: 'hydra_products',
        });
        res.status(200).json({
          success: true,
          imageUrl: uploadRes.secure_url,
          filename: req.file.filename,
        });
        return;
      } catch (cErr) {
        console.warn('Cloudinary upload skipped, falling back to local disk storage:', cErr);
      }
    }

    res.status(200).json({
      success: true,
      imageUrl: fullUrl,
      relativeUrl: localUrl,
      filename: req.file.filename,
    });
  } catch (error) {
    next(error);
  }
};

// 9. Upload multiple product images handler
export const uploadProductImages = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const files = req.files as Express.Multer.File[];
    if (!files || files.length === 0) {
      return next(new ApiError('No image files provided', 400));
    }

    const host = req.get('host') || 'localhost:5012';
    const imageUrls = files.map((f) => `${(req.get('x-forwarded-proto') || req.protocol).split(',')[0]}://${host}/uploads/products/${f.filename}`);
    const relativeUrls = files.map((f) => `/uploads/products/${f.filename}`);

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
