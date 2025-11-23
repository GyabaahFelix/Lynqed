
import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useApp } from '../context';
import { Button, Badge, Card, Input } from '../components/UI';
import { Product } from '../types';

// --- Store Page (Public Vendor Profile) ---
export const StorePage: React.FC = () => {
  const { vendorId } = useParams<{ vendorId: string }>();
  const navigate = useNavigate();
  const { vendors, products, favorites, toggleFavorite, addToCart } = useApp();

  const vendor = vendors.find(v => v.vendorId === vendorId);
  const vendorProducts = products.filter(p => p.vendorId === vendorId && p.status === 'approved');

  if (!vendor) return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-gray-50">
          <i className="fa-solid fa-store-slash text-4xl text-gray-300 mb-4"></i>
          <p className="text-gray-500 font-medium">Store not found.</p>
          <Button variant="ghost" onClick={() => navigate(-1)} className="mt-4">Go Back</Button>
      </div>
  );

  return (
    <div className="min-h-screen bg-gray-50 pb-24 animate-fade-in">
      {/* Store Header */}
      <div className="relative bg-white shadow-sm border-b border-gray-200">
          {/* Cover Photo (Gradient for now) */}
          <div className="h-32 bg-gradient-to-r from-gray-900 to-gray-700 w-full relative overflow-hidden">
               <div className="absolute inset-0 opacity-20 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')]"></div>
               <button 
                  onClick={() => navigate(-1)} 
                  className="absolute top-4 left-4 w-10 h-10 bg-black/20 hover:bg-black/40 backdrop-blur-md rounded-full text-white flex items-center justify-center transition-all active:scale-95 z-10"
               >
                  <i className="fa-solid fa-arrow-left"></i>
               </button>
          </div>
          
          {/* Info Section */}
          <div className="px-4 pb-6">
              <div className="relative -mt-12 mb-3 flex justify-between items-end">
                  <div className="relative">
                      <div className="w-24 h-24 rounded-2xl bg-white p-1 shadow-md">
                          <img 
                              src={vendor.storeAvatarUrl || 'https://via.placeholder.com/100'} 
                              className="w-full h-full object-cover rounded-xl bg-gray-100" 
                              alt={vendor.storeName} 
                          />
                      </div>
                      {vendor.isApproved && (
                          <div className="absolute -bottom-1 -right-1 bg-blue-500 text-white text-[10px] w-6 h-6 flex items-center justify-center rounded-full border-2 border-white shadow-sm" title="Verified Vendor">
                              <i className="fa-solid fa-check"></i>
                          </div>
                      )}
                  </div>
                  <div className="flex gap-2 mb-1">
                       <div className="flex flex-col items-center bg-gray-50 px-3 py-1.5 rounded-lg border border-gray-100">
                           <span className="text-xs font-bold text-gray-900">{vendor.rating}</span>
                           <span className="text-[8px] text-gray-400 uppercase font-bold">Rating</span>
                       </div>
                       <div className="flex flex-col items-center bg-gray-50 px-3 py-1.5 rounded-lg border border-gray-100">
                           <span className="text-xs font-bold text-gray-900">{vendorProducts.length}</span>
                           <span className="text-[8px] text-gray-400 uppercase font-bold">Items</span>
                       </div>
                  </div>
              </div>
              
              <div>
                  <h1 className="text-2xl font-display font-bold text-gray-900 flex items-center gap-2">
                      {vendor.storeName}
                  </h1>
                  <p className="text-sm text-gray-500 mt-1 leading-relaxed max-w-md">{vendor.storeDescription}</p>
                  
                  <div className="flex flex-col gap-1 mt-3">
                       <div className="flex items-center gap-4 text-xs text-gray-500 font-medium">
                          <span className="flex items-center gap-1 bg-gray-100 px-2 py-1 rounded">
                              <i className="fa-solid fa-location-dot text-primary"></i> {vendor.location}
                          </span>
                          <span className="flex items-center gap-1">
                              <i className="fa-solid fa-calendar text-gray-400"></i> Since {new Date(vendor.createdAt || Date.now()).getFullYear()}
                          </span>
                      </div>
                      {vendor.contactPhone && (
                          <a href={`tel:${vendor.contactPhone}`} className="flex items-center gap-2 text-xs font-bold text-green-600 mt-2 bg-green-50 w-fit px-2 py-1 rounded-lg hover:bg-green-100 transition-colors">
                              <i className="fa-solid fa-phone"></i> {vendor.contactPhone}
                          </a>
                      )}
                  </div>
              </div>
          </div>
      </div>

      {/* Product Grid */}
      <div className="p-4">
          <h2 className="font-bold text-gray-900 text-lg mb-4">Store Products</h2>
          
          {vendorProducts.length === 0 ? (
              <div className="text-center py-12 bg-white rounded-2xl border border-dashed border-gray-200">
                  <p className="text-gray-400 text-sm">This vendor hasn't added any products yet.</p>
              </div>
          ) : (
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-3">
                {vendorProducts.map(product => {
                    const mainImage = product.images && product.images.length > 0 ? product.images[0] : 'https://via.placeholder.com/300';
                    const isFav = favorites.includes(product.id);
                    
                    return (
                        <div 
                            key={product.id} 
                            className="bg-white rounded-2xl overflow-hidden shadow-card border border-gray-100 hover:shadow-xl transition-all duration-300 group relative flex flex-col h-full cursor-pointer"
                            onClick={() => navigate(`/buyer/product/${product.id}`)}
                        >
                             {/* Image - Fills large space (approx 80%) */}
                            <div className="aspect-[4/5] w-full relative overflow-hidden">
                                <img 
                                    src={mainImage} 
                                    alt={product.title} 
                                    className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110" 
                                />
                                
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

                            {/* Bottom Details - Compact Area (approx 20%) */}
                            <div className="p-3 bg-white flex flex-col justify-between flex-grow relative z-10">
                                <div>
                                    <h3 className="text-xs text-gray-800 font-bold leading-tight line-clamp-2 mb-1">{product.title}</h3>
                                </div>
                                
                                <div className="flex items-center justify-between mt-2">
                                    <span className="text-sm font-extrabold text-gray-900">{product.currency}{product.price.toFixed(2)}</span>
                                    <button 
                                        className={`w-7 h-7 rounded-full flex items-center justify-center text-white transition-all shadow-md active:scale-90 ${product.stock > 0 ? 'bg-black hover:bg-primary' : 'bg-gray-300 cursor-not-allowed'}`}
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            if(product.stock > 0) addToCart(product);
                                        }}
                                        disabled={product.stock === 0}
                                    >
                                        <i className="fa-solid fa-plus text-xs"></i>
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

// --- Product Detail Page ---
export const ProductDetail: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { products, vendors, addToCart, favorites, toggleFavorite } = useApp();
  const product = products.find(p => p.id === id);
  const [added, setAdded] = useState(false);
  const [activeImg, setActiveImg] = useState(0);
  const [showFullImage, setShowFullImage] = useState(false);

  if (!product) return <div className="p-20 text-center text-gray-500">Product not found</div>;

  const vendor = vendors.find(v => v.vendorId === product.vendorId);
  const images = product.images && product.images.length > 0 ? product.images : ['https://via.placeholder.com/600'];

  const handleAddToCart = () => {
    addToCart(product);
    setAdded(true);
    setTimeout(() => setAdded(false), 2000);
  };

  const handleBuyNow = () => {
    addToCart(product);
    navigate('/buyer/checkout');
  };

  const isFav = favorites.includes(product.id);
  const contactNumber = product.contactPhone || (vendor as any)?.contactPhone || '233000000000';

  return (
    <div className="bg-white min-h-screen relative flex flex-col pb-[110px]">
      
      {showFullImage && (
          <div className="fixed inset-0 z-[60] bg-black flex items-center justify-center p-4 animate-fade-in" onClick={() => setShowFullImage(false)}>
              <button className="absolute top-4 right-4 text-white p-2 rounded-full bg-white/20 hover:bg-white/30 transition-colors">
                  <i className="fa-solid fa-xmark text-xl"></i>
              </button>
              <img src={images[activeImg]} className="max-w-full max-h-full object-contain" alt="Full View" />
          </div>
      )}

      <div className="absolute top-0 left-0 right-0 p-4 flex justify-between items-center mt-safe z-30 pointer-events-none">
          <button 
              onClick={() => navigate(-1)} 
              className="w-10 h-10 bg-white/90 backdrop-blur-md border border-gray-100 rounded-full flex items-center justify-center text-gray-700 shadow-sm active:scale-95 transition-all pointer-events-auto hover:bg-white hover:shadow-md"
          >
              <i className="fa-solid fa-arrow-left"></i>
          </button>
           <button 
              onClick={() => toggleFavorite(product.id)}
              className={`w-10 h-10 backdrop-blur-md border rounded-full flex items-center justify-center shadow-sm active:scale-95 transition-all pointer-events-auto ${isFav ? 'bg-white text-red-500 border-red-100 shadow-red-100' : 'bg-white/90 text-gray-500 border-gray-100 hover:bg-white'}`}
          >
              <i className={`${isFav ? 'fa-solid' : 'fa-regular'} fa-heart`}></i>
          </button>
      </div>

      <div className="w-full bg-gray-50 relative border-b border-gray-100">
        <div 
            className="w-full aspect-square max-h-[450px] relative flex items-center justify-center overflow-hidden bg-white mx-auto cursor-zoom-in" 
            onClick={() => setShowFullImage(true)}
        >
             <img 
                src={images[activeImg]} 
                className="w-full h-full object-contain transition-all duration-500 p-4" 
                alt={product.title}
            />
            
            <div className="absolute bottom-4 right-4 bg-black/50 text-white text-[10px] px-3 py-1.5 rounded-full backdrop-blur-md pointer-events-none font-medium tracking-wider">
                {activeImg + 1} / {images.length}
            </div>
        </div>

        {images.length > 1 && (
            <div className="flex gap-3 overflow-x-auto px-4 py-4 hide-scrollbar bg-white border-t border-gray-50">
                {images.map((img, idx) => (
                    <div 
                        key={idx} 
                        onClick={() => setActiveImg(idx)}
                        className={`relative w-16 h-16 flex-shrink-0 rounded-xl overflow-hidden border-2 cursor-pointer transition-all duration-200 bg-gray-50 ${idx === activeImg ? 'border-primary ring-2 ring-primary/20 opacity-100 scale-105' : 'border-transparent opacity-60 hover:opacity-100'}`}
                    >
                        <img src={img} className="w-full h-full object-cover" alt={`thumb-${idx}`} />
                    </div>
                ))}
            </div>
        )}
      </div>

      <div className="flex-1 bg-white px-5 py-6 relative z-10">
        <div className="flex justify-between items-start mb-4">
            <div className="w-3/4 pr-4">
                <h1 className="text-2xl font-display font-bold text-gray-900 leading-tight mb-2">{product.title}</h1>
                <div className="flex items-center gap-2 flex-wrap">
                     <Badge color="violet">{product.category}</Badge>
                     <span className="text-xs text-gray-300">•</span>
                     <span className={`text-xs font-bold ${product.stock > 0 ? 'text-green-600' : 'text-red-500'}`}>
                         {product.stock > 0 ? 'In Stock' : 'Out of Stock'}
                     </span>
                </div>
            </div>
            <div className="text-right flex-shrink-0">
                <h2 className="text-2xl font-display font-bold text-primary">{product.currency}{product.price}</h2>
            </div>
        </div>
        
        {vendor && (
            <div 
                className="flex items-center p-3 bg-gray-50 rounded-xl mb-6 cursor-pointer border border-gray-100 hover:bg-gray-100 transition-colors group" 
                onClick={() => navigate(`/store/${vendor.vendorId}`)}
            >
                <div className="relative">
                    <img src={vendor.storeAvatarUrl || 'https://via.placeholder.com/40'} className="w-10 h-10 rounded-full object-cover border border-white shadow-sm" />
                    {vendor.isApproved && (
                        <div className="absolute -bottom-1 -right-1 w-4 h-4 bg-blue-500 border-2 border-white rounded-full flex items-center justify-center text-[6px] text-white">
                            <i className="fa-solid fa-check"></i>
                        </div>
                    )}
                </div>
                <div className="ml-3 flex-grow">
                    <p className="text-sm font-bold text-gray-900 flex items-center gap-1">
                        {vendor.storeName}
                        {vendor.isApproved && <i className="fa-solid fa-circle-check text-blue-500 text-xs" title="Verified Vendor"></i>}
                    </p>
                    <div className="flex items-center text-xs text-gray-500">
                        <i className="fa-solid fa-location-dot text-primary mr-1"></i> {product.location}
                        <span className="mx-2 text-gray-300">|</span>
                        <i className="fa-solid fa-star text-yellow-400 mr-1"></i> {vendor.rating}
                    </div>
                </div>
                <i className="fa-solid fa-chevron-right text-xs text-gray-300 group-hover:text-primary"></i>
            </div>
        )}

        <div className="space-y-6">
            <div>
                <h3 className="font-bold text-gray-900 mb-2 text-sm">Description</h3>
                <p className="text-sm text-gray-600 leading-relaxed">{product.description}</p>
            </div>
            
            <div className="grid grid-cols-2 gap-3">
                <div className="bg-gray-50 p-3 rounded-xl border border-gray-100">
                    <p className="text-[10px] font-bold text-gray-400 uppercase mb-1">Location</p>
                    <p className="text-sm font-bold text-gray-800">{product.location}</p>
                </div>
                <div className="bg-gray-50 p-3 rounded-xl border border-gray-100">
                    <p className="text-[10px] font-bold text-gray-400 uppercase mb-1">Availability</p>
                    <p className="text-sm font-bold text-gray-800">{product.stock} Units</p>
                </div>
            </div>
        </div>
      </div>

      <div className="fixed bottom-0 left-0 right-0 p-3 z-50 bg-white border-t border-gray-100 pb-safe shadow-[0_-5px_30px_rgba(0,0,0,0.08)]">
          <div className="flex items-center gap-2 max-w-3xl mx-auto">
            <button 
                className="w-12 h-12 flex items-center justify-center rounded-xl text-green-600 bg-green-50 hover:bg-green-100 transition-colors active:scale-95 border border-green-100 flex-shrink-0"
                onClick={() => window.open(`https://wa.me/${contactNumber}?text=Hi, I'm interested in ${product.title} on LYNQED.`, '_blank')}
            >
                <i className="fa-brands fa-whatsapp text-2xl"></i>
            </button>
            
            <Button 
                className="flex-1 h-12 text-sm font-bold border-gray-200 bg-white text-gray-800 hover:bg-gray-50" 
                variant="secondary"
                onClick={handleAddToCart}
                disabled={product.stock === 0}
                icon={added ? 'check' : 'cart-plus'}
            >
                {added ? 'Added' : 'Add to Cart'}
            </Button>

            <Button 
                className="flex-1 h-12 text-sm font-bold shadow-lg shadow-primary/20" 
                variant="primary"
                onClick={handleBuyNow}
                disabled={product.stock === 0}
                icon="credit-card"
            >
                Buy Now
            </Button>
          </div>
      </div>
    </div>
  );
};

// --- Cart Page ---
export const Cart: React.FC = () => {
    const { cart, removeFromCart, clearCart } = useApp();
    const navigate = useNavigate();

    const total = cart.reduce((sum, item) => sum + (item.product.price * item.quantity), 0);

    if (cart.length === 0) return (
        <div className="min-h-screen flex flex-col items-center justify-center p-6 text-center bg-gray-50 pb-safe">
            <div className="w-24 h-24 bg-white rounded-full flex items-center justify-center mb-6 text-gray-300 shadow-soft animate-bounce-slight">
                <i className="fa-solid fa-cart-shopping text-3xl"></i>
            </div>
            <h2 className="text-2xl font-display font-bold text-gray-900">Your cart is empty</h2>
            <p className="text-gray-500 mt-2 mb-8 max-w-xs mx-auto">Looks like you haven't added anything yet. Start exploring!</p>
            <Button onClick={() => navigate('/buyer/dashboard')} size="lg" className="shadow-xl shadow-primary/30">Start Shopping</Button>
        </div>
    );

    return (
        <div className="p-4 min-h-screen bg-gray-50 pb-safe animate-fade-in">
            <div className="flex items-center justify-between mb-6 mt-2">
                 <div className="flex items-center gap-3">
                    <button onClick={() => navigate(-1)} className="w-8 h-8 flex items-center justify-center bg-white rounded-full shadow-sm"><i className="fa-solid fa-arrow-left text-sm"></i></button>
                    <h1 className="text-2xl font-display font-bold text-gray-900">Cart <span className="text-gray-400 text-lg font-normal">({cart.length})</span></h1>
                 </div>
                 <button onClick={clearCart} className="text-xs font-bold text-red-500 bg-red-50 px-3 py-1.5 rounded-lg hover:bg-red-100 transition-colors">Clear</button>
            </div>
            
            {/* Cart Items */}
            <div className="space-y-4 mb-8">
                {cart.map(item => (
                    <div key={item.productId} className="bg-white p-3 rounded-2xl shadow-card flex items-center gap-4 animate-slide-up">
                        <div className="w-20 h-20 rounded-xl bg-gray-100 flex-shrink-0 overflow-hidden">
                            <img src={item.product.images[0]} className="w-full h-full object-cover" />
                        </div>
                        <div className="flex-grow">
                            <h3 className="font-bold text-sm text-gray-900 leading-tight mb-1">{item.product.title}</h3>
                            <p className="text-primary font-bold text-base">{item.product.currency}{item.product.price}</p>
                            <p className="text-xs text-gray-400 mt-1">Standard Delivery</p>
                        </div>
                        <div className="flex flex-col items-end gap-3">
                            <div className="flex items-center bg-gray-50 rounded-lg p-1">
                                <span className="text-xs font-bold w-6 text-center">{item.quantity}</span>
                            </div>
                            <button onClick={() => removeFromCart(item.productId)} className="w-8 h-8 rounded-full bg-red-50 text-red-500 hover:bg-red-500 hover:text-white flex items-center justify-center transition-all">
                                <i className="fa-solid fa-trash text-xs"></i>
                            </button>
                        </div>
                    </div>
                ))}
            </div>

            {/* Summary & Pay Section (Moved Inline) */}
            <div className="bg-white rounded-3xl shadow-[0_4px_20px_rgba(0,0,0,0.05)] p-6 z-30 border border-gray-100">
                <div className="flex justify-between items-center mb-4">
                    <span className="text-gray-500 font-medium">Total</span>
                    <span className="text-3xl font-display font-bold text-gray-900">₵{total.toFixed(2)}</span>
                </div>
                <Button fullWidth size="lg" onClick={() => navigate('/buyer/checkout')} className="shadow-xl shadow-primary/20 h-14 text-lg">
                    Proceed to Pay
                </Button>
            </div>
        </div>
    );
};

// --- Checkout Page ---
export const Checkout: React.FC = () => {
    const { cart, placeOrder, currentUser, login } = useApp();
    const navigate = useNavigate();
    const [method, setMethod] = useState<'delivery' | 'pickup'>('delivery');
    const [isPlacing, setIsPlacing] = useState(false);
    const [guestEmail, setGuestEmail] = useState('');
    const [showGuestLogin, setShowGuestLogin] = useState(!currentUser);

    // If cart is empty (e.g. refreshed), redirect
    useEffect(() => {
        if(cart.length === 0) navigate('/buyer/dashboard');
    }, [cart, navigate]);

    const total = cart.reduce((sum, item) => sum + (item.product.price * item.quantity), 0);
    const fee = method === 'delivery' ? 10 : 0;

    const handleOrder = async () => {
        // If user is guest, they need to provide an email or login
        if (!currentUser) {
            if (!guestEmail) {
                alert("Please enter your email to proceed as guest or login.");
                return;
            }
            // Auto-login as a guest user with this email for the session
            await login(guestEmail, 'guest');
        }

        setIsPlacing(true);
        setTimeout(() => {
            placeOrder(method);
            setIsPlacing(false);
            navigate('/buyer/orders');
        }, 2000);
    };

    return (
        <div className="p-4 min-h-screen bg-gray-50 pb-32 animate-fade-in pb-safe">
             <div className="flex items-center mb-6 mt-2">
                <button onClick={() => navigate(-1)} className="w-10 h-10 bg-white rounded-full shadow-sm flex items-center justify-center text-gray-600 mr-4"><i className="fa-solid fa-arrow-left"></i></button>
                <h1 className="text-2xl font-display font-bold">Checkout</h1>
            </div>

            <div className="space-y-6">
                {!currentUser && showGuestLogin && (
                    <div className="bg-white p-5 rounded-2xl shadow-sm border border-indigo-100">
                        <h3 className="font-bold text-gray-900 mb-2">Contact Info</h3>
                        <p className="text-xs text-gray-500 mb-4">Enter your email to track your order.</p>
                        <Input 
                            label="Email Address" 
                            value={guestEmail} 
                            onChange={(e) => setGuestEmail(e.target.value)}
                            placeholder="you@student.edu" 
                            icon="envelope"
                        />
                        <div className="text-center text-xs text-gray-400 mt-2">
                            Already have an account? <span className="text-primary font-bold cursor-pointer" onClick={() => navigate('/login')}>Login</span>
                        </div>
                    </div>
                )}

                <section>
                    <h3 className="font-bold text-sm text-gray-900 uppercase tracking-wider mb-3 ml-1">Delivery Method</h3>
                    <div className="grid grid-cols-2 gap-4">
                        <div 
                            onClick={() => setMethod('delivery')}
                            className={`p-4 rounded-2xl cursor-pointer flex flex-col items-center gap-3 transition-all duration-300 ${method === 'delivery' ? 'bg-primary text-white shadow-lg shadow-blue-500/30 scale-[1.02]' : 'bg-white text-gray-500 shadow-sm hover:bg-gray-50'}`}
                        >
                            <div className={`w-12 h-12 rounded-full flex items-center justify-center ${method === 'delivery' ? 'bg-white/20' : 'bg-gray-100'}`}>
                                <i className="fa-solid fa-motorcycle text-xl"></i>
                            </div>
                            <div className="text-center">
                                <span className="block font-bold text-sm">Delivery</span>
                                <span className={`text-xs ${method === 'delivery' ? 'text-blue-100' : 'text-gray-400'}`}>+ ₵10.00</span>
                            </div>
                        </div>
                        <div 
                            onClick={() => setMethod('pickup')}
                            className={`p-4 rounded-2xl cursor-pointer flex flex-col items-center gap-3 transition-all duration-300 ${method === 'pickup' ? 'bg-primary text-white shadow-lg shadow-blue-500/30 scale-[1.02]' : 'bg-white text-gray-500 shadow-sm hover:bg-gray-50'}`}
                        >
                            <div className={`w-12 h-12 rounded-full flex items-center justify-center ${method === 'pickup' ? 'bg-white/20' : 'bg-gray-100'}`}>
                                <i className="fa-solid fa-person-walking text-xl"></i>
                            </div>
                            <div className="text-center">
                                <span className="block font-bold text-sm">Pickup</span>
                                <span className={`text-xs ${method === 'pickup' ? 'text-blue-100' : 'text-gray-400'}`}>Free</span>
                            </div>
                        </div>
                    </div>
                </section>

                <section className="bg-white p-6 rounded-3xl shadow-card">
                    <h3 className="font-bold text-sm text-gray-900 uppercase tracking-wider mb-4">Order Summary</h3>
                    {cart.map(item => (
                        <div key={item.productId} className="flex justify-between py-3 border-b border-gray-50 last:border-0">
                            <div>
                                <span className="text-sm font-medium text-gray-800 block">{item.product.title}</span>
                                <span className="text-xs text-gray-400">Qty: {item.quantity}</span>
                            </div>
                            <span className="font-bold text-gray-900">₵{(item.product.price * item.quantity).toFixed(2)}</span>
                        </div>
                    ))}
                    
                    <div className="mt-6 pt-4 border-t border-dashed border-gray-200 space-y-2">
                        <div className="flex justify-between text-sm">
                            <span className="text-gray-500">Subtotal</span>
                            <span className="font-medium text-gray-900">₵{total.toFixed(2)}</span>
                        </div>
                        <div className="flex justify-between text-sm">
                            <span className="text-gray-500">Delivery Fee</span>
                            <span className="font-medium text-gray-900">₵{fee.toFixed(2)}</span>
                        </div>
                        <div className="flex justify-between items-end mt-4">
                            <span className="text-base font-bold text-gray-900">Total Amount</span>
                            <span className="text-2xl font-display font-bold text-primary">₵{(total + fee).toFixed(2)}</span>
                        </div>
                    </div>
                </section>
            </div>

            <div className="fixed bottom-0 left-0 right-0 p-4 z-30 bg-white border-t border-gray-100 pb-safe">
                <Button fullWidth size="lg" onClick={handleOrder} disabled={isPlacing} className="shadow-xl shadow-blue-600/30 h-14 text-lg">
                    {isPlacing ? 'Processing...' : (currentUser ? 'Place Order' : 'Complete as Guest')}
                </Button>
            </div>
        </div>
    )
}
