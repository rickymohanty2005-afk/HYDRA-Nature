import { Router } from 'express';
import {
  getProductReviews,
  createReview,
  deleteReview,
  getAllReviewsAdmin,
  toggleApproveReview,
  uploadReviewImagesHandler,
} from '../controllers/reviewController';
import { protect, authorize, optionalAuth } from '../middleware/auth';
import { reviewUpload } from '../middleware/upload';

const router = Router();

// Admin review management routes (MUST come before /:productId to avoid route param collision)
router.get('/admin', protect, authorize('admin'), getAllReviewsAdmin);
router.patch('/:id/approve', protect, authorize('admin'), toggleApproveReview);

// Delete review (Customer can delete their own review; Admin can delete any review)
router.delete('/:id', protect, deleteReview);

// Customer / Public review routes
// Upload review images standalone route
router.post('/upload', protect, reviewUpload.array('images', 5), uploadReviewImagesHandler);

// Create or update review (supports direct multipart with 'images' files, or JSON)
router.post('/:productId', protect, reviewUpload.array('images', 5), createReview);
router.get('/:productId', optionalAuth, getProductReviews);

export default router;
