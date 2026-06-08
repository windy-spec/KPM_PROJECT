import React, { useState, useRef, useEffect } from "react";
import { ChevronDown, Info } from "lucide-react";

function LaborCategorySelect({ value, onChange, categories }) {
  const [isOpen, setIsOpen] = useState(false);
  const [hoveredDesc, setHoveredDesc] = useState("");
  const dropdownRef = useRef(null);

  // Tìm loại thợ đang được chọn hiện tại
  const selectedCategory = categories.find((c) => c.id === value);

  // Tối ưu: Đóng dropdown khi người dùng click ra ngoài khu vực menu
  useEffect(() => {
    function handleClickOutside(event) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  return (
    <div className="relative min-w-[180px]" ref={dropdownRef}>
      {/* Nút bấm kích hoạt mở Dropdown */}
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="flex h-10 w-full items-center justify-between rounded-xl border border-outline-variant/60 bg-white px-3 text-[13px] font-semibold text-on-surface outline-none focus:border-primary transition-colors"
      >
        <span className="truncate">
          {selectedCategory ? selectedCategory.category_name : "-- Chọn Loại Thợ --"}
        </span>
        <ChevronDown
          className={`w-4 h-4 text-on-surface-variant/60 transition-transform duration-200 ${
            isOpen ? "rotate-180" : ""
          }`}
        />
      </button>

      {/* Menu thả xuống đổ dữ liệu */}
      {isOpen && (
        <div className="absolute left-0 top-[44px] z-50 flex w-[460px] max-w-[90vw] rounded-xl border border-outline-variant/50 bg-white p-2 shadow-xl animate-in fade-in slide-in-from-top-2 duration-150">
          
          {/* CỘT TRÁI: Danh sách các loại thợ */}
          <div className="w-1/2 max-h-60 overflow-y-auto pr-1 border-r border-outline-variant/30 space-y-0.5">
            {categories.length === 0 ? (
              <div className="p-3 text-center text-xs text-on-surface-variant/50">
                Không có dữ liệu
              </div>
            ) : (
              categories.map((c) => (
                <button
                  key={c.id}
                  type="button"
                  onClick={() => {
                    onChange(c.id);
                    setIsOpen(false);
                  }}
                  // Bắt sự kiện Hover tối ưu nội bộ tại đây
                  onMouseEnter={() => setHoveredDesc(c.description || "Chưa có mô tả chi tiết cho loại thợ này.")}
                  onMouseLeave={() => setHoveredDesc("")}
                  className={`w-full text-left px-3 py-2 rounded-lg text-[13px] font-medium transition-colors ${
                    value === c.id
                      ? "bg-primary text-white font-bold"
                      : "text-on-surface-variant hover:bg-surface-container/50 hover:text-on-surface"
                  }`}
                >
                  {c.category_name}
                </button>
              ))
            )}
          </div>

          {/* CỘT PHẢI: Khung hiển thị mô tả Real-time */}
          <div className="w-1/2 p-3 bg-surface-container/10 rounded-lg flex flex-col justify-start select-none">
            <span className="text-[10px] font-black uppercase tracking-wider text-primary flex items-center gap-1 mb-1.5">
              <Info className="w-3 h-3" /> Chi tiết công việc
            </span>
            <p className="text-xs text-on-surface-variant leading-relaxed font-normal break-words">
              {hoveredDesc || (selectedCategory?.description || "Di chuột vào loại thợ để xem mô tả công việc cụ thể.")}
            </p>
          </div>

        </div>
      )}
    </div>
  );
}

export default LaborCategorySelect;