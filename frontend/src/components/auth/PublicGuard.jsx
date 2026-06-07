import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';

const readCurrentUser = () => {
  try {
    const rawUser = localStorage.getItem('user');
    return rawUser ? JSON.parse(rawUser) : null;
  } catch {
    return null;
  }
};

const PublicGuard = ({ children }) => {
  const accessToken = localStorage.getItem('accessToken');
  const location = useLocation();
  const currentUser = readCurrentUser();
  const currentRole = String(currentUser?.role || '').toUpperCase();

  // Nếu ĐÃ đăng nhập mà cố tình vào trang Login/Register/ForgotPassword
  if (accessToken) {
    // Ưu tiên quay lại trang trước đó nếu có lịch sử (location.state.from)
    if (location.state?.from?.pathname) {
      return <Navigate to={location.state.from.pathname} replace />;
    }

    // Nếu không có lịch sử trước đó (gõ trực tiếp URL), điều hướng theo ROLE:
    if (currentRole === 'ADMIN') {
      return <Navigate to="/admin/dashboard" replace />;
    }
    
    // Nếu là USER hoặc các role khác, về trang chủ client
    return <Navigate to="/" replace />;
  }

  return children;
};

export default PublicGuard;