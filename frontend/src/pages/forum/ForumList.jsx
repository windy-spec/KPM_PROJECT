import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { Search, Loader2, Calendar, Hash, ChevronRight } from "lucide-react";
import forumService from "../../services/forumService";
import moment from "moment";

const ALLOWED_HASHTAGS = [
  "#NoiThat", "#ThietKe", "#XuHuong", "#KienThuc",
  "#BaoGia", "#DuAn", "#SanXuat", "#GocChiaSe"
];

const ForumList = () => {
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedTag, setSelectedTag] = useState("");
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const limit = 9;

  const fetchPosts = async () => {
    setLoading(true);
    try {
      const res = await forumService.getPublicPosts({
        page,
        limit,
        search: searchTerm,
        hashtag: selectedTag
      });
      if (res.success) {
        setPosts(res.posts);
        setTotal(res.total);
      }
    } catch (error) {
      console.error("Failed to fetch posts", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPosts();
  }, [page, selectedTag]);

  // Use a debounce for search if preferred, or just a simple form submit
  const handleSearch = (e) => {
    e.preventDefault();
    setPage(1);
    fetchPosts();
  };

  return (
    <div className="min-h-screen bg-gray-50/50 py-12">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">

        {/* Header Section */}
        <div className="text-center mb-16">
          <h1 className="text-4xl md:text-5xl font-extrabold text-on-surface mb-4 tracking-tight">
            Diễn đàn <span className="text-primary">KPM</span>
          </h1>
          <p className="text-lg text-on-surface-variant max-w-2xl mx-auto">
            Khám phá những kiến thức, xu hướng mới nhất và báo giá chi tiết về các sản phẩm cơ khí, nội thất thép.
          </p>
        </div>

        {/* Filters and Search - Modern Big Bar */}
        <div className="mb-12 max-w-4xl mx-auto px-2">
          <form
            onSubmit={handleSearch}
            className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 bg-white p-2.5 rounded-2xl border border-outline-variant/40 shadow-sm hover:shadow-md focus-within:shadow-md focus-within:ring-2 focus-within:ring-primary/20 transition-all duration-300"
          >

            {/* Search Input (Phần Search lớn & nổi bật) */}
            <div className="relative flex-1 flex items-center min-w-0">
              <Search className="h-5 w-5 text-outline absolute left-3.5 pointer-events-none transition-colors group-focus-within:text-primary" />
              <input
                type="text"
                className="w-full pl-11 pr-4 py-3 bg-transparent text-base font-semibold text-on-surface placeholder:text-outline/70 placeholder:font-normal focus:outline-none"
                placeholder="Tìm kiếm bài viết, xu hướng, báo giá..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>

            {/* Custom Styled Dropdown (Được bọc gọn gàng) */}
            <div className="relative shrink-0 sm:border-l sm:border-outline-variant/30 sm:pl-2.5">
              <div className="relative flex items-center">
                <Hash className="w-4 h-4 text-primary absolute left-3 pointer-events-none opacity-80" />
                <select
                  value={selectedTag}
                  onChange={(e) => {
                    setSelectedTag(e.target.value);
                    setPage(1);
                  }}
                  className="w-full sm:w-auto appearance-none bg-surface-container/30 hover:bg-surface-container/60 text-on-surface font-bold text-sm py-3 pl-9 pr-10 rounded-xl cursor-pointer focus:outline-none border border-outline-variant/20 hover:border-primary/30 transition-all text-ellipsis"
                >
                  <option value="" className="font-semibold text-on-surface">Tất cả chủ đề</option>
                  {ALLOWED_HASHTAGS.map((tag) => (
                    <option key={tag} value={tag} className="font-semibold text-on-surface">
                      {tag}
                    </option>
                  ))}
                </select>

                {/* Custom Chevron Icon */}
                <div className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-on-surface-variant/70">
                  <ChevronRight className="w-4 h-4 rotate-90" />
                </div>
              </div>
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              className="bg-primary hover:bg-primary-container text-white font-bold text-sm px-6 py-3 rounded-xl shadow-sm hover:shadow transition-all duration-200 shrink-0 flex items-center justify-center gap-2"
            >
              <span>Tìm kiếm</span>
            </button>
          </form>
        </div>

        {/* Posts Grid */}
        {loading ? (
          <div className="flex justify-center items-center h-64">
            <Loader2 className="w-10 h-10 text-primary animate-spin" />
          </div>
        ) : posts.length === 0 ? (
          <div className="text-center py-20 bg-white rounded-3xl border border-outline-variant/30 shadow-sm">
            <div className="w-20 h-20 bg-surface rounded-full flex items-center justify-center mx-auto mb-4">
              <Search className="w-8 h-8 text-outline" />
            </div>
            <h3 className="text-xl font-bold text-on-surface mb-1">Không tìm thấy bài viết nào</h3>
            <p className="text-on-surface-variant">Hãy thử thay đổi từ khóa hoặc bộ lọc hashtag khác.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {posts.map((post) => (
              <Link
                to={`/forum/${post.id}`}
                key={post.id}
                className="group flex flex-col bg-white rounded-2xl overflow-hidden shadow-sm hover:shadow-xl transition-all duration-300 border border-outline-variant/20 transform hover:-translate-y-1"
              >
                <div className="p-8 flex flex-col flex-grow relative">
                  <div className="absolute top-0 left-0 w-full h-1 bg-primary opacity-0 group-hover:opacity-100 transition-opacity"></div>

                  <div className="flex flex-wrap gap-2 mb-4">
                    {post.hashtags?.map((tag, idx) => (
                      <span key={idx} className="inline-flex items-center px-3 py-1 rounded-full text-xs font-bold bg-primary/10 text-primary">
                        {tag}
                      </span>
                    ))}
                  </div>

                  <h2 className="text-xl font-black text-on-surface mb-4 line-clamp-3 group-hover:text-primary transition-colors leading-snug">
                    {post.title}
                  </h2>

                  <div className="mt-auto pt-6 flex items-center justify-between text-sm text-on-surface-variant border-t border-outline-variant/10">
                    <div className="flex items-center gap-2">
                      <Calendar className="w-4 h-4 text-outline" />
                      {moment(post.created_at).format("DD/MM/YYYY")}
                    </div>
                    <div className="flex items-center text-primary font-bold group-hover:translate-x-1 transition-transform">
                      Đọc tiếp
                      <ChevronRight className="w-4 h-4 ml-1" />
                    </div>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        )}

        {/* Pagination */}
        {!loading && total > limit && (
          <div className="mt-12 flex justify-center gap-2">
            {Array.from({ length: Math.ceil(total / limit) }).map((_, idx) => (
              <button
                key={idx}
                onClick={() => setPage(idx + 1)}
                className={`w-10 h-10 rounded-full flex items-center justify-center font-bold transition-colors ${page === idx + 1
                  ? "bg-primary text-white shadow-md"
                  : "bg-white text-on-surface-variant hover:bg-surface-container border border-outline-variant/30"
                  }`}
              >
                {idx + 1}
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default ForumList;
