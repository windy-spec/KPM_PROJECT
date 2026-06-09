import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { FileText, Heart, User as UserIcon } from 'lucide-react';
import { authService } from '../../services/auth.service';
import ProfileTab from './ProfileTab';
import QuotationsTab from './QuotationsTab';
import FavoritesTab from './FavoritesTab';
import OrdersTab from './OrdersTab';
import OverviewTab from './OverviewTab';
import AIChatHistoryTab from './AIChatHistoryTab';

const ProfileDashboard = () => {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('overview');
  
  // States for Profile
  const [loading, setLoading] = useState(false);
  const [initialLoading, setInitialLoading] = useState(true);
  const [isEditing, setIsEditing] = useState(false);
  const [message, setMessage] = useState('');
  const [errorMessage, setErrorMessage] = useState('');
  const [user, setUser] = useState({
    username: '', email: '', role: '',
    firstName: '', middleName: '', lastName: '',
    phoneNumber: '', address: '', zaloNumber: '',
  });

  const hydrateFromBackend = (payload) => {
    const backendUser = payload?.user || {};
    const backendProfile = payload?.profile || {};
    setUser({
      username: backendUser.username || '',
      email: backendUser.email || '',
      role: backendUser.role || '',
      firstName: backendProfile.firstName || backendUser.firstName || '',
      middleName: backendProfile.middleName || backendUser.middleName || '',
      lastName: backendProfile.lastName || backendUser.lastName || '',
      phoneNumber: backendProfile.phoneNumber || backendUser.phoneNumber || '',
      address: backendProfile.address || backendUser.address || '',
      zaloNumber: backendProfile.zaloNumber || backendUser.zaloNumber || '',
    });
  };

  useEffect(() => {
    const loadCurrentUser = async () => {
      const accessToken = localStorage.getItem('accessToken');
      if (!accessToken) { navigate('/login'); return; }
      try {
        const response = await authService.getMe();
        hydrateFromBackend(response.data?.data);
      } catch (error) {
        if (error?.response?.status === 401) navigate('/login');
        setErrorMessage('Không thể tải dữ liệu.');
      } finally {
        setInitialLoading(false);
      }
    };
    loadCurrentUser();
  }, [navigate]);

  return (
    <div className="min-h-screen bg-surface p-4 md:p-10 font-sans">
      <div className="max-w-6xl mx-auto">
        {initialLoading ? (
          <div className="p-8 bg-white rounded-3xl border border-outline-variant animate-pulse font-bold text-primary text-center">
            Đang đồng bộ dữ liệu KPM...
          </div>
        ) : (
          <>
            {/* Header */}
            <div className="mb-8">
              <h1 className="text-3xl font-black text-on-surface uppercase tracking-tight italic">Dashboard Khách Hàng</h1>
              <p className="text-sm text-on-surface-variant font-medium">Quản lý yêu cầu, báo giá và thông tin cá nhân của bạn</p>
            </div>

            {/* Tabs Navigation */}
            <div className="flex overflow-x-auto border-b border-outline-variant/50 hide-scrollbar pt-2 px-2 gap-1">
              <button 
                onClick={() => setActiveTab('overview')}
                className={`flex items-center gap-2 px-6 py-3 text-sm font-bold rounded-t-xl transition-all ${
                  activeTab === 'overview' ? 'bg-white text-primary border-t border-x border-outline-variant/50 border-b-2 border-b-primary shadow-[0_-4px_10px_-5px_rgba(0,0,0,0.05)]' : 'bg-surface-container text-on-surface-variant hover:bg-white/50'
                }`}
              >
                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-4 h-4"><rect width="7" height="9" x="3" y="3" rx="1"/><rect width="7" height="5" x="14" y="3" rx="1"/><rect width="7" height="9" x="14" y="12" rx="1"/><rect width="7" height="5" x="3" y="16" rx="1"/></svg>
                Tổng quan
              </button>

              <button 
                onClick={() => setActiveTab('quotations')}
                className={`flex items-center gap-2 px-6 py-3 text-sm font-bold rounded-t-xl transition-all ${
                  activeTab === 'quotations' ? 'bg-white text-primary border-t border-x border-outline-variant/50 border-b-2 border-b-primary shadow-[0_-4px_10px_-5px_rgba(0,0,0,0.05)]' : 'bg-surface-container text-on-surface-variant hover:bg-white/50'
                }`}
              >
                <FileText className="w-4 h-4" /> Báo Giá & Yêu Cầu
              </button>
              
              <button 
                onClick={() => setActiveTab('orders')}
                className={`flex items-center gap-2 px-6 py-3 text-sm font-bold rounded-t-xl transition-all ${
                  activeTab === 'orders' ? 'bg-white text-primary border-t border-x border-outline-variant/50 border-b-2 border-b-primary shadow-[0_-4px_10px_-5px_rgba(0,0,0,0.05)]' : 'bg-surface-container text-on-surface-variant hover:bg-white/50'
                }`}
              >
                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-4 h-4"><path d="m7.5 4.27 9 5.15"/><path d="M21 8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16Z"/><path d="m3.3 7 8.7 5 8.7-5"/><path d="M12 22V12"/></svg>
                Lịch sử Đơn Hàng
              </button>

              <button 
                onClick={() => setActiveTab('favorites')}
                className={`flex items-center gap-2 px-6 py-3 text-sm font-bold rounded-t-xl transition-all ${
                  activeTab === 'favorites' ? 'bg-white text-primary border-t border-x border-outline-variant/50 border-b-2 border-b-primary shadow-[0_-4px_10px_-5px_rgba(0,0,0,0.05)]' : 'bg-surface-container text-on-surface-variant hover:bg-white/50'
                }`}
              >
                <Heart className="w-4 h-4" /> Cấu Hình Yêu Thích
              </button>

              <button 
                onClick={() => setActiveTab('ai_history')}
                className={`flex items-center gap-2 px-6 py-3 text-sm font-bold rounded-t-xl transition-all ${
                  activeTab === 'ai_history' ? 'bg-white text-primary border-t border-x border-outline-variant/50 border-b-2 border-b-primary shadow-[0_-4px_10px_-5px_rgba(0,0,0,0.05)]' : 'bg-surface-container text-on-surface-variant hover:bg-white/50'
                }`}
              >
                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-4 h-4"><rect width="18" height="10" x="3" y="11" rx="2"/><circle cx="12" cy="5" r="2"/><path d="M12 7v4"/><line x1="8" x2="8" y1="16" y2="16"/><line x1="16" x2="16" y1="16" y2="16"/></svg>
                Tư vấn AI
              </button>

              <button 
                onClick={() => setActiveTab('profile')}
                className={`flex items-center gap-2 px-6 py-3 text-sm font-bold rounded-t-xl transition-all ${
                  activeTab === 'profile' ? 'bg-white text-primary border-t border-x border-outline-variant/50 border-b-2 border-b-primary shadow-[0_-4px_10px_-5px_rgba(0,0,0,0.05)]' : 'bg-surface-container text-on-surface-variant hover:bg-white/50'
                }`}
              >
                <UserIcon className="w-4 h-4" /> Thông Tin Cá Nhân
              </button>
            </div>

            {/* Tab Content */}
            <div className="mt-2">
              {activeTab === 'overview' && <OverviewTab user={user} />}
              {activeTab === 'quotations' && <QuotationsTab />}
              {activeTab === 'orders' && <OrdersTab />}
              {activeTab === 'favorites' && <FavoritesTab />}
              {activeTab === 'ai_history' && <AIChatHistoryTab />}
              {activeTab === 'profile' && (
                <ProfileTab 
                  user={user} setUser={setUser}
                  isEditing={isEditing} setIsEditing={setIsEditing}
                  message={message} setMessage={setMessage}
                  errorMessage={errorMessage} setErrorMessage={setErrorMessage}
                  loading={loading} setLoading={setLoading}
                />
              )}
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default ProfileDashboard;