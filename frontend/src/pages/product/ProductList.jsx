import React, { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { ChevronLeft, ChevronRight, Loader2 } from 'lucide-react';
import ProductCard from '../../components/common/ProductCard';
import SidebarFilter from '../../components/layout/SidebarFilter';
import { productService } from '../../services/product.service';

const ProductList = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const searchParams = new URLSearchParams(location.search);
  const initialCategory = searchParams.get('category');
  // Phân rã tham số category từ URL (ví dụ "101,102" thành ["101", "102"])
  const initialCategoryIds = initialCategory
    ? initialCategory.split(',').map(id => String(id).trim()).filter(Boolean)
    : [];

  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [pagination, setPagination] = useState({ page: 1, totalPage: 1, totalItem: 0 });
  const [filters, setFilters] = useState({ categories: initialCategory ? [initialCategory] : [] });

  // Lắng nghe khi URL thay đổi (nhấn từ NavigationMenu hoặc F5) để đồng bộ vào State lọc
  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const catParam = params.get('category');
    const updatedIds = catParam
      ? catParam.split(',').map(id => String(id).trim()).filter(Boolean)
      : [];

    setFilters({ categories: updatedIds });
  }, [location.search]);

  // Gọi API lấy sản phẩm dựa trên State lọc hiện tại
  const fetchProducts = async (page = 1) => {
    setLoading(true);
    try {
      const categoryIdParam = filters.categories.length > 0 ? filters.categories.join(',') : undefined;
      const res = await productService.getProducts({ page, limit: 12, category_id: categoryIdParam });
      const data = res.data;
      setProducts(data.data || []);
      setPagination(data.pagination || { page: 1, totalPage: 1, totalItem: 0 });
    } catch (error) {
      console.error("Lỗi lấy danh sách sản phẩm:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProducts(1);
  }, [filters]);

  const handlePageChange = (newPage) => {
    if (newPage >= 1 && newPage <= pagination.totalPage) {
      fetchProducts(newPage);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  const handleFilterChange = (newFilters) => {
    const selectedIds = newFilters.categories || [];

    // 1. Cập nhật State để chạy API lấy sản phẩm mới
    setFilters({ categories: selectedIds });

    // 2. Đồng bộ hóa trực tiếp danh sách ID đang chọn lên thanh URL trình duyệt
    const params = new URLSearchParams(location.search);
    if (selectedIds.length > 0) {
      params.set('category', selectedIds.join(',')); // Tạo chuỗi dạng ?category=101,102
    } else {
      params.delete('category'); // Nếu mảng rỗng (Xóa lọc) thì xóa hẳn chữ category trên URL
    }

    // Đẩy URL mới lên thanh địa chỉ mà không làm reload lại toàn bộ trang
    navigate({ search: params.toString() }, { replace: true });
  };

  return (
    <div className="min-h-screen bg-surface font-sans antialiased text-on-surface pb-16">
      {/* Breadcrumb */}
      <div className="max-w-7xl mx-auto px-4 pt-6 text-xs font-bold text-on-surface-variant/60 uppercase tracking-wider flex items-center gap-2">
        <span>Trang chủ</span>
        <span>/</span>
        <span className="text-primary">Danh mục Sản phẩm & Gia công</span>
      </div>

      {/* Tiêu đề */}
      <div className="max-w-7xl mx-auto px-4 pt-4 pb-8">
        <h1 className="text-2xl md:text-3xl font-black text-on-surface uppercase tracking-tight italic">
          Sản phẩm cấu hình may đo
        </h1>
      </div>

      {/* Layout Grid chính */}
      <div className="max-w-7xl mx-auto px-4 grid grid-cols-1 lg:grid-cols-4 gap-8">

        {/* CỘT TRÁI: SidebarFilter */}
        <div className="lg:col-span-1">
          <SidebarFilter
            onFilterChange={handleFilterChange}
            initialCategoryIds={filters.categories}
          />
        </div>

        {/* CỘT PHẢI: LƯỚI SẢN PHẨM */}
        <main className="lg:col-span-3">
          {/* Toolbar */}
          <div className="bg-white border border-outline-variant rounded-2xl p-4 flex justify-between items-center mb-6 shadow-sm">
            <div className="text-xs font-bold text-on-surface-variant/80">
              Hiển thị <span className="text-on-surface font-black">{products.length > 0 ? (pagination.page - 1) * 12 + 1 : 0} - {Math.min(pagination.page * 12, pagination.totalItem)}</span> trong số <span className="text-primary font-black">{pagination.totalItem}</span> sản phẩm
            </div>
          </div>

          {/* Lưới sản phẩm dùng ProductCard */}
          {loading ? (
            <div className="flex justify-center items-center py-20">
              <Loader2 className="animate-spin text-primary w-8 h-8" />
            </div>
          ) : products.length > 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-6">
              {products.map(product => (
                <ProductCard key={product.id} product={product} />
              ))}
            </div>
          ) : (
            <div className="text-center py-20 text-on-surface-variant/60 font-medium">
              Không tìm thấy sản phẩm nào phù hợp với bộ lọc hiện tại.
            </div>
          )}

          {/* Phân trang */}
          {pagination.totalPage > 1 && (
            <div className="mt-12 flex items-center justify-center gap-1.5 text-xs font-black">
              <button
                onClick={() => handlePageChange(pagination.page - 1)}
                disabled={pagination.page === 1}
                className="w-9 h-9 border border-outline-variant rounded-lg bg-white text-on-surface-variant flex items-center justify-center disabled:opacity-50"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>

              {[...Array(pagination.totalPage)].map((_, idx) => {
                const pageNum = idx + 1;
                return (
                  <button
                    key={pageNum}
                    onClick={() => handlePageChange(pageNum)}
                    className={`w-9 h-9 rounded-lg flex items-center justify-center border transition-colors ${pageNum === pagination.page
                      ? 'bg-primary border-primary text-white'
                      : 'bg-white border-outline-variant text-on-surface-variant hover:border-primary/50'
                      }`}
                  >
                    {pageNum}
                  </button>
                );
              })}

              <button
                onClick={() => handlePageChange(pagination.page + 1)}
                disabled={pagination.page === pagination.totalPage}
                className="w-9 h-9 border border-outline-variant rounded-lg bg-white text-on-surface-variant flex items-center justify-center disabled:opacity-50"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          )}
        </main>

      </div>
    </div>
  );
};

export default ProductList;