import React, { useEffect, useState } from 'react';
import { quotationService } from '../../services/quotation.service';
import { Heart, Trash2, ChevronRight } from 'lucide-react';
import { toast } from 'react-toastify';
import { useNavigate } from 'react-router-dom';

const FavoritesTab = () => {
  const navigate = useNavigate();
  const [favorites, setFavorites] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchFavorites();
  }, []);

  const fetchFavorites = async () => {
    try {
      setLoading(true);
      const res = await quotationService.getUserQuotations(['favorite']);
      setFavorites(res.data?.data || []);
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const handleRemove = async (id) => {
    try {
      await quotationService.updateStatus(id, 'cancelled');
      toast.success('Đã xóa khỏi danh sách yêu thích!');
      fetchFavorites();
    } catch (error) {
      toast.error('Lỗi khi xóa.');
    }
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(amount);
  };

  if (loading) return <div className="p-8 text-center animate-pulse">Đang tải danh sách yêu thích...</div>;

  return (
    <div className="mt-6 space-y-4">
      {favorites.length === 0 ? (
        <div className="bg-white rounded-3xl p-12 text-center border border-outline-variant flex flex-col items-center">
          <Heart className="w-16 h-16 text-outline-variant mb-4" />
          <h3 className="text-lg font-bold text-on-surface">Bạn chưa có sản phẩm yêu thích nào</h3>
          <p className="text-sm text-on-surface-variant">Lưu các cấu hình sản phẩm bạn quan tâm để xem lại sau nhé.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {favorites.map(fav => (
            <div key={fav.id} className="bg-white rounded-2xl p-6 border border-outline-variant flex flex-col relative group">
              <div className="absolute top-4 right-4 opacity-0 group-hover:opacity-100 transition-opacity">
                <button onClick={() => handleRemove(fav.id)} className="p-2 bg-red-50 text-red-500 hover:bg-red-500 hover:text-white rounded-full transition-colors" title="Xóa">
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>

              <div className="mb-4">
                <div className="w-12 h-12 bg-pink-50 rounded-full flex items-center justify-center mb-3">
                  <Heart className="w-6 h-6 text-pink-500 fill-pink-500" />
                </div>
                <h3 className="text-base font-bold text-on-surface line-clamp-1">{fav.title || 'Cấu hình chưa đặt tên'}</h3>
                <p className="text-xs text-on-surface-variant mt-1">Lưu lúc: {new Date(fav.created_at).toLocaleDateString('vi-VN')}</p>
              </div>

              <div className="flex-1 bg-surface-container-lowest p-3 rounded-xl border border-outline-variant/50 text-xs mb-4">
                {fav.quotation_specs?.slice(0, 3).map((spec, idx) => (
                  <div key={idx} className="flex items-start gap-2 mb-2 last:mb-0">
                    <ChevronRight className="w-3 h-3 text-primary mt-0.5 shrink-0" />
                    <span className="text-on-surface font-medium line-clamp-1">{spec.component_name}</span>
                  </div>
                ))}
                {fav.quotation_specs?.length > 3 && (
                  <div className="text-xs font-bold text-primary italic ml-5">
                    + {fav.quotation_specs.length - 3} linh kiện khác...
                  </div>
                )}
              </div>

              <div className="flex items-end justify-between mt-auto pt-4 border-t border-outline-variant/30">
                <div>
                  <p className="text-[10px] font-black uppercase tracking-widest text-on-surface-variant opacity-60 mb-1">Giá tham khảo</p>
                  <p className="text-lg font-black text-primary">{formatCurrency(fav.total_quoted_price)}</p>
                </div>
                <button 
                  onClick={() => navigate(`/product/${fav.quotation_specs?.[0]?.dimensions?.product_id}`)} 
                  className="px-4 py-2 text-xs font-bold bg-primary/10 text-primary rounded-xl hover:bg-primary/20 transition-colors"
                >
                  Xem Sản Phẩm
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default FavoritesTab;
