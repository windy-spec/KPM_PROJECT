import React, { useEffect, useState } from 'react';
import { favoriteService } from '../../services/favorite.service';
import { Heart, Trash2, ChevronRight, ArrowRight } from 'lucide-react';
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

  const handleRemove = async (id, e) => {
    e.stopPropagation(); // Ngăn trigger event click của card
    try {
      await favoriteService.removeFavorite(id);
      toast.success('Đã xóa khỏi danh sách yêu thích!');
      // Update state locally for instant UI feedback instead of re-fetching
      setFavorites(prev => prev.filter(f => f.id !== id));
    } catch (error) {
      toast.error('Lỗi khi xóa.');
    }
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(amount);
  };

  // Hàm loại bỏ thẻ HTML để hiển thị text thuần
  const stripHtml = (html) => {
    if (!html) return '';
    const doc = new DOMParser().parseFromString(html, 'text/html');
    return doc.body.textContent || "";
  };

  if (loading) {
    return (
      <div className="mt-6 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
        {[1, 2, 3, 4, 5, 6].map((n) => (
          <div key={n} className="bg-white rounded-[24px] overflow-hidden border border-outline-variant animate-pulse">
            <div className="aspect-[4/3] bg-surface-container"></div>
            <div className="p-5 flex flex-col gap-3">
              <div className="h-5 bg-surface-container rounded-md w-3/4"></div>
              <div className="h-3 bg-surface-container rounded-md w-full"></div>
              <div className="h-3 bg-surface-container rounded-md w-2/3"></div>
              <div className="mt-4 flex justify-between items-center pt-4 border-t border-outline-variant">
                <div className="h-4 bg-surface-container rounded-md w-1/3"></div>
                <div className="h-10 w-10 bg-surface-container rounded-full"></div>
              </div>
            </div>
          </div>
        ))}
      </div>
    );
  }

  return (
    <div className="mt-6">
      {favorites.length === 0 ? (
        <div className="bg-white rounded-[32px] p-16 flex flex-col items-center justify-center border border-outline-variant text-center min-h-[400px]">
          <div className="w-24 h-24 bg-red-50 rounded-full flex items-center justify-center mb-6">
            <Heart className="w-12 h-12 text-red-400" strokeWidth={1.5} />
          </div>
          <h3 className="text-2xl font-bold text-on-surface mb-3">Chưa có mục yêu thích nào</h3>
          <p className="text-on-surface-variant mb-8 max-w-md">
            Hãy khám phá thêm các sản phẩm tuyệt vời của chúng tôi và lưu lại những món đồ bạn yêu thích nhất nhé.
          </p>
          <button 
            onClick={() => navigate('/')}
            className="flex items-center gap-2 px-8 py-3.5 bg-primary text-white rounded-full font-medium hover:brightness-110 hover:shadow-lg hover:-translate-y-0.5 transition-all duration-300"
          >
            Khám phá sản phẩm
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {favorites.map(fav => {
            const product = fav.products;
            if (!product) return null;
            const imageUrl = product.product_images?.[0]?.image_url || 'https://images.unsplash.com/photo-1558611848-73f7eb4001a1?q=80&w=600';
            const cleanDescription = stripHtml(product.description);

            return (
              <div 
                key={fav.id} 
                onClick={() => navigate(`/product/${product.id}`)}
                className="bg-white rounded-[24px] overflow-hidden border border-outline-variant hover:border-primary/30 hover:shadow-[0_8px_30px_rgb(0,0,0,0.08)] transition-all duration-300 hover:-translate-y-1 group relative flex flex-col cursor-pointer"
              >
                {/* Remove button */}
                <button 
                  onClick={(e) => handleRemove(fav.id, e)} 
                  className="absolute top-4 right-4 z-10 p-2.5 bg-white/90 backdrop-blur-md text-on-surface-variant hover:text-red-500 hover:bg-white rounded-full shadow-[0_4px_12px_rgb(0,0,0,0.1)] opacity-0 group-hover:opacity-100 transform translate-y-2 group-hover:translate-y-0 transition-all duration-300 ease-out"
                  title="Bỏ yêu thích"
                >
                  <Trash2 className="w-4 h-4" />
                </button>

                {/* Image container */}
                <div className="aspect-[4/3] bg-surface-container relative overflow-hidden">
                  <div className="absolute inset-0 bg-black/5 group-hover:bg-transparent transition-colors duration-300 z-10 pointer-events-none"></div>
                  <img 
                    src={imageUrl} 
                    alt={product.product_name} 
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700 ease-out" 
                  />
                </div>
                
                {/* Content */}
                <div className="p-5 flex flex-col flex-1 bg-white relative z-20">
                  <div className="flex-1">
                    <h3 className="font-bold text-on-surface text-lg line-clamp-1 mb-1.5 group-hover:text-primary transition-colors">
                      {product.product_name}
                    </h3>
                    <p className="text-sm text-on-surface-variant line-clamp-2 h-10 leading-relaxed">
                      {cleanDescription || 'Sản phẩm này chưa có mô tả chi tiết.'}
                    </p>
                  </div>
                  
                  <div className="mt-5 pt-4 border-t border-outline-variant flex items-center justify-between">
                    <div className="flex flex-col">
                      <span className="text-[11px] font-bold uppercase tracking-widest text-on-surface-variant opacity-70 mb-0.5">Giá sản phẩm</span>
                      <span className="text-base font-black text-primary">
                        {formatCurrency(parseFloat(product.base_price))}
                      </span>
                    </div>
                    <div className="w-10 h-10 rounded-full bg-primary/10 text-primary flex items-center justify-center group-hover:bg-primary group-hover:text-white transition-colors duration-300">
                      <ChevronRight className="w-5 h-5" />
                    </div>
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
