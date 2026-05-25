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

  if (!accessToken) {
    return <Navigate to="/login" replace state={{ from: location }} />;
  }

  if (normalizedAllowedRoles.length > 0 && !normalizedAllowedRoles.includes(currentRole)) {
    return <Navigate to="/" replace state={{ from: location }} />;
  }

  return children;
};

export default RoleGuard;