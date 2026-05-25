import React from 'react';
import { Filter } from 'lucide-react';

const defaultCategories = {
  types: [
    { id: 'hinh', label: 'Thép hình (I, U, V, H)' },
    { id: 'tam', label: 'Thép tấm / Tôn' },
    { id: 'inox', label: 'Inox (Thép không gỉ)' },
    { id: 'sat-dac', label: 'Sắt đặc mỹ thuật' },
  ],
  standards: [
    { id: 'ss400', label: 'SS400 (JIS G3101)' },
    { id: 'ct3', label: 'CT3 (GOST 380-89)' },
    { id: 'q235', label: 'Q235 / Q345' },
  ],
  thickness: [
    { id: 'under2', label: 'Dưới 2mm (Tôn mỏng)' },
    { id: '2to5', label: '2mm - 5mm' },
  ],
};

const SidebarFilter = ({ categories }) => {
  const filterCategories = categories || defaultCategories;

  return (
    <aside className="bg-white border border-outline-variant rounded-2xl p-6 shadow-sm h-fit sticky top-24 w-full">
      {/* Header của Bộ lọc */}
      <div className="flex items-center justify-between pb-4 border-b border-outline-variant/60 mb-6">
        <div className="flex items-center gap-2 text-sm font-black uppercase tracking-wider">
          <Filter className="w-4 h-4 text-primary" />
          <span>Bộ lọc</span>
        </div>
        <button type="button" className="text-[10px] font-black uppercase text-on-surface-variant/60 hover:text-primary transition-colors">
          Xóa lọc
        </button>
      </div>

      {/* Nhóm lọc 1: Loại vật liệu */}
      <div className="mb-6">
        <h4 className="text-[10px] font-black uppercase text-on-surface-variant tracking-widest mb-3 opacity-80">
          Loại vật liệu
        </h4>
        <div className="space-y-2.5">
          {filterCategories.types?.map(type => (
            <label key={type.id} className="flex items-center gap-3 text-xs font-bold text-on-surface-variant cursor-pointer select-none">
              <input 
                type="checkbox" 
                defaultChecked={type.id === 'hinh' || type.id === 'tam'} 
                className="w-4 h-4 accent-primary rounded border-outline-variant focus:ring-0 cursor-pointer" 
              />
              <span>{type.label}</span>
            </label>
          ))}
        </div>
      </div>

      {/* Nhóm lọc 2: Mác thép */}
      <div className="mb-6">
        <h4 className="text-[10px] font-black uppercase text-on-surface-variant tracking-widest mb-3 opacity-80">
          Mác thép / Tiêu chuẩn
        </h4>
        <div className="space-y-2.5">
          {filterCategories.standards?.map(std => (
            <label key={std.id} className="flex items-center gap-3 text-xs font-bold text-on-surface-variant cursor-pointer select-none">
              <input 
                type="checkbox" 
                className="w-4 h-4 accent-primary rounded border-outline-variant focus:ring-0 cursor-pointer" 
              />
              <span>{std.label}</span>
            </label>
          ))}
        </div>
      </div>

      {/* Nhóm lọc 3: Độ dày */}
      <div className="mb-8">
        <h4 className="text-[10px] font-black uppercase text-on-surface-variant tracking-widest mb-3 opacity-80">
          Độ dày (Thickness)
        </h4>
        <div className="space-y-2.5">
          {filterCategories.thickness?.map(thick => (
            <label key={thick.id} className="flex items-center gap-3 text-xs font-bold text-on-surface-variant cursor-pointer select-none">
              <input 
                type="checkbox" 
                className="w-4 h-4 accent-primary rounded border-outline-variant focus:ring-0 cursor-pointer" 
              />
              <span>{thick.label}</span>
            </label>
          ))}
        </div>
      </div>

      {/* Nút hành động */}
      <button type="submit" className="w-full py-3.5 bg-primary text-white text-xs font-black uppercase tracking-widest rounded-xl hover:bg-primary-container transition-all shadow-md shadow-primary/10 active:scale-[0.98]">
        Áp dụng bộ lọc
      </button>
    </aside>
  );
};

export default SidebarFilter;