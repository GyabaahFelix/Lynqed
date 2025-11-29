import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useApp } from '../context';
import { CATEGORIES, INITIAL_LOCATION_CACHE } from '../constants';
import { Button, Input, Card, Badge, ProductCardSkeleton } from '../components/UI';

export const Welcome: React.FC = () => {
  const navigate = useNavigate();
  const { currentUser } = useApp();

  const handleStartSelling = () => {
      if (!currentUser) {
          navigate('/register', { state: { role: 'vendor' } });
      } else if (currentUser.roles.includes('vendor')) {
          navigate('/vendor/dashboard');
      } else {
          navigate('/vendor/onboarding');
      }
  };

  return (
    <div className="min-h-screen bg-white relative overflow-hidden flex flex-col items-center justify-center p-6 text-center">
      {/* Background Blobs */}
      <div className="absolute top-[-10%] left-[-20%] w-[500px] h-[500px] bg-primary/20 rounded-full mix-blend-multiply filter blur-3xl opacity-50 animate-blob"></div>
      <div className="absolute top-[-10%] right-[-20%] w-[500px] h-[500px] bg-secondary/20 rounded-full mix-blend-multiply filter blur-3xl opacity-50 animate-blob animation-delay-2000"></div>
      <div className="absolute bottom-[-20%] left-[20%] w-[500px] h-[500px] bg-accent/20 rounded-full mix-blend-multiply filter blur-3xl opacity-50 animate-blob animation-delay-4000"></div>

      <div className="relative z-10 mb-12 animate-fade-in">
         <div className="w-28 h-28 bg-gradient-to-tr from-primary via-primaryDark to-secondary rounded-[2rem] flex items-center justify-center mx-auto mb-8 shadow-glow transform rotate-6 hover:rotate-12 transition-transform duration-700">
            <i className="fa-solid fa-bolt text-5xl text-white drop-shadow-md"></i>
         </div>
         <h1 className="text-5xl font-display font-black text-gray-900 tracking-tight mb-3 bg-clip-text text-transparent bg-gradient-to-r from-gray-900 to-gray-600">LYNQED</h1>
         <p className="text-lg text-gray-500 font-medium max-w-xs mx-auto leading-relaxed">Where Buyers and Sellers Get <span className="text-primary font-bold">LYNQED</span>.</p>
      </div>

      <div className="w-full max-w-sm space-y-5 relative z-10 animate-slide-up">
        <div 
            onClick={() => navigate('/buyer/dashboard')}
            className="p-1 rounded-3xl bg-gradient-to-r from-gray-100 to-gray-50 hover:from-primary hover:to-secondary transition-all duration-500 group cursor-pointer shadow-lg hover:shadow-glow"
        >
            <div className="bg-white rounded-[1.3rem] p-5 flex items-center gap-5 h-full">
                <div className="w-14 h-14 bg-indigo-50 rounded-2xl flex items-center justify-center text-primary group-hover:scale-110 transition-transform duration-300">
                    <i className="fa-solid fa-bag-shopping text-2xl"></i>
                </div>
                <div className="text-left">
                    <h3 className="font-bold text-gray-900 text-xl font-display">Buyer</h3>
                    <p className="text-xs text-gray-400 font-medium mt-0.5 group-hover:text-primary transition-colors">Explore campus products</p>
                </div>
                <div className="ml-auto w-10 h-10 rounded-full border border-gray-100 flex items-center justify-center text-gray-300 group-hover:border-primary group-hover:text-primary transition-all">
                    <i className="fa-solid fa-arrow-right"></i>
                </div>
            </div>
        </div>

        <div 
            onClick={handleStartSelling}
            className="p-1 rounded-3xl bg-gradient-to-r from-gray-100 to-gray-50 hover:from-secondary hover:to-accent transition-all duration-500 group cursor-pointer shadow-lg hover:shadow-glow"
        >
             <div className="bg-white rounded-[1.3rem] p-5 flex items-center gap-5 h-full">
                <div className="w-14 h-14 bg-pink-50 rounded-2xl flex items-center justify-center text-secondary group-hover:scale-110 transition-transform duration-300">
                    <i className="fa-solid fa-store text-2xl"></i>
                </div>
                <div className="text-left">
                    <h3 className="font-bold text-gray-900 text-xl font-display">Vendor</h3>
                    <p className="text-xs text-gray-400 font-medium mt-0.5 group-hover:text-secondary transition-colors">Start your business</p>
                </div>
                <div className="ml-auto w-10 h-10 rounded-full border border-gray-100 flex items-center justify-center text-gray-300 group-hover:border-secondary group-hover:text-secondary transition-all">
                    <i className="fa-solid fa-arrow-right"></i>
                </div>
            </div>
        </div>
      </div>
      
      <div className="mt-auto pt-12 pb-6 text-[10px] font-bold text-gray-300 uppercase tracking-[0.2em]">
        Version 1.0.2 Beta
      </div>
    </div>
  );
};

