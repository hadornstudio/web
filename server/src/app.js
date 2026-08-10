import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import mongoSanitize from 'express-mongo-sanitize';

import { connectDB } from './config/db.js';
import { generalLimiter } from './middleware/rateLimiter.js';
import { notFound } from './middleware/notFound.js';
import { errorHandler } from './middleware/errorHandler.js';

import authRoutes from './routes/auth.routes.js';
import categoryRoutes from './routes/category.routes.js';
import productRoutes from './routes/product.routes.js';
import reviewRoutes from './routes/review.routes.js';
import couponRoutes from './routes/coupon.routes.js';
import userRoutes from './routes/user.routes.js';
import orderRoutes from './routes/order.routes.js';
import paymentRoutes, { webhookHandler } from './routes/payment.routes.js';
import inquiryRoutes from './routes/inquiry.routes.js';
import uploadRoutes from './routes/upload.routes.js';
import analyticsRoutes from './routes/analytics.routes.js';
import galleryRoutes from './routes/gallery.routes.js';
import promoRoutes from './routes/promo.routes.js';
import adRoutes from './routes/ad.routes.js';
import shippingRoutes from './routes/shipping.routes.js';

const app = express();

app.use(helmet());
app.use(
  cors({
    origin: process.env.CLIENT_URL || 'http://localhost:5173',
    credentials: true,
  })
);
if (process.env.NODE_ENV !== 'test') {
  app.use(morgan(process.env.NODE_ENV === 'production' ? 'combined' : 'dev'));
}

// On a serverless platform (Vercel), this file's default export is what actually gets
// invoked per-request — server.js's connectDB()-then-listen() boot sequence never runs
// there. Without this, the first request(s) on a cold start would race ahead of the DB
// connection and every query would hang until Mongoose's buffering timeout. Cheap no-op
// once connected (readyState check short-circuits), so this costs nothing once warm.
app.use(async (req, res, next) => {
  try {
    await connectDB();
    next();
  } catch (err) {
    next(err);
  }
});

// Paystack webhook needs the raw body for signature verification —
// must be mounted before the global express.json() body parser.
app.post('/api/payments/webhook', express.raw({ type: 'application/json' }), webhookHandler);

app.use(express.json());

// Strips any key starting with '$' or containing '.' from req.body/query/params —
// blocks MongoDB operator injection (e.g. ?category[$ne]=null) on routes that build a
// Mongoose filter straight from user input without express-validator in front of it.
app.use(mongoSanitize());

app.use(generalLimiter);

app.get('/api/health', (req, res) => res.json({ success: true, message: 'Hadorn API is running' }));

app.use('/api/auth', authRoutes);
app.use('/api/categories', categoryRoutes);
app.use('/api/products', productRoutes);
app.use('/api/reviews', reviewRoutes);
app.use('/api/coupons', couponRoutes);
app.use('/api/users', userRoutes);
app.use('/api/orders', orderRoutes);
app.use('/api/payments', paymentRoutes);
app.use('/api/inquiries', inquiryRoutes);
app.use('/api/uploads', uploadRoutes);
app.use('/api/analytics', analyticsRoutes);
app.use('/api/gallery', galleryRoutes);
app.use('/api/promos', promoRoutes);
app.use('/api/ads', adRoutes);
app.use('/api/shipping', shippingRoutes);

app.use(notFound);
app.use(errorHandler);

export default app;
