import React, { useEffect, lazy, Suspense } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';

import { RootState, AppDispatch } from './store';
import { checkAuth } from './store/authSlice';

import { RootLayout } from './layouts/RootLayout';
import { AdminLayout } from './layouts/AdminLayout';

// Policy Pages
const PrivacyPolicy = lazy(() => import('./components/PrivacyPolicy').then((m) => ({ default: m.PrivacyPolicy })));
const TermsConditions = lazy(() => import('./components/TermsConditions').then((m) => ({ default: m.TermsConditions })));
const ShippingPolicy = lazy(() => import('./components/ShippingPolicy').then((m) => ({ default: m.ShippingPolicy })));
const ReturnPolicy = lazy(() => import('./components/ReturnPolicy').then((m) => ({ default: m.ReturnPolicy })));

// Public Pages
import { HomePage } from './pages/HomePage';
const ShopPage = lazy(() => import('./pages/ShopPage'));
const ProductDetailsPage = lazy(() => import('./pages/ProductDetailsPage').then((m) => ({ default: m.ProductDetailsPage })));
const AboutPage = lazy(() => import('./pages/AboutPage').then((m) => ({ default: m.AboutPage })));
const BlogPage = lazy(() => import('./pages/BlogPage').then((m) => ({ default: m.BlogPage })));
const BlogDetailsPage = lazy(() => import('./pages/BlogDetailsPage').then((m) => ({ default: m.BlogDetailsPage })));
const ContactPage = lazy(() => import('./pages/ContactPage').then((m) => ({ default: m.ContactPage })));
const CareerPage = lazy(() => import('./pages/CareerPage').then((m) => ({ default: m.CareerPage })));
const AuthPage = lazy(() => import('./pages/AuthPage').then((m) => ({ default: m.AuthPage })));

// Protected Customer Pages
const CartPage = lazy(() => import('./pages/CartPage').then((m) => ({ default: m.CartPage })));
const WishlistPage = lazy(() => import('./pages/WishlistPage').then((m) => ({ default: m.WishlistPage })));
const CheckoutPage = lazy(() => import('./pages/CheckoutPage').then((m) => ({ default: m.CheckoutPage })));
const OrdersPage = lazy(() => import('./pages/OrdersPage').then((m) => ({ default: m.OrdersPage })));
const OrderTrackingPage = lazy(() => import('./pages/OrderTrackingPage').then((m) => ({ default: m.OrderTrackingPage })));
const ProfilePage = lazy(() => import('./pages/ProfilePage').then((m) => ({ default: m.ProfilePage })));

// Admin Pages
const AdminDashboardPage = lazy(() => import('./pages/admin/AdminDashboardPage').then((m) => ({ default: m.AdminDashboardPage })));
const AdminProductsPage = lazy(() => import('./pages/admin/AdminProductsPage').then((m) => ({ default: m.AdminProductsPage })));
const AdminOrdersPage = lazy(() => import('./pages/admin/AdminOrdersPage'));
const AdminCustomersPage = lazy(() => import('./pages/admin/AdminCustomersPage'));
const AdminCareersPage = lazy(() => import('./pages/admin/AdminCareersPage'));
const AdminCouponsPage = lazy(() => import('./pages/admin/AdminCouponsPage'));

const AdminReviewsPage = lazy(() => import('./pages/admin/AdminReviewsPage'));
const Adminvisitinvoice = lazy(() => import('./pages/admin/Adminvisitinvoice'));

// Route Guards
import ProtectedRoute from './components/common/ProtectedRoute';
import AdminRoute from './components/common/AdminRoute';
import { WhatsAppButton } from './components/common/whatsappbuttom';

const NotFound: React.FC = () => (
  <div className="min-h-screen flex flex-col items-center justify-center bg-hydra-cream">
    <h1 className="text-8xl font-playfair font-bold text-hydra-dark mb-4">404</h1>
    <p className="text-xl text-hydra-muted mb-8">Page not found</p>
    <a href="/" className="bg-hydra-dark text-white px-6 py-3 rounded-full hover:bg-opacity-90 transition-colors">
      Go Home
    </a>
  </div>
);

const PageLoader: React.FC = () => (
  <div className="min-h-[60vh] flex items-center justify-center">
    <div className="w-10 h-10 border-4 border-hydra-dark border-t-transparent rounded-full animate-spin" />
  </div>
);

const App: React.FC = () => {
  const dispatch = useDispatch<AppDispatch>();
  const { isInitialized } = useSelector((s: RootState) => s.auth);

  useEffect(() => {
    dispatch(checkAuth());
  }, [dispatch]);

  if (!isInitialized) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-hydra-cream">
        <div className="flex flex-col items-center gap-4">
          <div className="w-12 h-12 border-4 border-hydra-dark border-t-transparent rounded-full animate-spin" />
          <p className="text-hydra-muted font-sans">Loading Hydra…</p>
        </div>
      </div>
    );
  }

  return (
    <BrowserRouter>
      <Suspense fallback={<PageLoader />}>
      <Routes>
        {/* ─── Public customer routes ─── */}
        <Route element={<RootLayout />}>
          <Route path="/" element={<HomePage />} />
          <Route path="/shop" element={<ShopPage />} />
          <Route path="/shop/:slug" element={<ProductDetailsPage />} />
          <Route path="/about" element={<AboutPage />} />
          <Route path="/blog" element={<BlogPage />} />
          <Route path="/blog/:slug" element={<BlogDetailsPage />} />
          <Route path="/contact" element={<ContactPage />} />
          <Route path="/career" element={<CareerPage />} />
          <Route path="/auth" element={<AuthPage />} />
          <Route path="/cart" element={<CartPage />} />
          <Route path="/privacy" element={<PrivacyPolicy />} />
          <Route path="/terms" element={<TermsConditions />} />
          <Route path="/shipping" element={<ShippingPolicy />} />
          <Route path="/returns" element={<ReturnPolicy />} />

          {/* ─── Protected customer routes ─── */}
          <Route element={<ProtectedRoute />}>
            <Route path="/wishlist" element={<WishlistPage />} />
            <Route path="/checkout" element={<CheckoutPage />} />
            <Route path="/orders" element={<OrdersPage />} />
            <Route path="/orders/:id" element={<OrderTrackingPage />} />
            <Route path="/profile" element={<ProfilePage />} />
          </Route>
        </Route>

        {/* ─── Admin routes ─── */}
        <Route element={<AdminRoute />}>
          <Route path="/admin" element={<AdminLayout />}>
            <Route index element={<AdminDashboardPage />} />
            <Route path="products" element={<AdminProductsPage />} />
            <Route path="orders" element={<AdminOrdersPage />} />
            <Route path="visit-invoices" element={<Adminvisitinvoice />} />
            <Route path="customers" element={<AdminCustomersPage />} />
            <Route path="careers" element={<AdminCareersPage />} />
            <Route path="coupons" element={<AdminCouponsPage />} />
            <Route path="reviews" element={<AdminReviewsPage />} />
          </Route>
        </Route>

        {/* ─── Catch-all ─── */}
        <Route path="*" element={<NotFound />} />
      </Routes>
      </Suspense>
      <WhatsAppButton />
    </BrowserRouter>
  );
};

export default App;