export const BuyerDashboard: React.FC = () => {
  const { products, vendors, favorites, toggleFavorite, currentUser, addToCart, removeFromCart, cart, showToast, isDataLoading } = useApp();
  const navigate = useNavigate();
  const [selectedCat, setSelectedCat] = useState('All');
  const [sortType, setSortType] = useState<'nearby' | 'price' | 'rating'>('nearby');
  const [userLocation, setUserLocation] = useState<{lat: number, lng: number} | null>(null);

  // --- Geolocation Logic ---
  useEffect(() => {
      if (navigator.geolocation) {
          navigator.geolocation.getCurrentPosition(
              (position) => {
                  setUserLocation({
                      lat: position.coords.latitude,
                      lng: position.coords.longitude
                  });
              },
              (error) => {
                  console.log("GPS Denied or Error", error);
                  // Default to Legon if denied, so 'nearby' still calculates relative to campus
                  setUserLocation({ lat: 5.6506, lng: -0.1962 });
              }
          );
      }
  }, []);

  // Haversine Formula for Distance (km)
  const getDistanceFromLatLonInKm = (lat1: number, lon1: number, lat2: number, lon2: number) => {
      const R = 6371; // Radius of earth
      const dLat = deg2rad(lat2 - lat1);
      const dLon = deg2rad(lon2 - lon1);
      const a = 
        Math.sin(dLat/2) * Math.sin(dLat/2) +
        Math.cos(deg2rad(lat1)) * Math.cos(deg2rad(lat2)) * 
        Math.sin(dLon/2) * Math.sin(dLon/2); 
      const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a)); 
      return R * c;
  };

  const deg2rad = (deg: number) => deg * (Math.PI/180);

  // Helper to get coords from location string
  const getCoordsForLocation = (locStr: string): {lat: number, lng: number} | null => {
      const clean = locStr.toLowerCase();
      // Exact match in cache
      if (INITIAL_LOCATION_CACHE[clean]) {
          return { lat: INITIAL_LOCATION_CACHE[clean][0], lng: INITIAL_LOCATION_CACHE[clean][1] };
      }
      // Partial match
      const key = Object.keys(INITIAL_LOCATION_CACHE).find(k => clean.includes(k));
      if (key) {
          return { lat: INITIAL_LOCATION_CACHE[key][0], lng: INITIAL_LOCATION_CACHE[key][1] };
      }
      return null;
  };

  // 1. Compute Dynamic Categories
  const categoryList = useMemo(() => {
      const standardNames = new Set(CATEGORIES.map(c => c.name));
      const customCategories = Array.from(new Set(products.map(p => p.category)))
        .filter(cat => cat && !standardNames.has(cat) && cat !== 'OTHER')
        .map(cat => {
            const sampleProduct = products.find(p => p.category === cat);
            return {
                id: `cat-custom-${cat.replace(/\s+/g, '-').toLowerCase()}`,
                name: cat,
                icon: 'tag',
                image: sampleProduct?.images[0] || 'https://via.placeholder.com/150?text=' + cat
            };
        });

      return [
          { id: 'cat-all', name: 'All', icon: 'layer-group', image: '' },
          ...CATEGORIES,
          ...customCategories
      ];
  }, [products]);

  // 2. Filtering & Sorting with useMemo for Performance
  const sortedProducts = useMemo(() => {
      const approvedProducts = products.filter(p => p.status === 'approved');
      let filtered = selectedCat === 'All' 
         ? approvedProducts 
         : approvedProducts.filter(p => p.category === selectedCat);

      if (sortType === 'price') {
          return [...filtered].sort((a, b) => a.price - b.price);
      } else if (sortType === 'rating') {
          return [...filtered].sort((a, b) => (b.rating || 0) - (a.rating || 0));
      } else if (sortType === 'nearby' && userLocation) {
          // Pre-calculate distances to avoid expensive re-calc in sort loop
          const distMap = new Map<string, number>();
          filtered.forEach(p => {
              const coords = getCoordsForLocation(p.location);
              const dist = coords ? getDistanceFromLatLonInKm(userLocation.lat, userLocation.lng, coords.lat, coords.lng) : 9999;
              distMap.set(p.id, dist);
          });
          
          return [...filtered].sort((a, b) => (distMap.get(a.id) || 9999) - (distMap.get(b.id) || 9999));
      }
      return filtered;
  }, [products, selectedCat, sortType, userLocation]);

  const FilterButton = ({ type, label }: { type: 'nearby'|'price'|'rating', label: string }) => (
      <button 
        onClick={() => {
            if (type === 'nearby' && !userLocation) {
                showToast("Acquiring location...", "info");
            }
            setSortType(type);
        }}
        className={`px-4 py-1.5 rounded-full text-[11px] font-bold shadow-sm whitespace-nowrap transition-all duration-300 active:scale-95 ${sortType === type ? 'bg-gray-900 text-white shadow-gray-500/30' : 'bg-white text-gray-500 border border-gray-200 hover:bg-gray-50'}`}
      >
        {label}
      </button>
  );

  const handleStartSelling = () => {
      if (!currentUser) {
          navigate('/register', { state: { role: 'vendor' } });
      } else if (currentUser.roles.includes('vendor')) {
          navigate('/vendor/dashboard');
      } else {
          navigate('/vendor/onboarding');
      }
  };

  return (
    <div className="flex flex-col space-y-5 animate-fade-in pb-4 bg-gray-50 min-h-screen">
      
      {/* Header Section with Search */}
      <div className="bg-white/90 backdrop-blur-xl pt-2 pb-3 px-4 sticky top-0 z-30 border-b border-gray-100 shadow-sm">
        <div className="relative group" onClick={() => navigate('/buyer/search')}>
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <i className="fa-solid fa-magnifying-glass text-gray-400 group-hover:text-primary transition-colors"></i>
            </div>
            <input 
                readOnly
                placeholder="Search Products..." 
                className="block w-full rounded-xl border border-gray-200 bg-gray-50 py-2.5 pl-10 pr-4 text-sm text-gray-900 placeholder-gray-400 focus:outline-none cursor-pointer hover:bg-white hover:border-primary/30 transition-all"
            />
        </div>
      </div>

      {/* Filter Pills */}
      <div className="px-4 -mt-2">
         <div className="flex gap-2 overflow-x-auto hide-scrollbar py-2">
            <FilterButton type="nearby" label="Nearby" />
            <FilterButton type="price" label="Low Price" />
            <FilterButton type="rating" label="Top Rated" />
        </div>
      </div>

      {/* Hero Banner */}
      <div className="px-4">
        <div className="relative bg-gradient-to-br from-gray-900 via-indigo-900 to-gray-900 rounded-2xl p-6 text-white overflow-hidden shadow-lg">
            <div className="absolute top-0 right-0 w-40 h-40 bg-primary/30 rounded-full -mr-16 -mt-10 blur-3xl"></div>
            <div className="relative z-10 flex justify-between items-center">
                <div className="max-w-[65%]">
                    <h2 className="text-lg font-display font-bold mb-1 leading-tight">Student Entrepreneur?</h2>
                    <p className="text-gray-300 text-xs mb-4 font-medium leading-relaxed">Reach thousands of students on campus today.</p>
                    <button 
                        onClick={handleStartSelling}
                        className="bg-primary text-white px-5 py-2 rounded-lg text-xs font-bold shadow-md active:scale-95 transition-all hover:bg-primaryDark"
                    >
                        Start Selling
                    </button>
                </div>
                <div className="w-24 h-24 flex items-center justify-center relative">
                     <i className="fa-solid fa-shop text-6xl text-gray-700/50 absolute transform scale-110"></i>
                     <i className="fa-solid fa-store text-5xl text-white drop-shadow-2xl relative z-10"></i>
                </div>
            </div>
        </div>
      </div>

      {/* Categories Scroller */}
      <div className="pl-4">
        <div className="flex justify-between items-center mb-3 pr-4">
            <h3 className="font-display font-bold text-gray-900 text-base">Categories</h3>
        </div>
        <div className="flex gap-3 overflow-x-auto hide-scrollbar pb-2 pr-4">
            {categoryList.map(cat => {
                const isSelected = selectedCat === cat.name;
                return (
                    <div 
                        key={cat.id} 
                        className={`flex flex-col items-center justify-center gap-1 cursor-pointer min-w-[72px] rounded-xl transition-all duration-300 active:scale-95`}
                        onClick={() => setSelectedCat(cat.name)}
                    >
                        <div className={`w-14 h-14 rounded-full flex items-center justify-center transition-all overflow-hidden shadow-sm border-2 ${isSelected ? 'border-primary ring-2 ring-primary/20' : 'border-transparent'}`}>
                            {cat.image ? (
                                <img src={cat.image} alt={cat.name} className="w-full h-full object-cover hover:scale-110 transition-transform duration-500" />
                            ) : (
                                <div className={`w-full h-full flex items-center justify-center bg-gray-200 text-gray-500`}>
                                    <i className={`fa-solid fa-${cat.icon} text-lg`}></i>
                                </div>
                            )}
                        </div>
                        <span className={`text-[10px] font-medium whitespace-nowrap text-center w-full overflow-hidden text-ellipsis ${isSelected ? 'text-primary font-bold' : 'text-gray-600'}`}>
                            {cat.name}
                        </span>
                    </div>
                );
            })}
        </div>
      </div>

      {/* Feed */}
      <div className="px-3 pb-24">
         <div className="flex justify-between items-end mb-4 px-1">
            <h3 className="font-display font-bold text-gray-900 text-base">
                {sortType === 'price' ? 'Best Deals' : sortType === 'rating' ? 'Top Rated Items' : sortType === 'nearby' ? 'Nearest to You' : 'Recommended'}
            </h3>
            {selectedCat !== 'All' && <span className="text-[10px] font-bold text-red-500 cursor-pointer bg-red-50 px-2 py-1 rounded hover:bg-red-100 transition-colors" onClick={() => setSelectedCat('All')}>Clear</span>}
         </div>
         
         {isDataLoading ? (
             <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-3">
                 {[...Array(10)].map((_, i) => <ProductCardSkeleton key={i} />)}
             </div>
         ) : sortedProducts.length === 0 ? (
             <div className="flex flex-col items-center justify-center py-20 text-gray-400 bg-white rounded-2xl border border-dashed border-gray-200 mx-1">
                 <div className="w-14 h-14 bg-gray-50 rounded-full flex items-center justify-center mb-3">
                    <i className="fa-solid fa-box-open text-xl text-gray-300"></i>
                 </div>
                 <p className="text-xs font-medium">No products found in {selectedCat}.</p>
             </div>
         ) : (
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-3">
                {sortedProducts.map(product => {
                    const vendor = vendors.find(v => v.vendorId === product.vendorId);
                    const mainImage = product.images && product.images.length > 0 ? product.images[0] : 'https://via.placeholder.com/300';
                    const isFav = favorites.includes(product.id);
                    const isInCart = cart.some(item => item.productId === product.id);
                    
                    return (
                        <div 
                            key={product.id} 
                            className="bg-white rounded-2xl overflow-hidden shadow-card border border-gray-100 hover:shadow-xl transition-all duration-300 group relative flex flex-col h-full cursor-pointer"
                            onClick={() => navigate(`/buyer/product/${product.id}`)}
                        >
                             {/* Image - Square Aspect Ratio for Compactness */}
                            <div className="aspect-square w-full relative overflow-hidden">
                                <img 
                                    src={mainImage} 
                                    alt={product.title} 
                                    className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110" 
                                />
                                
                                {/* Location Badge - Glass Effect on Top Left */}
                                <div className="absolute top-2 left-2 bg-white/80 backdrop-blur-md px-2 py-1 rounded-lg text-[10px] font-bold border border-white/50 shadow-sm flex items-center gap-1 z-20 text-gray-700">
                                     <i className="fa-solid fa-location-dot text-primary text-[9px]"></i> {product.location}
                                </div>

                                {/* Fav Button (Floating) */}
                                <button 
                                    className="absolute top-2 right-2 z-10 w-7 h-7 rounded-full bg-white/80 backdrop-blur-sm border border-gray-100 hover:border-red-100 text-gray-400 hover:text-red-500 flex items-center justify-center transition-colors shadow-sm active:scale-90"
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        toggleFavorite(product.id);
                                    }}
                                >
                                    <i className={`${isFav ? 'fa-solid text-red-500' : 'fa-regular'} fa-heart text-xs`}></i>
                                </button>

                                {product.stock === 0 && <div className="absolute inset-0 bg-black/40 flex items-center justify-center z-10"><span className="bg-black/80 text-white text-[10px] px-3 py-1 rounded font-bold uppercase tracking-wide">Out of Stock</span></div>}
                            </div>

                            {/* Bottom Details - Increased Font Sizes */}
                            <div className="p-3 bg-white flex flex-col justify-between flex-grow relative z-10">
                                <div>
                                    <h3 className="text-sm text-gray-800 font-bold leading-tight line-clamp-2 mb-1">{product.title}</h3>
                                    <p className="text-[11px] text-gray-400 line-clamp-1">{vendor?.storeName}</p>
                                </div>
                                
                                <div className="flex items-center justify-between mt-2">
                                    <span className="text-lg font-extrabold text-gray-900">{product.currency}{product.price.toFixed(2)}</span>
                                    <button 
                                        className={`w-8 h-8 rounded-full flex items-center justify-center text-white transition-all shadow-md active:scale-90 group-btn ${product.stock === 0 ? 'bg-gray-300 cursor-not-allowed' : isInCart ? 'bg-green-500 hover:bg-red-500' : 'bg-black hover:bg-primary'}`}
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            if (product.stock > 0) {
                                                if (isInCart) {
                                                    removeFromCart(product.id);
                                                    showToast('Removed from Cart', 'info');
                                                } else {
                                                    addToCart(product);
                                                }
                                            }
                                        }}
                                        disabled={product.stock === 0}
                                    >
                                        <i className={`fa-solid ${isInCart ? 'fa-check group-btn-hover:fa-trash' : 'fa-plus'} text-xs ${isInCart ? 'group-hover:hidden' : ''}`}></i>
                                        {isInCart && <i className="fa-solid fa-trash text-xs hidden group-hover:inline"></i>}
                                    </button>
                                </div>
                            </div>
                        </div>
                    )
                })}
            </div>
         )}
      </div>
    </div>
  );
};