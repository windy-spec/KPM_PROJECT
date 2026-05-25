import React from 'react';
import { BrowserRouter as Router, Routes, Route, useLocation } from 'react-router-dom';
import { ToastContainer } from 'react-toastify';
import MainLayout from './components/layout/MainLayout';
import Home from './pages/client/Home';
import Login from './pages/auth/Login';
import Register from './pages/auth/Register';
import ForgotPassword from './pages/auth/ForgotPassword';
import Profile from './pages/profile/Profile';
import ProductList from './pages/product/ProductList';
import AdminDashboard from './pages/admin/Dashboard';
import ManageProducts from './pages/admin/ManageProducts';
import ManageCategories from './pages/admin/ManageCategories';
import ManageOrders from './pages/admin/ManageOrders';
import ManageCustomers from './pages/admin/ManageCustomers';
import RoleGuard from './components/auth/RoleGuard';

const routeMap = [
  {
    path: '/',
    element: (
      <MainLayout>
        <Home />
      </MainLayout>
    ),
  },
  { path: '/login', element: <Login /> },
  { path: '/register', element: <Register /> },
  { path: '/forgot-password', element: <ForgotPassword /> },
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
  {
    path: '/admin/products',
    element: (
      <RoleGuard allowedRoles={['ADMIN']}>
        <ManageProducts />
      </RoleGuard>
    ),
  },
  {
    path: '/admin/categories',
    element: (
      <RoleGuard allowedRoles={['ADMIN']}>
        <ManageCategories />
      </RoleGuard>
    ),
  },
  {
    path: '/admin/orders',
    element: (
      <RoleGuard allowedRoles={['ADMIN']}>
        <ManageOrders />
      </RoleGuard>
    ),
  },
  {
    path: '/admin/customers',
    element: (
      <RoleGuard allowedRoles={['ADMIN']}>
        <ManageCustomers />
      </RoleGuard>
    ),
  },
];


function AppRoutes() {
  const location = useLocation();

  return (
    <div className="page-transition-shell">
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