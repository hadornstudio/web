# Hadorn

Handcrafted beading & jewelry — MERN e-commerce platform.

## Stack

- **Client**: React (Vite), React Router, Tailwind CSS, React Query, Zustand
- **Server**: Node.js, Express, MongoDB (Atlas) via Mongoose, JWT auth, Paystack (test mode)

## Project structure

```
Hadorn/
├── client/   React SPA
└── server/   Express REST API
```

## Setup

### 1. Server

```bash
cd server
cp .env.example .env
# edit .env: paste your MongoDB Atlas connection string into MONGODB_URI,
# set a real JWT_SECRET
npm install
npm run seed     # populates categories, products, coupons, and a seeded admin user
npm run dev       # starts the API on http://localhost:5000
```

Seeded admin login (for testing admin-only API routes before the admin UI exists):
see `SEED_ADMIN_EMAIL` / `SEED_ADMIN_PASSWORD` in `server/.env`.

### 2. Client

```bash
cd client
cp .env.example .env
npm install
npm run dev       # starts the app on http://localhost:5173
```

### Test checkout

Paystack is wired in test mode, currency NGN. Use test card `4084 0840 8408 4081`, CVV `408`, any future expiry, PIN `0000` if prompted, OTP `123456` if prompted.

### Currency

Prices are in Naira (₦) — this store's Paystack account is NGN-only.

## Status

This is **Phase 1** of a phased build: backend API + core storefront (catalog, product detail, cart, checkout, accounts, reviews, coupons, custom-order inquiries). Motion/animation polish (GSAP/Three.js), the admin dashboard UI, and an optional promo-video generator are later phases — see `/Users/user/.claude/plans/clever-chasing-puffin.md` for the full plan.
# web
