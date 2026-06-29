import React from 'react';
import { MessageSquare } from 'lucide-react';

const ProductHomeCard = ({ product }) => {
  return (
    <div className="bg-white border border-outline-variant rounded-xl flex flex-col overflow-hidden group hover:shadow-xl transition-all">
      {/* Image Area */}
      <div className="h-48 bg-surface-container-variant relative overflow-hidden">
        <img 
          src={product.image || "https://placehold.co/600x400/f8f9fa/a1a1aa?text=KPM+Chua+co+anh"} 
          alt={product.name} 
          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
        />
        {product.isNew && (
          <span className="absolute top-3 right-3 bg-white/90 backdrop-blur-md px-2 py-1 text-[10px] font-bold border border-outline-variant rounded shadow-sm">MỚI</span>
        )}
      </div>

      {/* Info Area */}
      <div className="p-4 flex flex-col gap-3 flex-1">
        <h3 className="font-bold text-on-surface line-clamp-2 min-h-[3rem]">{product.name}</h3>
        
        <div className="flex flex-wrap gap-2">
          {product.tags.map(tag => (
            <span key={tag} className="text-[11px] bg-surface-container text-on-surface-variant px-2 py-0.5 rounded border border-outline-variant/50">
              {tag}
            </span>
          ))}
        </div>

        <div className="mt-auto pt-3 border-t border-outline-variant/30 flex items-end justify-between">
          <div className="flex flex-col">
            <span className="text-[10px] font-bold text-on-surface-variant uppercase">Giá dự kiến</span>
            <span className="text-lg font-bold text-primary">
              {product.price > 0 ? `${product.price.toLocaleString()}đ` : "Liên hệ"}
              {product.unit && <span className="text-xs font-normal text-on-surface-variant">/{product.unit}</span>}
            </span>
          </div>
        </div>

        <button className="w-full py-2 mt-2 bg-primary/10 text-primary border border-primary/20 hover:bg-primary hover:text-white rounded-lg font-bold transition-all flex items-center justify-center gap-2">
          <MessageSquare className="w-4 h-4" />
          Nhận báo giá
        </button>
      </div>
    </div>
  );
};

export default ProductHomeCard;