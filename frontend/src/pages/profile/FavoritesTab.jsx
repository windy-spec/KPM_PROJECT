import React, { useEffect, useState } from 'react';
import { favoriteService } from '../../services/favorite.service';
import { Heart, Trash2, ChevronRight, PackageSearch } from 'lucide-react';
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
      const res = await favoriteService.getUserFavorites();
      setFavorites(res.data?.data || []);
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const handleRemove = async (id) => {
    try {
      await favoriteService.removeFavorite(id);
      toast.success('Đã xóa khỏi danh sách yêu thích!');
      fetchFavorites();
    } catch (error) {
      toast.error('Lỗi khi xóa.');
    }
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(amount);
  };

  if (loading) return <div className="p-8 text-center animate-pulse text-primary font-bold">Đang tải danh sách yêu thích...</div>;

  return (
    <div className="mt-6 space-y-4">
      {favorites.length === 0 ? (
        <div className="bg-white rounded-3xl p-12 text-center border border-outline-variant flex flex-col items-center">
          <Heart className="w-16 h-16 text-outline-variant mb-4" />
          <h3 className="text-lg font-bold text-on-surface">Bạn chưa có sản phẩm yêu thích nào</h3>
          <p className="text-sm text-on-surface-variant">Thêm các sản phẩm bạn quan tâm để xem lại sau nhé.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {favorites.map(fav => {
            const product = fav.products;
            if (!product) return null;
            const imageUrl = product.product_images?.[0]?.image_url || 'https://images.unsplash.com/photo-1558611848-73f7eb4001a1?q=80&w=600';
            
            return (
              <div key={fav.id} className="bg-white rounded-3xl overflow-hidden border border-outline-variant hover:border-primary/50 transition-all hover:shadow-xl group relative flex flex-col">
                <div className="absolute top-4 right-4 z-10 opacity-0 group-hover:opacity-100 transition-opacity">
                  <button 
                    onClick={() => handleRemove(fav.id)} 
                    className="p-2.5 bg-white text-red-500 hover:bg-red-500 hover:text-white rounded-full shadow-lg transition-colors border border-outline-variant"
                    title="Bỏ yêu thích"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>

                <div className="aspect-[4/3] bg-surface-container relative overflow-hidden">
                  <img src={imageUrl} alt={product.product_name} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                </div>
                
                <div className="p-5 flex flex-col flex-1">
                  <h3 className="font-bold text-on-surface text-base line-clamp-1 mb-1 group-hover:text-primary transition-colors">{product.product_name}</h3>
                  <p className="text-xs text-on-surface-variant line-clamp-2 mb-4 h-8">{product.description || 'Không có mô tả'}</p>
                  
                  <div className="mt-auto pt-4 border-t border-outline-variant flex items-center justify-between">
                    <div>
                      <p className="text-[10px] font-black uppercase tracking-widest text-on-surface-variant opacity-70">Giá từ</p>
                      <p className="text-sm font-black text-primary">{formatCurrency(parseFloat(product.base_price))}</p>
                    </div>
                    <button 
                      onClick={() => navigate(`/product/${product.id}`)}
                      className="w-10 h-10 rounded-full bg-primary/10 text-primary flex items-center justify-center hover:bg-primary hover:text-white transition-colors"
                      title="Xem chi tiết"
                    >
                      <ChevronRight className="w-5 h-5" />
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default FavoritesTab;
