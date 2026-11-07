import express, { Application, Request, Response } from 'express';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import path from 'path';
import fs from 'fs';
import { env } from './config/env';
import { disableConsoleInProduction } from './utils/disableConsole';
import { connectDB } from './config/db';
import { ensureAdminUser } from './utils/adminInit';
import { errorHandler, notFoundHandler } from './middleware/error';

// Override verbose console methods in production mode (preserves console.error for critical crash reports)
disableConsoleInProduction({ preserveError: true });


// Route imports
import authRoutes from './routes/authRoutes';
import productRoutes from './routes/productRoutes';
import orderRoutes from './routes/orderRoutes';
import wishlistRoutes from './routes/wishlistRoutes';
import reviewRoutes from './routes/reviewRoutes';
import careerRoutes from './routes/careerRoutes';
import contactRoutes from './routes/contactRoutes';
import couponRoutes from './routes/couponRoutes';
import adminRoutes from './routes/adminRoutes';

const app: Application = express();

// Security Headers (configured to allow cross-origin image requests)
app.use(
  helmet({
    contentSecurityPolicy: false,
    crossOriginEmbedderPolicy: false,
    crossOriginResourcePolicy: { policy: 'cross-origin' },
  })
);

// CORS configuration (CLIENT_URL may be a comma-separated list; trailing slashes are ignored)
const allowedOrigins: (string | RegExp)[] = [
  ...env.CLIENT_URL.split(',')
    .concat([
      'http://localhost:5173',
      'http://127.0.0.1:5173',
      'https://hydra24n.com',
      'https://www.hydra24n.com',
      'https://hydra-nature.vercel.app',
      'https://hydra-nature-cyan.vercel.app',
    ])
    .map((url) => url.trim().replace(/\/+$/, ''))
    .filter(Boolean),
  // Any Vercel domain for this project (e.g. hydra-nature-cyan.vercel.app, preview deployments)
  /^https:\/\/hydra-nature(-[a-z0-9-]+)?\.vercel\.app$/,
];

app.use(
  cors({
    origin: allowedOrigins,
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With'],
  })
);

// Rate Limiting (Relaxed in dev, strict in prod)
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 1000,
  message: {
    success: false,
    message: 'Too many requests from this IP, please try again after 15 minutes',
  },
  standardHeaders: true,
  legacyHeaders: false,
});
app.use('/api', limiter);

// Parsers
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));
app.use(cookieParser());

// Static file uploads directory with cross-origin headers enabled
const uploadsPath = fs.existsSync(path.resolve(__dirname, '../uploads'))
  ? path.resolve(__dirname, '../uploads')
  : path.resolve(process.cwd(), 'uploads');

app.use(
  '/uploads',
  cors({ origin: '*' }),
  express.static(uploadsPath, {
    setHeaders: (res) => {
      res.setHeader('Cross-Origin-Resource-Policy', 'cross-origin');
      res.setHeader('Access-Control-Allow-Origin', '*');
      res.setHeader('Cache-Control', 'public, max-age=86400');
    },
  })
);

// Root endpoint
app.get('/', (req: Request, res: Response) => {
  res.status(200).json({
    success: true,
    message: 'HYDRA Skincare API is running',
    health: '/health',
    api: '/api',
  });
});

// Health check endpoint
app.get('/health', (req: Request, res: Response) => {
  res.status(200).json({
    status: 'ok',
    brand: 'HYDRA Skincare',
    timestamp: new Date().toISOString(),
  });
});

// API Routes Mounting
app.use('/api/auth', authRoutes);
app.use('/api/products', productRoutes);
app.use('/api/orders', orderRoutes);
app.use('/api/wishlist', wishlistRoutes);
app.use('/api/reviews', reviewRoutes);
app.use('/api/careers', careerRoutes);
app.use('/api/contact', contactRoutes);
app.use('/api/coupons', couponRoutes);
app.use('/api/admin', adminRoutes);

// Error Handlers
app.use(notFoundHandler);
app.use(errorHandler);

// Start Server
const PORT = parseInt(env.PORT, 10) || 5000;

export const startServer = async () => {
  try {
    await connectDB();
    // Verify default admin exists without running mock seeds in production
    await ensureAdminUser();

    const server = app.listen(PORT, () => {
      console.log(`===============================================`);
      console.log(`  🌿 HYDRA Skincare API Server running on port ${PORT}`);
      console.log(`  🌿 Environment: ${env.NODE_ENV}`);
      console.log(`  🌿 Client URL: ${env.CLIENT_URL}`);
      console.log(`===============================================`);
    });

    return server;
  } catch (error) {
    console.error('Failed to start server:', error);
    process.exit(1);
  }
};

if (process.env.NODE_ENV !== 'test') {
  startServer();
}

export default app;
