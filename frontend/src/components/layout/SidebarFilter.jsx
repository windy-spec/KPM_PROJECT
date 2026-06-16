import React, { useState, useEffect } from 'react';
import { Filter, ChevronDown } from 'lucide-react';
import { useNavigate } from 'react-router-dom'; // Dùng để điều hướng dọn URL khi xóa lọc
import { categoryService } from '../../services/category.service';

const SidebarFilter = ({ onFilterChange, initialCategoryIds = [] }) => {
  const navigate = useNavigate();
  const [categories, setCategories] = useState([]);
  const [expandedParents, setExpandedParents] = useState({});

  // Chuẩn hóa ban đầu từ URL đổ xuống thành mảng String phẳng
  const [selectedCategoryIds, setSelectedCategoryIds] = useState(() => {
    if (!initialCategoryIds) return [];
    return initialCategoryIds.map(id => String(id).trim()).filter(id => id && id !== 'NaN');
  });

  // Effect 1: Lấy danh mục từ API và xử lý mở rộng cha / tích con nếu đi từ danh mục cha vào
  useEffect(() => {
    const fetchCategories = async () => {
      try {
        const res = await categoryService.getCategories();
        const fetchedCategories = res.data?.data || res.data || [];
        setCategories(fetchedCategories);

        const normalizedInitIds = (initialCategoryIds || [])
          .map(id => String(id).trim())
          .filter(id => id && id !== 'NaN');

        if (normalizedInitIds.length > 0) {
          const initialExpanded = {};
          const autoSelectChildIds = [];

          fetchedCategories.forEach(parent => {
            const parentIdStr = String(parent.id).trim();
            const isParentSelected = normalizedInitIds.includes(parentIdStr);
            const hasActiveChild = parent.sub_categories?.some(
              child => normalizedInitIds.includes(String(child.id).trim())
            );

            if (isParentSelected || hasActiveChild) {
              initialExpanded[parentIdStr] = true;

              // Nếu URL chứa ID của danh mục cha, tự động gom toàn bộ danh mục con của nó
              if (isParentSelected && parent.sub_categories?.length > 0) {
                parent.sub_categories.forEach(child => {
                  autoSelectChildIds.push(String(child.id).trim());
                });
              }
            }
          });

          setExpandedParents(prev => ({ ...prev, ...initialExpanded }));

          if (autoSelectChildIds.length > 0) {
            setSelectedCategoryIds(autoSelectChildIds);
          }
        }

      } catch (error) {
        console.error("Lỗi lấy danh mục", error);
      }
    };
    fetchCategories();
  }, [initialCategoryIds]);

  // Effect 2: Đồng bộ state khi URL thay đổi (Giúp giữ trạng thái khi người dùng Refresh trang)
  useEffect(() => {
    const normalizedInitIds = (initialCategoryIds || [])
      .map(id => String(id).trim())
      .filter(id => id && id !== 'NaN');

    if (normalizedInitIds.length > 0 && categories.length > 0) {
      const autoSelectChildIds = [];

      categories.forEach(parent => {
        const parentIdStr = String(parent.id).trim();
        if (normalizedInitIds.includes(parentIdStr) && parent.sub_categories?.length > 0) {
          parent.sub_categories.forEach(child => {
            autoSelectChildIds.push(String(child.id).trim());
          });
        }
      });

      if (autoSelectChildIds.length > 0) {
        setSelectedCategoryIds(autoSelectChildIds);
        return;
      }
    }

    setSelectedCategoryIds(normalizedInitIds);
  }, [initialCategoryIds, categories]);

  const toggleParent = (parentId) => {
    const pIdStr = String(parentId).trim();
    setExpandedParents(prev => ({
      ...prev,
      [pIdStr]: !prev[pIdStr]
    }));
  };

  // Hàm xử lý Checkbox an toàn bằng String, loại bỏ hoàn toàn các lỗi tích nhầm hàng loạt
  const handleCheckboxChange = (id) => {
    const targetIdStr = String(id).trim();
    if (!targetIdStr || targetIdStr === 'NaN') return;

    setSelectedCategoryIds(prev => {
      const cleanPrev = prev.map(item => String(item).trim()).filter(item => item && item !== 'NaN');

      if (cleanPrev.includes(targetIdStr)) {
        return cleanPrev.filter(item => item !== targetIdStr);
      } else {
        return [...cleanPrev, targetIdStr];
      }
    });
  };

  const handleApplyFilter = () => {
    onFilterChange({ categories: selectedCategoryIds });
  };

  // HÀM XÓA LỌC: Chỉ kích hoạt xóa sạch bách khi chủ động click nút này
  const handleClearFilter = () => {
    setSelectedCategoryIds([]);       // Xóa trắng ô tích chọn
    setExpandedParents({});          // Thu gọn toàn bộ danh mục đang mở
    onFilterChange({ categories: [] }); // Cập nhật danh sách hiển thị về tổng

    // Điều hướng dọn sạch thanh URL trình duyệt về trang tổng mặc định
    navigate('/products', { replace: true });
  };

  return (
    <aside className="bg-white border border-outline-variant rounded-2xl p-6 shadow-sm h-fit sticky top-24 w-full">
      {/* Header */}
      <div className="flex items-center justify-between pb-4 border-b border-outline-variant/60 mb-6">
        <div className="flex items-center gap-2 text-sm font-black uppercase tracking-wider">
          <Filter className="w-4 h-4 text-primary" />
          <span>Bộ lọc</span>
        </div>
        <button
          onClick={handleClearFilter}
          type="button"
          className="text-[10px] font-black uppercase text-on-surface-variant/60 hover:text-primary transition-colors"
        >
          Xóa lọc
        </button>
      </div>

      {/* Danh mục */}
      <div className="mb-6">
        <h4 className="text-[10px] font-black uppercase text-on-surface-variant tracking-widest mb-3 opacity-80">
          Danh mục sản phẩm
        </h4>
        <div className="space-y-3">
          {categories.map(parent => {
            const pIdStr = String(parent.id).trim();
            const isExpanded = !!expandedParents[pIdStr];

            return (
              <div key={`p-box-${pIdStr}`} className="border border-outline-variant/30 rounded-lg overflow-hidden bg-surface-container/20">
                <button
                  type="button"
                  onClick={() => toggleParent(parent.id)}
                  className="w-full flex items-center justify-between p-3 text-xs font-black text-on-surface hover:bg-surface-container/50 transition-colors"
                >
                  <span>{parent.category_name}</span>
                  <ChevronDown className={`w-4 h-4 text-on-surface-variant transition-transform duration-300 ${isExpanded ? 'rotate-180' : ''}`} />
                </button>

                {/* Danh mục con */}
                <div className={`overflow-hidden transition-all duration-300 ${isExpanded ? 'max-h-[500px] border-t border-outline-variant/30 p-3' : 'max-h-0'}`}>
                  {parent.sub_categories?.length > 0 ? (
                    <div className="space-y-2.5 pl-2 border-l border-outline-variant/50 ml-1">
                      {parent.sub_categories.map(child => {
                        const childIdStr = String(child.id).trim();
                        const isChecked = selectedCategoryIds.includes(childIdStr);

                        return (
                          <label key={`c-label-${pIdStr}-${childIdStr}`} className="flex items-center gap-3 text-xs font-bold text-on-surface-variant cursor-pointer select-none group">
                            <input
                              type="checkbox"
                              checked={isChecked}
                              onChange={() => handleCheckboxChange(child.id)}
                              className="w-4 h-4 accent-primary rounded border-outline-variant focus:ring-0 cursor-pointer"
                            />
                            <span className="group-hover:text-primary transition-colors">{child.category_name}</span>
                          </label>
                        );
                      })}
                    </div>
                  ) : (
                    <div className="text-[10px] text-on-surface-variant/50 px-2">Chưa có danh mục con</div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Nút hành động */}
      <button
        onClick={handleApplyFilter}
        className="w-full py-3.5 bg-primary text-white text-xs font-black uppercase tracking-widest rounded-xl hover:bg-primary/90 transition-all shadow-md shadow-primary/20 active:scale-[0.98]"
      >
        Áp dụng bộ lọc
      </button>
    </aside>
  );
};

export default SidebarFilter;