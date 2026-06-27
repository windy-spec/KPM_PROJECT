import React from 'react';
import { Navigate } from 'react-router-dom';

const readCurrentUser = () => {
    try {
        const rawUser = localStorage.getItem('user');
        return rawUser ? JSON.parse(rawUser) : null;
    } catch {
        return null;
    }
};

const UserGuard = ({ children }) => {
    const accessToken = localStorage.getItem('accessToken');
    const currentUser = readCurrentUser();
    const currentRole = String(currentUser?.role || '').toUpperCase();

    // Nếu ĐÃ ĐĂNG NHẬP, kiểm tra xem có phải là Admin hay không để điều hướng ép buộc
    if (accessToken) {
        if (currentRole === 'ADMIN') {
            return <Navigate to="/admin/dashboard" replace />;
        }
        if (currentRole === 'ADMIN_KHO') {
            return <Navigate to="/admin/warehouse" replace />;
        }
    }

    // Nếu chưa đăng nhập hoặc là USER thường thì cho qua bình thường
    return children;
};

export default UserGuard;