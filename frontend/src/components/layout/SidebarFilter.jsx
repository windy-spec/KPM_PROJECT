import React, { useState, useEffect } from 'react';
import { Filter, ChevronDown } from 'lucide-react';
import { categoryService } from '../../services/category.service';

const SidebarFilter = ({ onFilterChange, initialCategoryIds = [] }) => {
  const [categories, setCategories] = useState([]);
  const [expandedParents, setExpandedParents] = useState({});
  const [selectedCategoryIds, setSelectedCategoryIds] = useState(initialCategoryIds);

  useEffect(() => {
    const fetchCategories = async () => {
      try {
        const res = await categoryService.getCategories();
        const fetchedCategories = res.data?.data || res.data || [];
        setCategories(fetchedCategories);

        // Tự động mở rộng danh mục cha nếu đang có initialCategoryIds
        if (initialCategoryIds && initialCategoryIds.length > 0) {
          const initialExpanded = {};
          fetchedCategories.forEach(parent => {
            if (initialCategoryIds.includes(parent.id)) {
              initialExpanded[parent.id] = true;
            }
            if (parent.sub_categories?.some(child => initialCategoryIds.includes(child.id))) {
              initialExpanded[parent.id] = true;
            }
          });
          setExpandedParents(prev => ({ ...prev, ...initialExpanded }));
        }

      } catch (error) {
        console.error("Lỗi lấy danh mục", error);
      }
    };
    fetchCategories();
  }, [initialCategoryIds]);

  useEffect(() => {
    if (initialCategoryIds && initialCategoryIds.length > 0) {
      setSelectedCategoryIds(initialCategoryIds);
    }
  }, [initialCategoryIds]);

  const toggleParent = (parentId) => {
    setExpandedParents(prev => ({
      ...prev,
      [parentId]: !prev[parentId]
    }));
  };

  const handleCheckboxChange = (childId) => {
    setSelectedCategoryIds(prev => {
      const isSelected = prev.includes(childId);
      let newSelected;
      if (isSelected) {
        newSelected = prev.filter(id => id !== childId);
      } else {
        newSelected = [...prev, childId];
      }
      return newSelected;
    });
  };

  // Kích hoạt sự kiện thay đổi
  const handleApplyFilter = () => {
    onFilterChange({ categories: selectedCategoryIds });
  };

  const handleClearFilter = () => {
    setSelectedCategoryIds([]);
    onFilterChange({ categories: [] });
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
          {categories.map(parent => (
            <div key={parent.id} className="border border-outline-variant/30 rounded-lg overflow-hidden bg-surface-container/20">
              <button 
                onClick={() => toggleParent(parent.id)}
                className="w-full flex items-center justify-between p-3 text-xs font-black text-on-surface hover:bg-surface-container/50 transition-colors"
              >
                <span>{parent.category_name}</span>
                <ChevronDown className={`w-4 h-4 text-on-surface-variant transition-transform duration-300 ${expandedParents[parent.id] ? 'rotate-180' : ''}`} />
              </button>
              
              {/* Danh mục con */}
              <div className={`overflow-hidden transition-all duration-300 ${expandedParents[parent.id] ? 'max-h-[500px] border-t border-outline-variant/30 p-3' : 'max-h-0'}`}>
                {parent.sub_categories?.length > 0 ? (
                  <div className="space-y-2.5 pl-2 border-l border-outline-variant/50 ml-1">
                    {parent.sub_categories.map(child => (
                      <label key={child.id} className="flex items-center gap-3 text-xs font-bold text-on-surface-variant cursor-pointer select-none group">
                        <input 
                          type="checkbox" 
                          checked={selectedCategoryIds.includes(child.id)}
                          onChange={() => handleCheckboxChange(child.id)}
                          className="w-4 h-4 accent-primary rounded border-outline-variant focus:ring-0 cursor-pointer" 
                        />
                        <span className="group-hover:text-primary transition-colors">{child.category_name}</span>
                      </label>
                    ))}
                  </div>
                ) : (
                  <div className="text-[10px] text-on-surface-variant/50 px-2">Chưa có danh mục con</div>
                )}
              </div>
            </div>
          ))}
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