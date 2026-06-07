import React from 'react';

function Pagination({ currentPage, totalPages, onPageChange }) {
  if (totalPages <= 1) return null;

  // Thuật toán tính toán các trang cần hiển thị (bao gồm cả dấu '...')
  const getPageNumbers = () => {
    const pages = [];
    const siblingCount = 1; // Số lượng trang hiển thị bên cạnh trang hiện tại (Ví dụ: [Trang trước] [Hiện tại] [Trang sau])

    // Luôn luôn hiển thị trang đầu tiên
    pages.push(1);

    // Tính toán khoảng hiển thị ở giữa
    const leftSiblingIndex = Math.max(currentPage - siblingCount, 2);
    const rightSiblingIndex = Math.min(currentPage + siblingCount, totalPages - 1);

    // Kiểm tra xem có cần hiển thị dấu '...' ở bên trái không
    if (leftSiblingIndex > 2) {
      pages.push('...');
    }

    // Thêm các trang ở giữa vào mảng
    for (let i = leftSiblingIndex; i <= rightSiblingIndex; i++) {
      pages.push(i);
    }

    // Kiểm tra xem có cần hiển thị dấu '...' ở bên phải không
    if (rightSiblingIndex < totalPages - 1) {
      pages.push('...');
    }

    // Luôn luôn hiển thị trang cuối cùng (nếu tổng số trang > 1)
    if (totalPages > 1) {
      pages.push(totalPages);
    }

    return pages;
  };

  const pageNumbers = getPageNumbers();

  return (
    <div className="flex items-center justify-end gap-2 mt-4 px-4 py-3 border-t border-outline-variant/30 bg-surface-container/10 rounded-b-xl select-none">
      {/* Nút Trước */}
      <button
        disabled={currentPage === 1}
        onClick={() => onPageChange(currentPage - 1)}
        className="rounded-lg border border-outline-variant/60 px-3 py-1.5 text-xs font-bold hover:bg-surface-container transition-colors disabled:opacity-40 disabled:cursor-not-allowed text-on-surface"
      >
        Trước
      </button>
      
      {/* Danh sách số trang */}
      <div className="flex items-center gap-1">
        {pageNumbers.map((page, index) => {
          // Nếu là dấu ba chấm, render thẻ span không có sự kiện click
          if (page === '...') {
            return (
              <span
                key={`ellipsis-${index}`}
                className="w-8 h-8 flex items-center justify-center text-xs font-bold text-on-surface-variant/60"
              >
                ...
              </span>
            );
          }

          // Render nút bấm số trang thông thường
          return (
            <button
              key={`page-${page}`}
              onClick={() => onPageChange(page)}
              className={`w-8 h-8 rounded-lg text-xs font-black transition-colors ${
                currentPage === page
                  ? "bg-primary text-white"
                  : "hover:bg-surface-container text-on-surface"
              }`}
            >
              {page}
            </button>
          );
        })}
      </div>

      {/* Nút Sau */}
      <button
        disabled={currentPage === totalPages}
        onClick={() => onPageChange(currentPage + 1)}
        className="rounded-lg border border-outline-variant/60 px-3 py-1.5 text-xs font-bold hover:bg-surface-container transition-colors disabled:opacity-40 disabled:cursor-not-allowed text-on-surface"
      >
        Sau
      </button>
    </div>
  );
}

export default Pagination;