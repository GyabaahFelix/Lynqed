
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useApp } from '../context';
import { CATEGORIES } from '../constants';
import { Button, Input, Card, Badge } from '../components/UI';

export const Welcome: React.FC = () => {
  const navigate = useNavigate();
  const { currentUser } = useApp();

  const handleStartSelling = () => {
      if (!currentUser) {
          navigate('/register');
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
  const { products, vendors, favorites, toggleFavorite, currentUser, addToCart } = useApp();
  const navigate = useNavigate();
  const [selectedCat, setSelectedCat] = useState('All');
  const [sortType, setSortType] = useState<'nearby' | 'price' | 'rating'>('nearby');

  // 1. Categories
  const categoryList = [
      { id: 'cat-all', name: 'All', icon: 'layer-group' },
      ...CATEGORIES
  ];

  // 2. Filtering
  const approvedProducts = products.filter(p => p.status === 'approved');
  let filteredProducts = selectedCat === 'All' 
     ? approvedProducts 
     : approvedProducts.filter(p => p.category === selectedCat);

  // 3. Sorting Logic
  if (sortType === 'price') {
      filteredProducts = [...filteredProducts].sort((a, b) => a.price - b.price);
  } else if (sortType === 'rating') {
      filteredProducts = [...filteredProducts].sort((a, b) => (b.rating || 0) - (a.rating || 0));
  } else {
      // Mock Nearby: Random shuffle but deterministic-ish
      filteredProducts = [...filteredProducts].sort((a, b) => a.id.localeCompare(b.id)); 
  }

  const FilterButton = ({ type, label }: { type: 'nearby'|'price'|'rating', label: string }) => (
      <button 
        onClick={() => setSortType(type)}
        className={`px-4 py-1.5 rounded-full text-[11px] font-bold shadow-sm whitespace-nowrap transition-all duration-300 active:scale-95 ${sortType === type ? 'bg-gray-900 text-white shadow-gray-500/30' : 'bg-white text-gray-500 border border-gray-200 hover:bg-gray-50'}`}
      >
        {label}
      </button>
  );

  const handleStartSelling = () => {
      if (!currentUser) {
          navigate('/register');
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
                placeholder="Search products, brands, categories..." 
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
            {/* Decorative elements */}
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
                        className={`flex flex-col items-center justify-center gap-1 cursor-pointer min-w-[64px] p-2 rounded-xl transition-all duration-300 border ${isSelected ? 'bg-white border-primary shadow-sm' : 'bg-transparent border-transparent hover:bg-white hover:border-gray-100'}`}
                        onClick={() => setSelectedCat(cat.name)}
                    >
                        <div className={`w-10 h-10 rounded-full flex items-center justify-center transition-colors ${isSelected ? 'bg-primary text-white' : 'bg-gray-200 text-gray-500'}`}>
                            <i className={`fa-solid fa-${cat.icon} text-sm`}></i>
                        </div>
                        <span className={`text-[10px] font-medium whitespace-nowrap ${isSelected ? 'text-primary font-bold' : 'text-gray-500'}`}>
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
                {sortType === 'price' ? 'Best Deals' : sortType === 'rating' ? 'Top Rated Items' : 'Recommended For You'}
            </h3>
            {selectedCat !== 'All' && <span className="text-[10px] font-bold text-red-500 cursor-pointer bg-red-50 px-2 py-1 rounded hover:bg-red-100 transition-colors" onClick={() => setSelectedCat('All')}>Clear</span>}
         </div>
         
         {filteredProducts.length === 0 ? (
             <div className="flex flex-col items-center justify-center py-20 text-gray-400 bg-white rounded-2xl border border-dashed border-gray-200 mx-1">
                 <div className="w-14 h-14 bg-gray-50 rounded-full flex items-center justify-center mb-3">
                    <i className="fa-solid fa-box-open text-xl text-gray-300"></i>
                 </div>
                 <p className="text-xs font-medium">No products found.</p>
             </div>
         ) : (
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
                {filteredProducts.map(product => {
                    const vendor = vendors.find(v => v.vendorId === product.vendorId);
                    // Use first image from array, or fallback
                    const mainImage = product.images && product.images.length > 0 ? product.images[0] : 'https://via.placeholder.com/300';
                    const isFav = favorites.includes(product.id);
                    
                    return (
                        <div 
                            key={product.id} 
                            className="bg-white rounded-lg overflow-hidden border border-gray-100 shadow-[0_2px_8px_rgba(0,0,0,0.04)] hover:shadow-lg transition-all duration-300 flex flex-col relative group cursor-pointer" 
                            onClick={() => navigate(`/buyer/product/${product.id}`)}
                        >
                             {/* Fav Button Top Right */}
                            <button 
                                className="absolute top-2 right-2 z-10 w-7 h-7 rounded-full bg-white/80 backdrop-blur-sm border border-gray-100 hover:border-red-100 text-gray-400 hover:text-red-500 flex items-center justify-center transition-colors shadow-sm active:scale-90"
                                onClick={(e) => {
                                    e.stopPropagation();
                                    toggleFavorite(product.id);
                                }}
                            >
                                <i className={`${isFav ? 'fa-solid text-red-500' : 'fa-regular'} fa-heart text-xs`}></i>
                            </button>

                            {/* Image Container - Contained & Centered */}
                            <div className="aspect-square w-full p-4 bg-white flex items-center justify-center relative border-b border-gray-50">
                                <img 
                                    src={mainImage} 
                                    alt={product.title} 
                                    className="max-w-full max-h-full object-contain transition-transform duration-500 group-hover:scale-105" 
                                />
                                {product.stock === 0 && <div className="absolute inset-0 bg-white/60 flex items-center justify-center z-10"><span className="bg-gray-800 text-white text-[9px] px-2 py-1 font-bold uppercase tracking-wide">Out of Stock</span></div>}
                            </div>

                            {/* Content Body */}
                            <div className="p-3 flex flex-col flex-grow">
                                <h3 className="text-xs text-gray-700 font-medium leading-snug line-clamp-2 mb-1 h-[2.4em] group-hover:text-primary transition-colors">{product.title}</h3>
                                
                                <div className="mt-auto">
                                    <div className="flex items-baseline gap-1 mb-3">
                                        <span className="text-[10px] text-gray-500 font-bold">{product.currency}</span>
                                        <span className="text-base font-extrabold text-gray-900">{product.price.toFixed(2)}</span>
                                    </div>

                                    <button 
                                        className={`w-full py-2 rounded-md flex items-center justify-center gap-2 text-[11px] font-bold uppercase tracking-wide transition-all active:scale-95 ${product.stock === 0 ? 'bg-gray-100 text-gray-400 cursor-not-allowed' : 'bg-primary text-white hover:bg-primaryDark shadow-sm hover:shadow-md'}`}
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            if(product.stock > 0) {
                                                addToCart(product);
                                                // Could add a toast here
                                            }
                                        }}
                                        disabled={product.stock === 0}
                                    >
                                        <i className="fa-solid fa-cart-plus"></i> Add To Cart
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
