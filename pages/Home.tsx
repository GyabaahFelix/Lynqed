
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
  const { products, vendors, favorites, toggleFavorite, currentUser } = useApp();
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
        className={`px-5 py-2.5 rounded-full text-xs font-bold shadow-sm whitespace-nowrap transition-all duration-300 active:scale-95 ${sortType === type ? 'bg-gray-900 text-white shadow-gray-500/30' : 'bg-white text-gray-500 border border-gray-100 hover:bg-gray-50'}`}
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
    <div className="flex flex-col space-y-6 animate-fade-in pb-4">
      
      {/* Header Section with Search */}
      <div className="bg-white/80 backdrop-blur-xl pt-2 pb-4 px-4 sticky top-0 z-30 border-b border-gray-100 shadow-sm">
        <div className="relative shadow-sm group transform transition-transform active:scale-[0.99]" onClick={() => navigate('/buyer/search')}>
            <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                <i className="fa-solid fa-magnifying-glass text-gray-400 group-hover:text-primary transition-colors"></i>
            </div>
            <input 
                readOnly
                placeholder="Search products, hostels, services..." 
                className="block w-full rounded-2xl border-none bg-gray-100/70 py-3.5 pl-11 pr-4 text-gray-900 placeholder-gray-500 focus:outline-none cursor-pointer hover:bg-gray-100 transition-colors"
            />
        </div>
      </div>

      {/* Filter Pills */}
      <div className="px-4 -mt-2">
         <div className="flex gap-3 overflow-x-auto hide-scrollbar py-2 pl-1">
            <FilterButton type="nearby" label="Nearby" />
            <FilterButton type="price" label="Price: Low to High" />
            <FilterButton type="rating" label="Top Rated" />
        </div>
      </div>

      {/* Hero Banner */}
      <div className="px-4">
        <div className="relative bg-gradient-to-br from-violet-600 via-primary to-secondary rounded-[2rem] p-7 text-white overflow-hidden shadow-xl shadow-primary/25">
            {/* Decorative elements */}
            <div className="absolute top-0 right-0 w-40 h-40 bg-white/10 rounded-full -mr-16 -mt-10 blur-2xl"></div>
            <div className="absolute bottom-0 left-0 w-32 h-32 bg-white/10 rounded-full -ml-10 -mb-10 blur-2xl"></div>
            
            <div className="relative z-10 flex justify-between items-center">
                <div className="max-w-[60%]">
                    <Badge className="mb-3 bg-white/20 text-white border-white/10 backdrop-blur-md">Earn Cash</Badge>
                    <h2 className="text-xl font-display font-bold mb-2 leading-tight">Student Entrepreneur?</h2>
                    <p className="text-indigo-100 text-xs mb-5 font-medium leading-relaxed opacity-90">Start your business on campus today. Reach thousands of students.</p>
                    <button 
                        onClick={handleStartSelling}
                        className="bg-white text-primary px-6 py-2.5 rounded-xl text-xs font-bold shadow-lg active:scale-95 transition-all hover:bg-gray-50"
                    >
                        Start Selling
                    </button>
                </div>
                <div className="w-28 h-28 flex items-center justify-center relative">
                     <div className="absolute inset-0 bg-white/20 rounded-full blur-xl animate-pulse"></div>
                     <i className="fa-solid fa-rocket text-7xl text-white drop-shadow-2xl relative z-10 animate-bounce-slight"></i>
                </div>
            </div>
        </div>
      </div>

      {/* Categories Scroller */}
      <div className="pl-4">
        <div className="flex justify-between items-center mb-4 pr-4">
            <h3 className="font-display font-bold text-gray-900 text-lg">Categories</h3>
        </div>
        <div className="flex gap-4 overflow-x-auto hide-scrollbar pb-4 pr-4">
            {categoryList.map(cat => {
                const isSelected = selectedCat === cat.name;
                return (
                    <div 
                        key={cat.id} 
                        className="flex flex-col items-center gap-2 cursor-pointer min-w-[72px] group"
                        onClick={() => setSelectedCat(cat.name)}
                    >
                        <div className={`w-18 h-18 p-4 rounded-2xl flex items-center justify-center transition-all duration-300 border ${isSelected ? 'bg-primary border-primary text-white shadow-lg shadow-primary/30 scale-105' : 'bg-white border-gray-100 text-gray-400 shadow-sm hover:border-gray-200 hover:bg-gray-50'}`}>
                            <i className={`fa-solid fa-${cat.icon} text-2xl`}></i>
                        </div>
                        <span className={`text-[11px] font-medium whitespace-nowrap transition-colors ${isSelected ? 'text-primary font-bold' : 'text-gray-500 group-hover:text-gray-800'}`}>
                            {cat.name}
                        </span>
                    </div>
                );
            })}
        </div>
      </div>

      {/* Feed */}
      <div className="px-4">
         <div className="flex justify-between items-end mb-5">
            <h3 className="font-display font-bold text-gray-900 text-lg">
                {sortType === 'price' ? 'Best Prices' : sortType === 'rating' ? 'Top Rated' : 'Recommended'}
            </h3>
            {selectedCat !== 'All' && <span className="text-[10px] font-bold text-primary cursor-pointer bg-primary/10 px-3 py-1 rounded-full hover:bg-primary/20 transition-colors" onClick={() => setSelectedCat('All')}>Clear Filter</span>}
         </div>
         
         {filteredProducts.length === 0 ? (
             <div className="flex flex-col items-center justify-center py-24 text-gray-400 bg-white rounded-[2rem] border-2 border-dashed border-gray-100">
                 <div className="w-16 h-16 bg-gray-50 rounded-full flex items-center justify-center mb-4">
                    <i className="fa-solid fa-box-open text-2xl text-gray-300"></i>
                 </div>
                 <p className="text-sm font-medium">No products found.</p>
             </div>
         ) : (
            <div className="grid grid-cols-2 gap-3">
                {filteredProducts.map(product => {
                    const vendor = vendors.find(v => v.vendorId === product.vendorId);
                    // Use first image from array, or fallback
                    const mainImage = product.images && product.images.length > 0 ? product.images[0] : 'https://via.placeholder.com/300';
                    const isFav = favorites.includes(product.id);
                    
                    return (
                        <Card key={product.id} className="flex flex-col h-full group border-0 shadow-card hover:shadow-float relative overflow-hidden" onClick={() => navigate(`/buyer/product/${product.id}`)}>
                            {/* Image Container - Edge to Edge */}
                            <div className="h-36 bg-gray-50 relative overflow-hidden">
                                <img src={mainImage} alt={product.title} className="w-full h-full object-cover object-center transition-transform duration-700 group-hover:scale-110" />
                                
                                {/* Favorite Button Overlay */}
                                <button 
                                    className={`absolute top-2 right-2 w-7 h-7 rounded-full flex items-center justify-center shadow-sm backdrop-blur-sm transition-all active:scale-90 ${isFav ? 'bg-white/90 text-red-500' : 'bg-white/60 text-gray-500 hover:bg-white hover:text-gray-700'}`}
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        toggleFavorite(product.id);
                                    }}
                                >
                                    <i className={`${isFav ? 'fa-solid' : 'fa-regular'} fa-heart text-xs`}></i>
                                </button>
                                
                                {product.stock < 5 && <span className="absolute bottom-2 left-2 bg-rose-500/90 backdrop-blur-sm text-white text-[9px] font-bold px-2 py-0.5 rounded shadow-sm">Low Stock</span>}
                            </div>
                            
                            {/* Content Body - Compact */}
                            <div className="p-3 flex flex-col flex-grow">
                                <div className="mb-1">
                                    <h4 className="text-xs font-bold text-gray-900 leading-tight line-clamp-2 font-display">{product.title}</h4>
                                </div>
                                <div className="flex items-center text-[10px] text-gray-500 mb-2 gap-1">
                                    <div className="flex items-center gap-1 max-w-[90px]">
                                        <span className="font-medium text-gray-400 truncate">{vendor?.storeName}</span>
                                        {vendor?.isApproved && <i className="fa-solid fa-circle-check text-blue-500 text-[8px] flex-shrink-0" title="Verified Vendor"></i>}
                                    </div>
                                    <span className="text-gray-300">•</span>
                                    <span className="text-primary font-semibold truncate">{product.location}</span>
                                </div>
                                <div className="mt-auto flex justify-between items-center pt-2 border-t border-gray-50">
                                    <span className="text-sm font-extrabold text-gray-900">{product.currency}{product.price}</span>
                                    <div className="w-7 h-7 rounded-full bg-gray-900 text-white flex items-center justify-center hover:bg-primary transition-all shadow-lg shadow-gray-900/20 active:scale-90">
                                        <i className="fa-solid fa-plus text-[10px]"></i>
                                    </div>
                                </div>
                            </div>
                        </Card>
                    )
                })}
            </div>
         )}
      </div>
    </div>
  );
};
