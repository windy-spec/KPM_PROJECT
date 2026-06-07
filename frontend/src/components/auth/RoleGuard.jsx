import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';

const readCurrentUser = () => {
  try {
    const rawUser = localStorage.getItem('user');

    if (!rawUser) {
      return null;
    }

    return JSON.parse(rawUser);
  } catch {
    return null;
  }
};

const RoleGuard = ({ allowedRoles = [], children }) => {
  const location = useLocation();
  const accessToken = localStorage.getItem('accessToken');
  const currentUser = readCurrentUser();
  const currentRole = String(currentUser?.role || '').toUpperCase();
  const normalizedAllowedRoles = allowedRoles.map((role) => String(role).toUpperCase());

  // 1. Nếu chưa đăng nhập -> Đá về /login
  if (!accessToken) {
    return <Navigate to="/login" replace state={{ from: location }} />;
  }

  // 2. Nếu đã đăng nhập nhưng SAI ROLE (Ví dụ: USER thường cố vào trang ADMIN)
  if (normalizedAllowedRoles.length > 0 && !normalizedAllowedRoles.includes(currentRole)) {
    // Nếu là ADMIN thì về trang admin, ngược lại (USER) thì về trang chủ client
    const defaultRedirect = currentRole === 'ADMIN' ? '/admin/dashboard' : '/';
    return <Navigate to={defaultRedirect} replace />;
  }

  return children;
};

export default RoleGuard;