import React, { useEffect, useState } from "react";
import { Search, Loader2, CheckCircle, XCircle, Sparkles, AlertCircle, Pencil } from "lucide-react";
import forumService from "../../services/forumService";
import moment from "moment";
import { toast } from "react-toastify";
import Pagination from "../../components/common/Pagination";
import ReactMarkdown from "react-markdown";

const ALLOWED_HASHTAGS = [
  "#NoiThat", "#ThietKe", "#XuHuong", "#KienThuc", 
  "#BaoGia", "#DuAn", "#SanXuat", "#GocChiaSe"
];

const ForumManagement = () => {
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedTag, setSelectedTag] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const limit = 10;

  const [reviewPost, setReviewPost] = useState(null);
  const [isPreviewMode, setIsPreviewMode] = useState(true);
  const [editForm, setEditForm] = useState({ title: "", hashtags: [], content: "" });

  const [showGenerateModal, setShowGenerateModal] = useState(false);
  const [selectedGenerateTags, setSelectedGenerateTags] = useState([]);

  const fetchPosts = async () => {
    setLoading(true);
    try {
      const res = await forumService.getAdminPosts({
        page,
        limit,
        search: searchTerm,
        hashtag: selectedTag,
        status: statusFilter
      });
      if (res.success) {
        setPosts(res.posts);
        setTotal(res.total);
      }
    } catch (error) {
      toast.error("Không thể tải danh sách bài viết!");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPosts();
  }, [page, selectedTag, statusFilter]);

  const handleSearch = (e) => {
    if(e) e.preventDefault();
    setPage(1);
    fetchPosts();
  };

  const handleGenerate = () => {
    setSelectedGenerateTags([]);
    setShowGenerateModal(true);
  };

  const executeGenerateAI = async () => {
    setShowGenerateModal(false);
    setActionLoading(true);
    const toastId = toast.loading("🤖 AI đang phân tích và viết bài...");
    try {
      const res = await forumService.generatePost(selectedGenerateTags);
      if (res.success) {
        toast.update(toastId, { render: "Tạo bài viết thành công!", type: "success", isLoading: false, autoClose: 3000 });
        setPage(1);
        fetchPosts();
      } else {
        toast.update(toastId, { render: res.message || "Tạo bài thất bại", type: "error", isLoading: false, autoClose: 3000 });
      }
    } catch (error) {
      toast.update(toastId, { render: "Có lỗi xảy ra khi gọi AI!", type: "error", isLoading: false, autoClose: 3000 });
    } finally {
      setActionLoading(false);
    }
  };

  const updateStatus = async (id, status, isFullUpdate = false) => {
    try {
      let res;
      if (isFullUpdate) {
        const parsedTags = (editForm.hashtags || [])
          .map(t => t.trim())
          .filter(t => t)
          .map(t => t.startsWith("#") ? t : `#${t}`);
          
        res = await forumService.updatePost(id, {
          title: editForm.title,
          content: editForm.content,
          hashtags: parsedTags,
          status
        });
      } else {
        res = await forumService.updatePostStatus(id, status);
      }
      
      if (res.success) {
        let statusMsg = "cập nhật trạng thái";
        if(status === 'published') statusMsg = "duyệt";
        else if (status === 'rejected') statusMsg = "từ chối";
        else if (status === 'suspended') statusMsg = "tạm ngưng";
        toast.success(`Đã ${statusMsg} bài viết!`);
        fetchPosts();
        setReviewPost(null);
      }
    } catch (error) {
      toast.error("Cập nhật trạng thái thất bại");
    }
  };

  const openReviewModal = (post) => {
    setReviewPost(post);
    setEditForm({
      title: post.title || "",
      hashtags: post.hashtags ? [...post.hashtags] : [],
      content: post.content || ""
    });
    setIsPreviewMode(true);
  };

  const toggleHashtag = (tag) => {
    const current = editForm.hashtags || [];
    if (current.includes(tag)) {
      setEditForm({ ...editForm, hashtags: current.filter(t => t !== tag) });
    } else {
      if (current.length >= 3) {
        toast.warning("Chỉ được gán tối đa 3 hashtag!");
        return;
      }
      setEditForm({ ...editForm, hashtags: [...current, tag] });
    }
  };

  return (
    <div className="bg-white border border-outline-variant/60 rounded-2xl flex flex-col h-full shadow-sm overflow-hidden">
      {/* HEADER SECTION */}
      <div className="px-5 py-4 border-b border-outline-variant/40 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <h2 className="text-sm font-black uppercase tracking-widest text-on-surface">
            QUẢN LÝ DIỄN ĐÀN (AI)
          </h2>
          <span className="inline-flex items-center justify-center px-2.5 py-0.5 rounded-full bg-surface-container text-[10px] font-black text-on-surface-variant">
            {total} BÀI VIẾT
          </span>
        </div>

        <div className="flex items-center gap-3">
          {/* Nút Tạo Bài Viết AI */}
          <button
            onClick={handleGenerate}
            disabled={actionLoading}
            className="inline-flex items-center gap-2 rounded-xl bg-primary px-4 py-2 text-xs font-bold text-white hover:bg-primary/90 transition-colors shadow-sm disabled:opacity-70 disabled:cursor-not-allowed"
          >
            {actionLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Sparkles className="w-4 h-4" />}
            {actionLoading ? "Đang viết..." : "Tạo bài viết AI"}
          </button>
          
          {/* Thanh Search */}
          <form onSubmit={handleSearch} className="relative w-full md:w-[280px]">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-on-surface-variant/50" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Tìm tiêu đề..."
              className="w-full rounded-full border border-outline-variant/60 bg-surface-container/20 pl-10 pr-4 py-2 text-sm outline-none focus:border-primary"
            />
          </form>
        </div>
      </div>

      {/* FILTER BAR */}
      <div className="px-4 md:px-5 py-3 border-b border-outline-variant/40 bg-surface-container/10 flex flex-col lg:flex-row lg:items-center justify-between gap-3">
        <div className="flex items-center gap-2 flex-wrap">
          <select 
            className="min-w-[160px] rounded-lg border border-outline-variant/60 bg-white px-3 py-2 text-sm outline-none font-medium"
            value={statusFilter}
            onChange={(e) => { setStatusFilter(e.target.value); setPage(1); }}
          >
            <option value="">Tất cả trạng thái</option>
            <option value="pending">Chờ duyệt</option>
            <option value="published">Đang hoạt động</option>
            <option value="suspended">Tạm thời ngưng</option>
            <option value="rejected">Bị từ chối</option>
          </select>

          <select 
            className="min-w-[160px] rounded-lg border border-outline-variant/60 bg-white px-3 py-2 text-sm outline-none font-medium"
            value={selectedTag}
            onChange={(e) => { setSelectedTag(e.target.value); setPage(1); }}
          >
            <option value="">Tất cả hashtag</option>
            {ALLOWED_HASHTAGS.map(t => <option key={t} value={t}>{t}</option>)}
          </select>
        </div>
      </div>

      {/* TABLE */}
      <div className="overflow-x-auto">
        <table className="w-full min-w-[920px] border-collapse text-left">
          <thead>
            <tr className="border-b border-outline-variant/50 bg-surface-container/30 text-[10px] font-black uppercase tracking-[0.22em] text-on-surface-variant/70">
              <th className="p-4 pl-6 w-[70px]">STT</th>
              <th className="p-4">Tiêu đề</th>
              <th className="p-4 w-[320px]">Hashtags</th>
              <th className="p-4 w-[140px]">Trạng thái</th>
              <th className="p-4 w-[140px]">Thời gian</th>
              <th className="p-4 pr-6 text-center w-[100px]">Thao tác</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-outline-variant/25 text-sm">
            {loading ? (
              <tr>
                <td colSpan={6} className="p-8 text-center text-sm font-bold text-on-surface-variant/60">
                  <Loader2 className="w-6 h-6 animate-spin mx-auto text-primary mb-2" />
                  Đang tải dữ liệu...
                </td>
              </tr>
            ) : posts.length === 0 ? (
              <tr>
                <td colSpan={6} className="p-8 text-center text-sm font-bold text-on-surface-variant/60">Không có bài viết nào</td>
              </tr>
            ) : (
              posts.map((post, idx) => (
                <tr key={post.id} className="hover:bg-surface-container/20 transition-colors">
                  <td className="p-4 pl-6 font-mono text-xs text-on-surface-variant/70">
                    {(page - 1) * limit + idx + 1 < 10 ? `0${(page - 1) * limit + idx + 1}` : (page - 1) * limit + idx + 1}
                  </td>
                  <td className="p-4">
                    <div className="font-black text-on-surface leading-5 line-clamp-2">
                      {post.title}
                    </div>
                  </td>
                  <td className="p-4">
                    <div className="flex items-center gap-1 overflow-hidden">
                      {post.hashtags?.slice(0, 3).map((tag, i) => (
                        <span key={i} className="inline-flex items-center rounded-md bg-surface-container px-2.5 py-1 text-[10px] font-black uppercase tracking-[0.1em] text-teal-700 whitespace-nowrap">
                          {tag}
                        </span>
                      ))}
                      {post.hashtags?.length > 3 && <span className="text-[10px] text-outline ml-1 font-bold">+{post.hashtags.length - 3}</span>}
                    </div>
                  </td>
                  <td className="p-4">
                    <span className={`inline-flex items-center rounded-md px-2.5 py-1 text-[10px] font-black uppercase tracking-[0.1em] whitespace-nowrap ${
                      post.status === 'published' ? 'bg-primary/10 text-primary' :
                      post.status === 'pending' ? 'bg-amber-100 text-amber-800' :
                      post.status === 'suspended' ? 'bg-slate-100 text-slate-600' :
                      'bg-error/10 text-error'
                    }`}>
                      {post.status === 'published' ? 'Đang hoạt động' : 
                       post.status === 'pending' ? 'Chờ duyệt' : 
                       post.status === 'suspended' ? 'Tạm ngưng' : 
                       'Từ chối'}
                    </span>
                  </td>
                  <td className="p-4 text-on-surface-variant/70 text-[11px] font-semibold">
                    {moment(post.created_at).format("DD/MM/YYYY HH:mm")}
                  </td>
                  <td className="p-4 pr-6">
                    <div className="flex items-center justify-center gap-1.5">
                      <button
                        onClick={() => openReviewModal(post)}
                        className="rounded-lg border border-outline-variant/60 px-2.5 py-1.5 text-[11px] font-bold text-on-surface-variant hover:bg-surface-container transition-colors flex items-center gap-1"
                      >
                        <Pencil className="w-3.5 h-3.5" /> Xem
                      </button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* FOOTER & PAGINATION */}
      <div className="px-5 py-4 border-t border-outline-variant/40 mt-auto bg-surface-container/10 flex items-center justify-between">
        <span className="text-[11px] font-bold text-on-surface-variant/60">
          Hiển thị {(page - 1) * limit + 1} - {Math.min(page * limit, total)} trên tổng số {total} bài viết
        </span>
        <Pagination
          currentPage={page}
          totalItems={total}
          itemsPerPage={limit}
          onPageChange={setPage}
        />
      </div>

      {/* Review Modal */}
      {reviewPost && (
        <div className="fixed inset-0 z-[100] bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-3xl max-h-[85vh] flex flex-col overflow-hidden animate-in fade-in zoom-in-95 duration-200">
            <div className="px-5 py-4 border-b border-outline-variant/30 flex justify-between items-center bg-surface-container/20">
              <div className="flex items-center gap-4">
                <h2 className="text-lg font-black text-primary flex items-center gap-2">
                  <Sparkles className="w-5 h-5 text-amber-500" />
                  Kiểm duyệt bài viết
                </h2>
                
                {/* Toggle Chế độ xem */}
                <div className="flex items-center bg-surface border border-outline-variant/40 rounded-lg p-1">
                  <button 
                    onClick={() => setIsPreviewMode(true)}
                    className={`px-3 py-1 text-xs font-bold rounded-md transition-colors ${isPreviewMode ? 'bg-white shadow-sm text-primary' : 'text-on-surface-variant'}`}
                  >
                    Preview
                  </button>
                  <button 
                    onClick={() => setIsPreviewMode(false)}
                    className={`px-3 py-1 text-xs font-bold rounded-md transition-colors ${!isPreviewMode ? 'bg-white shadow-sm text-primary' : 'text-on-surface-variant'}`}
                  >
                    Chỉnh sửa
                  </button>
                </div>
              </div>

              <button onClick={() => setReviewPost(null)} className="text-outline hover:text-on-surface">
                <XCircle className="w-5 h-5" />
              </button>
            </div>
            
            <div className="p-5 overflow-y-auto flex-1 text-sm bg-surface">
              {!isPreviewMode ? (
                /* Edit Mode */
                <div className="space-y-4">
                  <div>
                    <label className="block font-black text-on-surface-variant mb-1 uppercase text-xs">Tiêu đề</label>
                    <input 
                      type="text"
                      className="w-full p-3 bg-white border border-outline-variant/50 rounded-lg font-bold text-on-surface focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary"
                      value={editForm.title}
                      onChange={(e) => setEditForm({...editForm, title: e.target.value})}
                    />
                  </div>

                  <div>
                    <label className="block font-black text-on-surface-variant mb-1 uppercase text-xs">Hashtags (Nhấn để chọn/bỏ chọn)</label>
                    <div className="flex flex-wrap gap-2 p-3 bg-white border border-outline-variant/50 rounded-lg">
                      {ALLOWED_HASHTAGS.map((tag) => {
                        const isSelected = (editForm.hashtags || []).includes(tag);
                        return (
                          <button
                            key={tag}
                            type="button"
                            onClick={() => toggleHashtag(tag)}
                            className={`inline-flex items-center px-3 py-1.5 rounded-full text-xs font-bold transition-colors ${
                              isSelected 
                                ? 'bg-primary text-white shadow-sm' 
                                : 'bg-surface-container/30 text-on-surface-variant hover:bg-surface-container border border-outline-variant/40'
                            }`}
                          >
                            {tag}
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  <div>
                    <label className="block font-black text-on-surface-variant mb-1 uppercase text-xs">Nội dung (Markdown)</label>
                    <textarea 
                      className="w-full p-4 bg-white border border-outline-variant/50 rounded-lg whitespace-pre-wrap font-mono text-xs text-on-surface-variant h-[300px] focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary"
                      value={editForm.content}
                      onChange={(e) => setEditForm({...editForm, content: e.target.value})}
                    />
                  </div>
                </div>
              ) : (
                /* Preview Mode */
                <div className="bg-white rounded-xl border border-outline-variant/30 p-8 shadow-sm">
                  <div className="flex flex-wrap gap-2 mb-4">
                    {(editForm.hashtags || []).map((tag, idx) => {
                      const t = tag.trim();
                      if(!t) return null;
                      return (
                        <span key={idx} className="inline-flex items-center px-2.5 py-1 rounded-full text-[11px] font-black uppercase tracking-[0.1em] bg-primary/10 text-primary border border-primary/20">
                          {t.startsWith('#') ? t : `#${t}`}
                        </span>
                      )
                    })}
                  </div>
                  
                  <h1 className="text-2xl font-black text-on-surface mb-6 leading-tight">
                    {editForm.title}
                  </h1>
                  
                  <div className="prose prose-sm prose-slate max-w-none prose-headings:font-black prose-a:text-primary hover:prose-a:text-primary-container">
                    <ReactMarkdown>{editForm.content}</ReactMarkdown>
                  </div>
                </div>
              )}
              
              <div className="mt-4 flex items-start gap-2 text-amber-700 bg-amber-50 p-3 rounded-lg border border-amber-200/60">
                <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                <p className="text-xs font-bold">Bạn có thể trực tiếp sửa lại các lỗi sai của AI trước khi ấn duyệt bài.</p>
              </div>
            </div>

            <div className="px-5 py-4 border-t border-outline-variant/30 bg-surface-container/10 flex justify-end gap-2">
              <button 
                onClick={() => setReviewPost(null)}
                className="px-4 py-2 rounded text-sm font-bold text-on-surface-variant hover:bg-surface-container transition-colors"
              >
                Hủy
              </button>
              {reviewPost.status === 'pending' && (
                <>
                  <button 
                    onClick={() => updateStatus(reviewPost.id, 'rejected', true)}
                    className="px-4 py-2 rounded text-sm font-bold bg-error/10 text-error hover:bg-error/20 transition-colors flex items-center gap-1.5"
                  >
                    Từ chối
                  </button>
                  <button 
                    onClick={() => updateStatus(reviewPost.id, 'published', true)}
                    className="px-4 py-2 rounded text-sm font-bold bg-primary text-white hover:bg-primary-container transition-colors shadow-sm flex items-center gap-1.5"
                  >
                    <CheckCircle className="w-4 h-4" /> Lưu & Phê duyệt
                  </button>
                </>
              )}
              {reviewPost.status === 'rejected' && (
                <button 
                  onClick={() => updateStatus(reviewPost.id, 'published', true)}
                  className="px-4 py-2 rounded text-sm font-bold bg-primary text-white hover:bg-primary-container transition-colors shadow-sm flex items-center gap-1.5"
                >
                  <CheckCircle className="w-4 h-4" /> Lưu & Phê duyệt
                </button>
              )}
              {reviewPost.status === 'published' && (
                <>
                  <button 
                    onClick={() => updateStatus(reviewPost.id, 'suspended', true)}
                    className="px-4 py-2 rounded text-sm font-bold bg-slate-100 text-slate-700 hover:bg-slate-200 transition-colors flex items-center gap-1.5"
                  >
                    Tạm ngưng
                  </button>
                  <button 
                    onClick={() => updateStatus(reviewPost.id, 'published', true)}
                    className="px-4 py-2 rounded text-sm font-bold bg-primary text-white hover:bg-primary-container transition-colors shadow-sm flex items-center gap-1.5"
                  >
                    <CheckCircle className="w-4 h-4" /> Lưu thay đổi
                  </button>
                </>
              )}
              {reviewPost.status === 'suspended' && (
                <>
                  <button 
                    onClick={() => updateStatus(reviewPost.id, 'published', true)}
                    className="px-4 py-2 rounded text-sm font-bold bg-primary/10 text-primary hover:bg-primary/20 transition-colors flex items-center gap-1.5"
                  >
                    Mở lại
                  </button>
                  <button 
                    onClick={() => updateStatus(reviewPost.id, 'suspended', true)}
                    className="px-4 py-2 rounded text-sm font-bold bg-primary text-white hover:bg-primary-container transition-colors shadow-sm flex items-center gap-1.5"
                  >
                    <CheckCircle className="w-4 h-4" /> Lưu thay đổi
                  </button>
                </>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Generate AI Modal */}
      {showGenerateModal && (
        <div className="fixed inset-0 z-[100] bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-md flex flex-col overflow-hidden animate-in fade-in zoom-in-95 duration-200">
            <div className="px-5 py-4 border-b border-outline-variant/30 flex justify-between items-center bg-surface-container/20">
              <h2 className="text-lg font-black text-primary flex items-center gap-2">
                <Sparkles className="w-5 h-5 text-amber-500" />
                Tuỳ chỉnh AI (Tùy chọn)
              </h2>
              <button onClick={() => setShowGenerateModal(false)} className="text-outline hover:text-on-surface">
                <XCircle className="w-5 h-5" />
              </button>
            </div>
            
            <div className="p-5 text-sm bg-surface">
              <p className="text-on-surface-variant font-medium mb-4 text-xs">
                Bạn có thể chọn tối đa 3 chủ đề (hashtag) để AI tập trung viết bài. Nếu bỏ trống, AI sẽ tự động chọn chủ đề ngẫu nhiên.
              </p>
              
              <div className="flex flex-wrap gap-2">
                {ALLOWED_HASHTAGS.map((tag) => {
                  const isSelected = selectedGenerateTags.includes(tag);
                  return (
                    <button
                      key={tag}
                      type="button"
                      onClick={() => {
                        if (isSelected) {
                          setSelectedGenerateTags(selectedGenerateTags.filter(t => t !== tag));
                        } else {
                          if (selectedGenerateTags.length >= 3) {
                            toast.warning("Chỉ được chọn tối đa 3 hashtag!");
                            return;
                          }
                          setSelectedGenerateTags([...selectedGenerateTags, tag]);
                        }
                      }}
                      className={`inline-flex items-center px-3 py-1.5 rounded-full text-xs font-bold transition-colors ${
                        isSelected 
                          ? 'bg-primary text-white shadow-sm' 
                          : 'bg-surface-container/30 text-on-surface-variant hover:bg-surface-container border border-outline-variant/40'
                      }`}
                    >
                      {tag}
                    </button>
                  );
                })}
              </div>
            </div>

            <div className="px-5 py-4 border-t border-outline-variant/30 bg-surface-container/10 flex justify-end gap-2">
              <button 
                onClick={() => setShowGenerateModal(false)}
                className="px-4 py-2 rounded text-sm font-bold text-on-surface-variant hover:bg-surface-container transition-colors"
              >
                Hủy
              </button>
              <button 
                onClick={executeGenerateAI}
                className="px-4 py-2 rounded text-sm font-bold bg-primary text-white hover:bg-primary-container transition-colors shadow-sm flex items-center gap-1.5"
              >
                <Sparkles className="w-4 h-4" /> Bắt đầu tạo
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ForumManagement;
