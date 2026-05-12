import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import MainLayout from './components/layout/MainLayout';
import Home from './pages/client/Home';
import Login from './pages/auth/Login';
import Register from './pages/auth/Register';
import ForgotPassword from './pages/auth/ForgotPassword';
import Profile from './pages/profile/Profile';

function App() {
  return (
    <Router>
      <Routes>
        {/* Route cho Trang Chủ */}
        <Route 
          path="/" 
          element={
            <MainLayout>
              <Home />
            </MainLayout>
          } 
        />

        {/* Route cho Đăng Nhập */}
        <Route path="/login" element={<Login />} />
        {/* Route cho Đăng Ký */}
        <Route path="/register" element={<Register />} />
        {/* Route cho Quên mật khẩu */}
        <Route path="/forgot-password" element={<ForgotPassword />} />
        {/* Route cho Profile */}
        <Route
          path="/profile"
          element={
            <MainLayout>
              <Profile />
            </MainLayout>
          }
        />
      </Routes>
    </Router>
  );
}

export default App;