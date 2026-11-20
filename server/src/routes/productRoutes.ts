import { Router } from 'express';
import {
  getAllProducts,
  getProductByIdOrSlug,
  createProduct,
  updateProduct,
  deleteProduct,
  getCategories,
  getSubcategories,
  uploadProductImage,
  uploadProductImages,
} from '../controllers/productController';
import { protect, authorize } from '../middleware/auth';
import { upload } from '../middleware/upload';

const router = Router();

router.get('/', getAllProducts);
router.get('/categories', getCategories);
router.get('/subcategories', getSubcategories);
router.get('/:idOrSlug', getProductByIdOrSlug);

// Admin only routes
router.post('/', protect, authorize('admin'), createProduct);
router.put('/:id', protect, authorize('admin'), updateProduct);
router.delete('/:id', protect, authorize('admin'), deleteProduct);
router.post('/upload', protect, authorize('admin'), upload.single('image'), uploadProductImage);
router.post('/upload-multiple', protect, authorize('admin'), upload.array('images', 6), uploadProductImages);

export default router;
