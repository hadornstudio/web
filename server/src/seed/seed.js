import '../config/env.js';

import mongoose from 'mongoose';
import { connectDB } from '../config/db.js';

import Category from '../models/Category.js';
import Product from '../models/Product.js';
import Coupon from '../models/Coupon.js';
import User from '../models/User.js';
import Review from '../models/Review.js';
import Order from '../models/Order.js';
import Inquiry from '../models/Inquiry.js';
import GalleryItem from '../models/GalleryItem.js';
import Like from '../models/Like.js';

import { categoriesData } from './data/categories.data.js';
import { rawProducts } from './data/products.data.js';
import { couponsData } from './data/coupons.data.js';
import { testimonialAvatars } from './data/images.js';
import { galleryItemsData } from './data/gallery.data.js';

const DEMO_CUSTOMERS = [
  { name: 'Maya Ellison', email: 'maya@demo.hadorn.com' },
  { name: 'Priya Nair', email: 'priya@demo.hadorn.com' },
  { name: 'Sofia Reyes', email: 'sofia@demo.hadorn.com' },
  { name: 'Grace Whitfield', email: 'grace@demo.hadorn.com' },
];

const REVIEW_COMMENTS = [
  { rating: 5, title: 'Exactly as pictured', comment: 'The knotting between beads is such a nice touch — feels much more considered than anything else I own.' },
  { rating: 5, title: 'A new favorite', comment: 'Lightweight, well finished, and the clasp feels genuinely well made. Wearing it daily.' },
  { rating: 4, title: 'Beautiful, runs slightly long', comment: 'Gorgeous piece — just a touch longer than I expected, but easy enough to layer shorter.' },
  { rating: 5, title: 'Perfect gift', comment: 'Bought this for my sister and she has not taken it off since. Packaging was lovely too.' },
  { rating: 5, title: 'Craftsmanship shows', comment: 'You can tell this was made by hand — no two beads are identical and that is exactly the appeal.' },
  { rating: 3, title: 'Nice but delicate', comment: 'Lovely design, just wish the cord felt a bit sturdier for everyday wear.' },
];

async function seed() {
  await connectDB();
  console.log('Connected — clearing existing demo data...');

  await Promise.all([
    Review.deleteMany({}),
    Product.deleteMany({}),
    Category.deleteMany({}),
    Coupon.deleteMany({}),
    Order.deleteMany({}),
    Inquiry.deleteMany({}),
    GalleryItem.deleteMany({}),
    Like.deleteMany({}),
    User.deleteMany({ email: { $in: [process.env.SEED_ADMIN_EMAIL, ...DEMO_CUSTOMERS.map((c) => c.email)] } }),
  ]);

  console.log('Creating categories...');
  const categories = await Category.insertMany(categoriesData);
  const categoryByType = Object.fromEntries(categories.map((c) => [c.type, c._id]));

  console.log('Creating products...');
  const productsToInsert = rawProducts.map(({ category, ...rest }) => ({
    ...rest,
    category: categoryByType[category],
  }));
  const products = await Product.insertMany(productsToInsert);
  console.log(`Created ${products.length} products.`);

  console.log('Creating coupons...');
  await Coupon.insertMany(couponsData);

  console.log('Creating admin user...');
  await User.create({
    name: 'Hadorn Admin',
    email: process.env.SEED_ADMIN_EMAIL || 'admin@hadorn.com',
    password: process.env.SEED_ADMIN_PASSWORD || 'Hadorn-Admin-2026',
    role: 'admin',
  });

  console.log('Creating demo customers...');
  const customers = await User.create(
    DEMO_CUSTOMERS.map((c) => ({ ...c, password: 'DemoCustomer123' }))
  );

  console.log('Creating demo reviews...');
  const featuredProducts = products.filter((p) => p.isFeatured);
  const reviewTargets = featuredProducts.length >= 8 ? featuredProducts : products.slice(0, 10);

  let reviewCount = 0;
  for (const product of reviewTargets) {
    const numReviews = 2 + Math.floor(Math.random() * 2); // 2-3
    const shuffledCustomers = [...customers].sort(() => Math.random() - 0.5).slice(0, numReviews);

    for (const customer of shuffledCustomers) {
      const template = REVIEW_COMMENTS[Math.floor(Math.random() * REVIEW_COMMENTS.length)];
      try {
        await Review.create({
          product: product._id,
          user: customer._id,
          rating: template.rating,
          title: template.title,
          comment: template.comment,
          isVerifiedPurchase: Math.random() > 0.4,
        });
        reviewCount += 1;
      } catch (err) {
        // duplicate (product,user) pair from the shuffle — skip silently, not worth retrying for seed data
      }
    }
  }
  console.log(`Created ${reviewCount} reviews.`);

  console.log('Creating gallery items...');
  const galleryItemsToInsert = galleryItemsData.map(({ categoryType, linkToProduct, ...rest }) => ({
    ...rest,
    category: categoryType ? categoryByType[categoryType] : undefined,
    product: linkToProduct ? products.find((p) => String(p.category) === String(categoryByType.bracelets))?._id : undefined,
  }));
  const galleryItems = await GalleryItem.insertMany(galleryItemsToInsert);

  console.log('Creating demo gallery likes...');
  let likeCount = 0;
  for (const item of galleryItems) {
    const numLikes = Math.floor(Math.random() * 3); // 0-2 likers per piece
    const likers = [...customers].sort(() => Math.random() - 0.5).slice(0, numLikes);
    for (const customer of likers) {
      await Like.create({ user: customer._id, galleryItem: item._id });
      likeCount += 1;
    }
  }
  console.log(`Created ${likeCount} likes.`);

  console.log('\nSeed complete.');
  console.log(`Admin login: ${process.env.SEED_ADMIN_EMAIL || 'admin@hadorn.com'} / ${process.env.SEED_ADMIN_PASSWORD || 'Hadorn-Admin-2026'}`);
  console.log('Demo customer login: maya@demo.hadorn.com / DemoCustomer123 (same password for all demo customers)');
  console.log(`Testimonial avatar pool available: ${testimonialAvatars.length} images`);

  await mongoose.disconnect();
  process.exit(0);
}

seed().catch((err) => {
  console.error('Seed failed:', err);
  process.exit(1);
});
