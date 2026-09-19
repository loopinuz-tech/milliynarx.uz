import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { favoriteService } from '../../api/services';
import { useAuth } from '../../contexts/AuthContext';
import { formatPrice } from '../../utils/formatters';
import SolarIcon from '../../components/common/SolarIcon';
import EmptyState from '../../components/common/EmptyState';
import Badge from '../../components/common/Badge';
import ProductImg from '../../components/common/ProductImg';

export const FavoritesPage = () => {
  const [favorites, setFavorites] = useState([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();
  const { isAuthenticated } = useAuth();

  useEffect(() => {
    if (!isAuthenticated) {
      navigate('/login');
      return;
    }
    loadFavorites();
  }, [isAuthenticated]);

  async function loadFavorites() {
    try {
      setLoading(true);
      const data = await favoriteService.getFavorites();
      setFavorites(data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }

  const handleRemove = async (productId) => {
    try {
      await favoriteService.toggle(productId);
      setFavorites(prev => prev.filter(f => f.product_id !== productId));
    } catch (err) {
      console.error(err);
    }
  };

  if (loading) {
    return (
      <div className="w-full p-8 text-center text-xs text-slate-400">
        Sevimlilar ro'yxati yuklanmoqda...
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-slate-900 tracking-tight">
            Saqlangan mahsulotlar ({favorites.length} ta)
          </h1>
          <p className="text-xs text-slate-500">
            Siz kuzatib borayotgan barcha mahsulotlar ro'yxati
          </p>
        </div>
      </div>

      {favorites.length === 0 ? (
        <EmptyState
          icon="Heart"
          title="Sevimli mahsulotlar hali yo'q"
          description="Bozor katalogini ko'zdan kechirib, sizga yoqqan mahsulotlarni yurakcha tugmasi orqali saqlab qo'yishingiz mumkin."
          actionLabel="Katalogga o'tish"
          onAction={() => navigate('/search')}
        />
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-2.5 sm:gap-4">
          {favorites.map(f => (
            <div
              key={f.product_id}
              onClick={() => navigate(`/product/${f.slug || f.product_id}`)}
              className="bg-white dark:bg-[#111827] border border-slate-200 dark:border-slate-800 rounded-2xl p-2.5 sm:p-4 hover:shadow-md transition-all cursor-pointer flex flex-col justify-between group"
            >
              <div>
                <div className="h-32 sm:h-40 w-full bg-slate-50 dark:bg-[#151D2C] rounded-xl mb-2 sm:mb-3 flex items-center justify-center overflow-hidden relative">
                  <ProductImg
                    src={f.image}
                    alt={f.name}
                    categoryName={f.category_name}
                    className="h-full w-full object-contain p-2"
                    iconSize={32}
                    iconContainerClass="w-16 h-16"
                  />
                  <button
                    onClick={(e) => { e.stopPropagation(); handleRemove(f.product_id); }}
                    className="absolute top-2 right-2 p-1.5 rounded-full bg-white/90 dark:bg-slate-800 text-rose-600 hover:bg-rose-50 shadow-xs cursor-pointer"
                    title="Olib tashlash"
                  >
                    <SolarIcon name="CloseCircle" size={16} />
                  </button>
                </div>

                <div className="text-[10px] sm:text-xs text-slate-400 font-medium mb-1 truncate">
                  {f.seller_name || "Sotuvchi"}
                </div>
                <h3 className="text-xs sm:text-sm font-semibold text-slate-800 dark:text-slate-200 line-clamp-2 group-hover:text-orange-600 mb-2 leading-snug">
                  {f.name}
                </h3>
              </div>

              <div className="pt-2 border-t border-slate-100 dark:border-slate-800 mt-2 flex items-baseline justify-between gap-1">
                <div className="font-bold text-xs sm:text-base text-slate-900 dark:text-white font-numeric truncate">
                  {formatPrice(f.price)}
                </div>
                <Badge status={f.availability} size="xs" />
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default FavoritesPage;
