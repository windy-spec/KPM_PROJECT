import React, { useEffect, useState, useMemo } from 'react';
import feedbackService from '../../services/feedback.service';
import Portal from '../../components/common/Portal';
import ConfirmModal from '../../components/common/ConfirmModal';
import { showSuccess, showError } from '../../utils/notify';
import Pagination from '../../components/common/Pagination';
import {
  Search,
  MessageSquare,
  Tag,
  Clock,
  Trash2,
  Mail,
  Eye,
  X
} from 'lucide-react';

const ManageFeedbacks = () => {
  const [feedbacks, setFeedbacks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('');

  const [page, setPage] = useState(1);
  const limit = 6;

  const [showConfirmDelete, setShowConfirmDelete] = useState(false);
  const [pendingDelete, setPendingDelete] = useState(null);

  const [viewingFeedback, setViewingFeedback] = useState(null);

  useEffect(() => {
    fetchFeedbacks();
  }, []);

  const fetchFeedbacks = async () => {
    try {
      setLoading(true);
      const response = await feedbackService.getAllFeedbacks();
      const dataArray = response.data?.feedbacks || response.data;
      setFeedbacks(Array.isArray(dataArray) ? dataArray : []);
      setLoading(false);
    } catch (error) {
      showError('Lỗi khi tải danh sách góp ý');
      setLoading(false);
    }
  };

  const handleDeleteClick = (fb) => {
    setPendingDelete(fb);
    setShowConfirmDelete(true);
  };

  const executeDelete = async () => {
    if (!pendingDelete) return;
    try {
      await feedbackService.deleteFeedback(pendingDelete.id);
      showSuccess('Xóa góp ý thành công.');
      setShowConfirmDelete(false);
      setPendingDelete(null);

      // Nếu đang xem chi tiết mà ấn xóa thì đóng luôn modal
      if (viewingFeedback?.id === pendingDelete.id) {
        setViewingFeedback(null);
      }

      await fetchFeedbacks();
    } catch (error) {
      showError('Xóa thất bại: ' + (error?.response?.data?.message || error.message));
    }
  };

  const formatDate = (dateString) => {
    const options = { year: 'numeric', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' };
    return new Date(dateString).toLocaleDateString('vi-VN', options);
  };

  const stats = useMemo(() => {
    const total = feedbacks.length;
    const categories = {};
    feedbacks.forEach((f) => {
      const cat = f.category || 'Khác';
      categories[cat] = (categories[cat] || 0) + 1;
    });
    let topCat = '-';
    let maxCount = 0;
    Object.entries(categories).forEach(([cat, count]) => {
      if (count > maxCount) {
        maxCount = count;
        topCat = cat;
      }
    });
    return { total, topCat, maxCount };
  }, [feedbacks]);

  const filteredFeedbacks = useMemo(() => {
    return feedbacks.filter((fb) => {
      const matchesSearch =
        (fb.title || '').toLowerCase().includes(search.toLowerCase()) ||
        (fb.content || '').toLowerCase().includes(search.toLowerCase()) ||
        (fb.users?.email || '').toLowerCase().includes(search.toLowerCase()) ||
        (fb.users?.user_profiles?.first_name || '').toLowerCase().includes(search.toLowerCase());

      const matchesCategory = selectedCategory === '' || fb.category === selectedCategory;

      return matchesSearch && matchesCategory;
    });
  }, [feedbacks, search, selectedCategory]);

  const uniqueCategories = useMemo(() => {
    const cats = new Set(feedbacks.map((f) => f.category).filter(Boolean));
    return Array.from(cats);
  }, [feedbacks]);

  const totalPages = Math.ceil(filteredFeedbacks.length / limit) || 1;
  const paginatedFeedbacks = useMemo(() => {
    const start = (page - 1) * limit;
    return filteredFeedbacks.slice(start, start + limit);
  }, [filteredFeedbacks, page]);

  useEffect(() => {
    setPage(1);
  }, [search, selectedCategory]);

  const pageStart = filteredFeedbacks.length === 0 ? 0 : (page - 1) * limit + 1;
  const pageEnd = filteredFeedbacks.length === 0 ? 0 : Math.min(page * limit, filteredFeedbacks.length);

  return (
    <div className="space-y-6">

      {/* KHỐI MAIN BẢNG DỮ LIỆU ĐỒNG BỘ UI PRODUCT PANEL */}
      <div className="bg-white border border-outline-variant/60 rounded-2xl shadow-sm overflow-hidden">

        {/* HEADER & SEARCH BAR */}
        <div className="px-4 md:px-5 py-4 border-b border-outline-variant/50 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-center gap-2 flex-wrap min-w-0">
            <h2 className="text-[15px] md:text-[16px] font-black uppercase tracking-[0.12em] text-on-surface">
              Góp ý & Phản hồi
            </h2>
            <span className="inline-flex items-center rounded-md bg-surface-container px-2 py-1 text-[10px] font-black uppercase tracking-[0.18em] text-on-surface-variant/75">
              {filteredFeedbacks.length} bản ghi
            </span>
          </div>

          <div className="flex items-center gap-2 md:gap-3 shrink-0">
            <div className="relative w-full md:w-[260px] lg:w-[300px]">
              <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-on-surface-variant/50" />
              <input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Tìm tiêu đề, nội dung, email..."
                className="w-full rounded-full border border-outline-variant/60 bg-surface-container/20 pl-10 pr-4 py-2 text-sm outline-none focus:border-primary"
              />
            </div>

            <button
              type="button"
              className="inline-flex items-center gap-2 rounded-xl border border-outline-variant/60 bg-white px-3.5 py-2 text-xs font-bold hover:bg-surface-container transition-colors md:hidden"
            >
              <Search className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* FILTER BAR */}
        <div className="px-4 md:px-5 py-3 border-b border-outline-variant/40 bg-surface-container/10 flex flex-col lg:flex-row lg:items-center justify-between gap-3">
          <div className="flex items-center gap-2 flex-wrap">
            <select
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              className="min-w-[160px] rounded-lg border border-outline-variant/60 bg-white px-3 py-2 text-sm outline-none"
            >
              <option value="">Tất cả danh mục phân loại</option>
              {uniqueCategories.map((cat, idx) => (
                <option key={idx} value={cat}>
                  {cat}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* TABLE */}
        <div className="overflow-x-auto">
          <table className="w-full min-w-[920px] border-collapse text-left">
            <thead>
              <tr className="border-b border-outline-variant/50 bg-surface-container/30 text-[10px] font-black uppercase tracking-[0.22em] text-on-surface-variant/70">
                <th className="p-4 pl-6 w-[70px]">STT</th>
                <th className="p-4 w-[220px]">Người gửi</th>
                <th className="p-4 w-[160px]">Phân loại</th>
                <th className="p-4 w-[240px]">Tiêu đề</th>
                <th className="p-4">Nội dung chi tiết</th>
                <th className="p-4 w-[140px]">Thời gian</th>
                <th className="p-4 pr-6 text-center w-[100px]">Thao tác</th>
              </tr>
            </thead>

            <tbody className="divide-y divide-outline-variant/25 text-sm">
              {loading ? (
                <tr>
                  <td colSpan={7} className="p-8 text-center text-sm font-bold text-on-surface-variant/60">
                    Đang tải danh sách dữ liệu...
                  </td>
                </tr>
              ) : paginatedFeedbacks.length > 0 ? (
                paginatedFeedbacks.map((fb, idx) => (
                  <tr key={fb.id} className="hover:bg-surface-container/20 transition-colors">
                    <td className="p-4 pl-6 font-mono text-xs text-on-surface-variant/70">
                      {(page - 1) * limit + idx + 1 < 10 ? `0${(page - 1) * limit + idx + 1}` : (page - 1) * limit + idx + 1}
                    </td>

                    <td className="p-4">
                      <div className="font-black text-on-surface leading-5 line-clamp-1">
                        {fb.users?.user_profiles?.first_name || fb.users?.username || 'Ẩn danh'}
                      </div>
                      <div className="text-[11px] text-on-surface-variant/60 mt-0.5 flex items-center gap-1">
                        <Mail className="w-3 h-3" /> {fb.users?.email || 'N/A'}
                      </div>
                    </td>

                    <td className="p-4">
                      <span className="inline-flex items-center rounded-md bg-surface-container px-2.5 py-1 text-[10px] font-black uppercase tracking-[0.1em] text-teal-700 whitespace-nowrap">
                        {fb.category || 'Chưa phân loại'}
                      </span>
                    </td>

                    <td className="p-4">
                      <div className="font-bold text-on-surface text-xs tracking-wide line-clamp-2">
                        {fb.title}
                      </div>
                    </td>

                    <td className="p-4 max-w-[280px]">
                      <div className="line-clamp-2 text-[12px] text-on-surface-variant/75" title={fb.content}>
                        {fb.content}
                      </div>
                    </td>

                    <td className="p-4 text-on-surface-variant/70 text-[11px] font-semibold flex items-center gap-1.5 h-full pt-6">
                      <Clock className="w-3.5 h-3.5" />
                      {formatDate(fb.created_at)}
                    </td>

                    <td className="p-4 pr-6">
                      <div className="flex items-center justify-center">
                        <button
                          type="button"
                          onClick={() => setViewingFeedback(fb)}
                          className="rounded-lg border border-outline-variant/60 px-2.5 py-1.5 text-[11px] font-bold text-on-surface-variant hover:bg-surface-container transition-colors flex items-center gap-1"
                        >
                          <Eye className="w-3 h-3" /> Xem
                        </button>
                        <button
                          type="button"
                          onClick={() => handleDeleteClick(fb)}
                          className="rounded-lg border border-outline-variant/60 px-2.5 py-1.5 text-[11px] font-bold text-rose-600 hover:bg-rose-50 transition-colors flex items-center gap-1"
                        >
                          <Trash2 className="w-3 h-3" /> Xoá
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={7} className="p-8 text-center text-sm text-on-surface-variant/60">
                    Không tìm thấy góp ý nào.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* PAGINATION FOOTER */}
        {!loading && totalPages > 0 && (
          <div className="border-t border-outline-variant/40 px-4 md:px-5 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="text-xs font-semibold text-on-surface-variant/70 py-3 hidden sm:block">
              Hiển thị {pageStart} - {pageEnd} trên tổng số {filteredFeedbacks.length} bản ghi
            </div>

            {/* Sử dụng component Pagination có sẵn của ông */}
            <div className="pb-3 sm:pb-0">
              <Pagination
                currentPage={page}
                totalPages={totalPages}
                onPageChange={setPage}
              />
            </div>
          </div>
        )}
      </div>

      {/* KHỐI STATS ĐƯỢC CHUYỂN XUỐNG DƯỚI & SỬ DỤNG STYLE DASHBOARD */}
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
        <div className="bg-white border border-outline-variant/60 rounded-2xl p-5 shadow-sm">
          <div className="flex items-start justify-between gap-4 mb-4">
            <div className="flex items-center gap-2 text-primary">
              <MessageSquare className="w-5 h-5" />
              <h3 className="text-xs md:text-sm font-black uppercase tracking-[0.22em] text-on-surface">Tổng quan hệ thống</h3>
            </div>
          </div>

          <div className="flex items-center justify-between gap-3 rounded-xl bg-surface-container/20 px-4 py-4">
            <div>
              <div className="font-black text-on-surface">Tổng số góp ý nhận được</div>
              <div className="text-[11px] text-on-surface-variant/60">Toàn thời gian</div>
            </div>
            <div className="text-2xl font-black text-primary">{stats.total}</div>
          </div>
        </div>

        <div className="bg-white border border-outline-variant/60 rounded-2xl p-5 shadow-sm">
          <div className="flex items-center gap-2 mb-4 text-teal-600">
            <Tag className="w-5 h-5" />
            <h3 className="text-xs md:text-sm font-black uppercase tracking-[0.22em] text-on-surface">Phân loại phổ biến</h3>
          </div>

          <div className="flex items-center justify-between gap-3 rounded-xl bg-surface-container/20 px-4 py-4">
            <div>
              <div className="font-black text-on-surface leading-5">{stats.topCat}</div>
              <div className="text-[11px] text-on-surface-variant/60">Chủ đề quan tâm nhiều nhất</div>
            </div>
            <div className="text-right">
              <span className="text-lg font-black text-teal-600">{stats.maxCount}</span>
              <span className="text-[11px] text-on-surface-variant/60 ml-1 font-bold">Lượt gửi</span>
            </div>
          </div>
        </div>
      </div>

      {/* MODAL CHI TIẾT GÓP Ý DÙNG PORTAL */}
      {viewingFeedback && (
        <Portal>
          <div className="fixed inset-0 z-[60] flex items-center justify-center bg-slate-950/55 px-4 backdrop-blur-sm">
            <div className="w-full max-w-xl overflow-hidden rounded-[26px] border border-outline-variant/60 bg-white shadow-[0_24px_80px_rgba(15,23,42,0.22)] flex flex-col max-h-[90vh]">

              <div className="border-b border-outline-variant/50 px-6 py-5 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <MessageSquare className="h-5 w-5 text-primary" />
                  <h3 className="text-sm font-black uppercase tracking-[0.22em] text-on-surface">Chi tiết phản hồi</h3>
                </div>
                <button
                  onClick={() => setViewingFeedback(null)}
                  className="rounded-full p-1.5 text-on-surface-variant hover:bg-surface-container hover:text-on-surface transition-colors"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>

              <div className="px-6 py-5 overflow-y-auto custom-scrollbar space-y-5">
                <div className="flex items-start gap-4">
                  <div className="h-10 w-10 shrink-0 rounded-full bg-primary/10 text-primary flex items-center justify-center font-black">
                    {(viewingFeedback.users?.user_profiles?.first_name || viewingFeedback.users?.username || 'U').charAt(0).toUpperCase()}
                  </div>
                  <div>
                    <div className="font-black text-sm text-on-surface">
                      {viewingFeedback.users?.user_profiles?.first_name || viewingFeedback.users?.username || 'Người dùng ẩn danh'}
                    </div>
                    <div className="text-xs text-on-surface-variant/80 flex items-center gap-1 mt-0.5">
                      <Mail className="w-3.5 h-3.5" /> {viewingFeedback.users?.email || 'Không có email'}
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4 rounded-xl border border-outline-variant/40 bg-surface-container/10 p-4">
                  <div>
                    <div className="text-[10px] font-black uppercase tracking-[0.1em] text-on-surface-variant/60 mb-1">Thời gian gửi</div>
                    <div className="text-xs font-bold text-on-surface flex items-center gap-1.5">
                      <Clock className="w-3.5 h-3.5 text-on-surface-variant/60" />
                      {formatDate(viewingFeedback.created_at)}
                    </div>
                  </div>
                  <div>
                    <div className="text-[10px] font-black uppercase tracking-[0.1em] text-on-surface-variant/60 mb-1">Phân loại</div>
                    <div className="text-xs font-bold text-teal-700 bg-teal-50 inline-flex px-2 py-0.5 rounded-md border border-teal-100">
                      {viewingFeedback.category || 'Chưa phân loại'}
                    </div>
                  </div>
                </div>

                <div>
                  <div className="text-[10px] font-black uppercase tracking-[0.1em] text-on-surface-variant/60 mb-2">Tiêu đề</div>
                  <div className="text-sm font-black text-on-surface">{viewingFeedback.title}</div>
                </div>

                <div>
                  <div className="text-[10px] font-black uppercase tracking-[0.1em] text-on-surface-variant/60 mb-2">Nội dung chi tiết</div>
                  <div className="rounded-xl border border-outline-variant/60 bg-surface-container/20 p-4 text-sm text-on-surface-variant/90 whitespace-pre-wrap leading-relaxed">
                    {viewingFeedback.content}
                  </div>
                </div>
              </div>

              <div className="flex items-center justify-end gap-3 border-t border-outline-variant/50 bg-surface-container/10 px-6 py-4">
                <button
                  type="button"
                  onClick={() => {
                    setPendingDelete(viewingFeedback);
                    setShowConfirmDelete(true);
                  }}
                  className="rounded-xl border border-rose-200 bg-rose-50 px-4 py-2.5 text-sm font-bold text-rose-600 hover:bg-rose-100 transition-colors mr-auto"
                >
                  Xóa góp ý
                </button>
                <button
                  type="button"
                  onClick={() => setViewingFeedback(null)}
                  className="rounded-xl bg-primary px-6 py-2.5 text-sm font-black uppercase tracking-[0.12em] text-white hover:bg-primary/90 transition-colors"
                >
                  Đóng
                </button>
              </div>

            </div>
          </div>
        </Portal>
      )}

      {/* CONFIRM DELETE MODAL */}
      <ConfirmModal
        open={showConfirmDelete}
        title="Xác nhận xoá góp ý"
        message={
          pendingDelete
            ? `Xác nhận xoá góp ý từ "${pendingDelete.users?.user_profiles?.first_name || pendingDelete.users?.username || 'khách hàng'}"? Hành động này không thể hoàn tác.`
            : 'Xác nhận xoá góp ý?'
        }
        confirmText="Xoá"
        cancelText="Hủy"
        onConfirm={executeDelete}
        onCancel={() => {
          setShowConfirmDelete(false);
          setPendingDelete(null);
        }}
      />
    </div>
  );
};

export default ManageFeedbacks;