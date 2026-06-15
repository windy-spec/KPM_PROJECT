import React from 'react';
import { BrowserRouter as Router, Routes, Route, useLocation } from 'react-router-dom';
import { Loader2 } from 'lucide-react';
import { ToastContainer } from 'react-toastify';
import MainLayout from './components/layout/MainLayout';
import Home from './pages/client/Home';
import Login from './pages/auth/Login';
import Register from './pages/auth/Register';
import ForgotPassword from './pages/auth/ForgotPassword';
import Profile from './pages/profile/Profile';
import ProductList from './pages/product/ProductList';
import ProductDetail from './pages/product/ProductDetail';
import AdminDashboard from './pages/admin/Dashboard';
import RoleGuard from './components/auth/RoleGuard';
import PublicGuard from './components/auth/PublicGuard';
import Checkout from './pages/checkout/Checkout';
import Cart from './pages/cart/Cart';
import PaymentResult from './pages/checkout/PaymentResult';
import PrivacyPolicy from './pages/legal/PrivacyPolicy';
import TermsOfService from './pages/legal/TermsOfService';


const routeMap = [
  {
    path: '/',
    element: (
      <MainLayout>
        <Home />
      </MainLayout>
    ),
  },
  {
    path: '/terms-of-service',
    element: (
      <MainLayout>
        <TermsOfService />
      </MainLayout>
    ),
  },
  {
    path: '/privacy-policy',
    element: (
      <MainLayout>
        <PrivacyPolicy />
      </MainLayout>
    ),
  },
  {
    path: '/login',
    element: (
      <PublicGuard>
        <Login />
      </PublicGuard>
    )
  },
  {
    path: '/register',
    element: (
      <PublicGuard>
        <Register />
      </PublicGuard>
    )
  },
  {
    path: '/forgot-password',
    element: (
      <PublicGuard>
        <ForgotPassword />
      </PublicGuard>
    )
  },
  {
    path: '/profile',
    element: (
      <MainLayout>
        <Profile />
      </MainLayout>
    ),
  },
  {
    path: '/products',
    element: (
      <MainLayout>
        <ProductList />
      </MainLayout>
    ),
  },
  {
    path: '/product/:id',
    element: (
      <MainLayout>
        <ProductDetail />
      </MainLayout>
    ),
  },
  {
    path: '/checkout',
    element: (
      <MainLayout>
        <Checkout />
      </MainLayout>
    ),
  },
  {
    path: '/cart',
    element: (
      <MainLayout>
        <Cart />
      </MainLayout>
    ),
  },
  {
    path: '/payment-result',
    element: (
      <MainLayout>
        <PaymentResult />
      </MainLayout>
    ),
  },
  {
    path: '/admin',
    element: (
      <RoleGuard allowedRoles={['ADMIN']}>
        <AdminDashboard />
      </RoleGuard>
    ),
  },
  {
    path: '/admin/dashboard',
    element: (
      <RoleGuard allowedRoles={['ADMIN']}>
        <AdminDashboard />
      </RoleGuard>
    ),
  },
];

function GlobalLoading() {
  const [isLoading, setIsLoading] = React.useState(false);

  React.useEffect(() => {
    const handleLoading = (e) => {
      setIsLoading(e.detail.isLoading);
    };
    window.addEventListener('api-loading', handleLoading);
    return () => window.removeEventListener('api-loading', handleLoading);
  }, []);

  if (!isLoading) return null;

  return (
    <div className="fixed inset-0 z-[99999] flex flex-col items-center justify-center bg-slate-950/40 backdrop-blur-sm transition-all duration-300">
      <div className="bg-white rounded-2xl p-6 shadow-2xl flex flex-col items-center gap-4 animate-in fade-in zoom-in duration-200">
        <Loader2 className="w-10 h-10 text-primary animate-spin" />
        <p className="text-sm font-bold text-on-surface uppercase tracking-widest">Đang xử lý...</p>
      </div>
    </div>
  );
}

function AppRoutes() {
  const location = useLocation();
  const [sessionExpired, setSessionExpired] = React.useState(false);

  React.useEffect(() => {
    const handleSessionExpired = () => {
      setSessionExpired(true);
    };

    window.addEventListener('session-expired', handleSessionExpired);
    return () => window.removeEventListener('session-expired', handleSessionExpired);
  }, []);

  const handleLoginRedirect = () => {
    setSessionExpired(false);
    window.location.href = '/login';
  };

  return (
    <div className="page-transition-shell">
      <GlobalLoading />
      {/* Giao diện Popup Hết phiên đăng nhập cực đẹp */}
      {sessionExpired && (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-surface/60 backdrop-blur-md p-4">
          <div className="bg-surface-container-lowest border border-outline-variant/30 rounded-3xl p-8 max-w-sm w-full shadow-2xl animate-in fade-in zoom-in duration-300 flex flex-col items-center text-center">
            <div className="w-16 h-16 bg-error/10 text-error rounded-full flex items-center justify-center mb-6">
              <svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect width="18" height="11" x="3" y="11" rx="2" ry="2" /><path d="M7 11V7a5 5 0 0 1 10 0v4" /></svg>
            </div>
            <h3 className="text-xl font-black text-on-surface mb-2">Phiên đăng nhập đã hết</h3>
            <p className="text-sm font-medium text-on-surface-variant mb-8">
              Để bảo mật tài khoản, vui lòng đăng nhập lại để tiếp tục sử dụng hệ thống.
            </p>
            <button
              onClick={handleLoginRedirect}
              className="w-full bg-primary text-white font-bold py-3.5 px-4 rounded-xl hover:bg-primary/90 transition-colors shadow-sm shadow-primary/30"
            >
              Đăng nhập lại
            </button>
          </div>
        </div>
      )}

      <Routes location={location} key={location.pathname}>
        {routeMap.map(({ path, element }) => (
          <Route key={path} path={path} element={element} />
        ))}
      </Routes>
    </div>
  );
}

function App() {
  return (
    <Router>
      <AppRoutes />
      <ToastContainer
        position="top-right"
        autoClose={3800}
        hideProgressBar
        newestOnTop
        closeOnClick={false}
        rtl={false}
        pauseOnFocusLoss
        draggable
        pauseOnHover
        theme="light"
      />
    </Router>
  );
}

export default App;