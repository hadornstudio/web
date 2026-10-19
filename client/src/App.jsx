import { lazy, Suspense } from 'react';
import { Routes, Route } from 'react-router-dom';
import Layout from './components/layout/Layout';
import ProtectedRoute from './routes/ProtectedRoute';
import AdminRoute from './routes/AdminRoute';
import ScrollToTop from './components/common/ScrollToTop';
import PageTransitionOverlay from './components/common/PageTransitionOverlay';

import HomePage from './pages/HomePage';
import CatalogPage from './pages/CatalogPage';
import ProductDetailPage from './pages/ProductDetailPage';
import CartPage from './pages/CartPage';

// The showroom pulls in three.js + react-three-fiber (~0.7 MB), so it loads only when visited.
const ShowroomPage = lazy(() => import('./pages/ShowroomPage'));
// Everything outside the storefront core loads on demand, so the home/shop/product pages stay light.
const CheckoutPage = lazy(() => import('./pages/CheckoutPage'));
const OrderConfirmationPage = lazy(() => import('./pages/OrderConfirmationPage'));
const LoginPage = lazy(() => import('./pages/LoginPage'));
const RegisterPage = lazy(() => import('./pages/RegisterPage'));
const AccountDashboardPage = lazy(() => import('./pages/AccountDashboardPage'));
const CustomOrderInquiryPage = lazy(() => import('./pages/CustomOrderInquiryPage'));
const GalleryPage = lazy(() => import('./pages/GalleryPage'));
const NotFoundPage = lazy(() => import('./pages/NotFoundPage'));
const AdminLayout = lazy(() => import('./components/admin/AdminLayout'));
const AdminDashboardPage = lazy(() => import('./pages/admin/AdminDashboardPage'));
const AdminProductsListPage = lazy(() => import('./pages/admin/AdminProductsListPage'));
const AdminProductFormPage = lazy(() => import('./pages/admin/AdminProductFormPage'));
const AdminCategoriesListPage = lazy(() => import('./pages/admin/AdminCategoriesListPage'));
const AdminCategoryFormPage = lazy(() => import('./pages/admin/AdminCategoryFormPage'));
const AdminOrdersListPage = lazy(() => import('./pages/admin/AdminOrdersListPage'));
const AdminOrderDetailPage = lazy(() => import('./pages/admin/AdminOrderDetailPage'));
const AdminCustomersListPage = lazy(() => import('./pages/admin/AdminCustomersListPage'));
const AdminCouponsListPage = lazy(() => import('./pages/admin/AdminCouponsListPage'));
const AdminCouponFormPage = lazy(() => import('./pages/admin/AdminCouponFormPage'));
const AdminInquiriesListPage = lazy(() => import('./pages/admin/AdminInquiriesListPage'));
const AdminGalleryListPage = lazy(() => import('./pages/admin/AdminGalleryListPage'));
const AdminGalleryFormPage = lazy(() => import('./pages/admin/AdminGalleryFormPage'));
const AdminGalleryLikesPage = lazy(() => import('./pages/admin/AdminGalleryLikesPage'));
const AdminPromosListPage = lazy(() => import('./pages/admin/AdminPromosListPage'));
const AdminPromoFormPage = lazy(() => import('./pages/admin/AdminPromoFormPage'));
const AdminAdsListPage = lazy(() => import('./pages/admin/AdminAdsListPage'));
const AdminAdFormPage = lazy(() => import('./pages/admin/AdminAdFormPage'));
const AdminShippingPage = lazy(() => import('./pages/admin/AdminShippingPage'));



export default function App() {
  return (
    <>
      <ScrollToTop />
      <PageTransitionOverlay />
      <Routes>
        <Route
          path="showroom"
          element={
            <Suspense fallback={<div className="fixed inset-0 bg-night" />}>
              <ShowroomPage />
            </Suspense>
          }
        />

        <Route element={<Layout />}>
          <Route index element={<HomePage />} />
          <Route path="shop" element={<CatalogPage />} />
          <Route path="shop/:categorySlug" element={<CatalogPage />} />
          <Route path="product/:slug" element={<ProductDetailPage />} />
          <Route path="cart" element={<CartPage />} />
          <Route path="login" element={<LoginPage />} />
          <Route path="register" element={<RegisterPage />} />
          <Route path="custom-order" element={<CustomOrderInquiryPage />} />
          <Route path="gallery" element={<GalleryPage />} />

          <Route element={<ProtectedRoute />}>
            <Route path="checkout" element={<CheckoutPage />} />
            <Route path="order-confirmation/:orderId" element={<OrderConfirmationPage />} />
            <Route path="account/*" element={<AccountDashboardPage />} />
          </Route>

          <Route path="*" element={<NotFoundPage />} />
        </Route>

        <Route element={<AdminRoute />}>
          <Route
            path="admin"
            element={
              <Suspense fallback={<div className="min-h-screen bg-paper" />}>
                <AdminLayout />
              </Suspense>
            }
          >
            <Route index element={<AdminDashboardPage />} />
            <Route path="products" element={<AdminProductsListPage />} />
            <Route path="products/new" element={<AdminProductFormPage />} />
            <Route path="products/:id/edit" element={<AdminProductFormPage />} />
            <Route path="categories" element={<AdminCategoriesListPage />} />
            <Route path="categories/new" element={<AdminCategoryFormPage />} />
            <Route path="categories/:id/edit" element={<AdminCategoryFormPage />} />
            <Route path="orders" element={<AdminOrdersListPage />} />
            <Route path="orders/:id" element={<AdminOrderDetailPage />} />
            <Route path="customers" element={<AdminCustomersListPage />} />
            <Route path="coupons" element={<AdminCouponsListPage />} />
            <Route path="coupons/new" element={<AdminCouponFormPage />} />
            <Route path="coupons/:id/edit" element={<AdminCouponFormPage />} />
            <Route path="inquiries" element={<AdminInquiriesListPage />} />
            <Route path="gallery" element={<AdminGalleryListPage />} />
            <Route path="gallery/new" element={<AdminGalleryFormPage />} />
            <Route path="gallery/:id/edit" element={<AdminGalleryFormPage />} />
            <Route path="gallery-likes" element={<AdminGalleryLikesPage />} />
            <Route path="promos" element={<AdminPromosListPage />} />
            <Route path="promos/new" element={<AdminPromoFormPage />} />
            <Route path="promos/:id/edit" element={<AdminPromoFormPage />} />
            <Route path="ads" element={<AdminAdsListPage />} />
            <Route path="ads/new" element={<AdminAdFormPage />} />
            <Route path="ads/:id/edit" element={<AdminAdFormPage />} />
            <Route path="shipping" element={<AdminShippingPage />} />
          </Route>
        </Route>
      </Routes>
    </>
  );
}
