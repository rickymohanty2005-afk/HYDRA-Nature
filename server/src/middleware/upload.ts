import multer from 'multer';
import path from 'path';
import fs from 'fs';

// Ensure local uploads directory exists
const uploadDir = path.resolve(__dirname, '../../uploads/products');
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

// Multer disk storage for local image persistence
const diskStorage = multer.diskStorage({
  destination: (_req, _file, cb) => {
    cb(null, uploadDir);
  },
  filename: (_req, file, cb) => {
    // Generate clean sanitized filename
    const ext = path.extname(file.originalname).toLowerCase() || '.jpg';
    const uniqueSuffix = `${Date.now()}-${Math.round(Math.random() * 1e9)}`;
    cb(null, `formulation-${uniqueSuffix}${ext}`);
  },
});

export const upload = multer({
  storage: diskStorage,
  limits: {
    fileSize: 50 * 1024 * 1024, // 50MB limit per file (supports product photos & videos)
  },
  fileFilter: (_req, file, cb) => {
    if (file.mimetype.startsWith('image/') || file.mimetype.startsWith('video/')) {
      cb(null, true);
    } else {
      cb(new Error('Only image (JPG, PNG, WEBP, AVIF, GIF) or video (MP4, WEBM, MOV) files are allowed.'));
    }
  },
});

// Ensure local reviews upload directory exists
const reviewUploadDir = path.resolve(__dirname, '../../uploads/reviews');
if (!fs.existsSync(reviewUploadDir)) {
  fs.mkdirSync(reviewUploadDir, { recursive: true });
}

// Multer disk storage for customer review photos
const reviewDiskStorage = multer.diskStorage({
  destination: (_req, _file, cb) => {
    cb(null, reviewUploadDir);
  },
  filename: (_req, file, cb) => {
    const ext = path.extname(file.originalname).toLowerCase() || '.jpg';
    const uniqueSuffix = `${Date.now()}-${Math.round(Math.random() * 1e9)}`;
    cb(null, `review-${uniqueSuffix}${ext}`);
  },
});

export const reviewUpload = multer({
  storage: reviewDiskStorage,
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB limit per image
    files: 5, // up to 5 images per review
  },
  fileFilter: (_req, file, cb) => {
    if (file.mimetype.startsWith('image/')) {
      cb(null, true);
    } else {
      cb(new Error('Only image files (JPEG, PNG, WEBP, AVIF, GIF) are allowed for reviews.'));
    }
  },
});
