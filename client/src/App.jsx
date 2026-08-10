import { Routes, Route } from 'react-router-dom';
import Layout from './components/layout/Layout';
import ProtectedRoute from './routes/ProtectedRoute';
import AdminRoute from './routes/AdminRoute';
import AdminLayout from './components/admin/AdminLayout';
import ScrollToTop from './components/common/ScrollToTop';
import PageTransitionOverlay from './components/common/PageTransitionOverlay';

import HomePage from './pages/HomePage';
import CatalogPage from './pages/CatalogPage';
import ProductDetailPage from './pages/ProductDetailPage';
import CartPage from './pages/CartPage';
import CheckoutPage from './pages/CheckoutPage';
import OrderConfirmationPage from './pages/OrderConfirmationPage';
import LoginPage from './pages/LoginPage';
import RegisterPage from './pages/RegisterPage';
import AccountDashboardPage from './pages/AccountDashboardPage';
import CustomOrderInquiryPage from './pages/CustomOrderInquiryPage';
import GalleryPage from './pages/GalleryPage';
import NotFoundPage from './pages/NotFoundPage';

import AdminDashboardPage from './pages/admin/AdminDashboardPage';
import AdminProductsListPage from './pages/admin/AdminProductsListPage';
import AdminProductFormPage from './pages/admin/AdminProductFormPage';
import AdminCategoriesListPage from './pages/admin/AdminCategoriesListPage';
import AdminCategoryFormPage from './pages/admin/AdminCategoryFormPage';
import AdminOrdersListPage from './pages/admin/AdminOrdersListPage';
import AdminOrderDetailPage from './pages/admin/AdminOrderDetailPage';
import AdminCustomersListPage from './pages/admin/AdminCustomersListPage';
import AdminCouponsListPage from './pages/admin/AdminCouponsListPage';
import AdminCouponFormPage from './pages/admin/AdminCouponFormPage';
import AdminInquiriesListPage from './pages/admin/AdminInquiriesListPage';
import AdminGalleryListPage from './pages/admin/AdminGalleryListPage';
import AdminGalleryFormPage from './pages/admin/AdminGalleryFormPage';
import AdminGalleryLikesPage from './pages/admin/AdminGalleryLikesPage';
import AdminPromosListPage from './pages/admin/AdminPromosListPage';
import AdminPromoFormPage from './pages/admin/AdminPromoFormPage';
import AdminAdsListPage from './pages/admin/AdminAdsListPage';
import AdminAdFormPage from './pages/admin/AdminAdFormPage';

export default function App() {
  return (
    <>
      <ScrollToTop />
      <PageTransitionOverlay />
      <Routes>
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
          <Route path="admin" element={<AdminLayout />}>
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
          </Route>
        </Route>
      </Routes>
    </>
  );
}
