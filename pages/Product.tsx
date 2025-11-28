
import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { useApp } from '../context';
import { Button, Badge, Card, Input, Avatar, Spinner } from '../components/UI';
import { Product } from '../types';

export const StorePage: React.FC = () => {
    const { vendorId } = useParams<{ vendorId: string }>();
    const navigate = useNavigate();
    const { vendors, products, addToCart, cart, removeFromCart, toggleFavorite, favorites } = useApp();
    
    const vendor = vendors.find(v => v.vendorId === vendorId);
    const vendorProducts = products.filter(p => p.vendorId === vendorId && p.status === 'approved');

    if (!vendor) return <div className="p-8 text-center text-gray-500">Store not found</div>;

    return (
        <div className="min-h-screen bg-gray-50 pb-20 animate-fade-in">
            {/* Store Header */}
            <div className="bg-white p-6 shadow-sm border-b border-gray-100">
                <div className="flex items-center gap-4">
                     <Avatar src={vendor.storeAvatarUrl} name={vendor.storeName} size="xl" />
                     <div className="flex-1">
                         <div className="flex items-center gap-2">
                            <h1 className="text-xl font-display font-bold text-gray-900">{vendor.storeName}</h1>
                            {vendor.isApproved && <i className="fa-solid fa-circle-check text-blue-500 text-sm"></i>}
                         </div>
                         <div className="flex items-center gap-1 text-xs text-gray-500 mt-1 mb-2">
                             <i className="fa-solid fa-location-dot text-red-500"></i> {vendor.location}
                             <span className="mx-1">•</span>
                             <i className="fa-solid fa-star text-yellow-400"></i> {vendor.rating}
                         </div>
                         <p className="text-sm text-gray-600 line-clamp-2">{vendor.storeDescription}</p>
                     </div>
                </div>
                
                {/* Actions */}
                <div className="grid grid-cols-2 gap-3 mt-4">
                     {vendor.contactPhone && (
                        <a 
                            href={`https://wa.me/${vendor.contactPhone.replace(/[^0-9]/g, '').replace(/^0/, '233')}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="flex items-center justify-center gap-2 bg-green-50 text-green-600 py-2 rounded-xl text-sm font-bold hover:bg-green-100 transition-colors"
                        >
                            <i className="fa-brands fa-whatsapp text-lg"></i> Chat
                        </a>
                     )}
                     <button className="flex items-center justify-center gap-2 bg-gray-50 text-gray-600 py-2 rounded-xl text-sm font-bold hover:bg-gray-100 transition-colors">
                        <i className="fa-solid fa-share-nodes"></i> Share
                     </button>
                </div>
            </div>

            {/* Product Grid */}
            <div className="p-4">
                <h2 className="font-bold text-gray-800 mb-4 text-sm uppercase tracking-wide">Products ({vendorProducts.length})</h2>
                {vendorProducts.length === 0 ? (
                    <div className="text-center py-10 text-gray-400">No products available.</div>
                ) : (
                    <div className="grid grid-cols-2 gap-3">
                        {vendorProducts.map(product => {
                            const isFav = favorites.includes(product.id);
                            const isInCart = cart.some(item => item.productId === product.id);

                            return (
                                <div 
                                    key={product.id} 
                                    className="bg-white rounded-2xl overflow-hidden shadow-card border border-gray-100 hover:shadow-xl transition-all duration-300 group relative flex flex-col h-full cursor-pointer"
                                    onClick={() => navigate(`/buyer/product/${product.id}`)}
                                >
                                    <div className="aspect-[4/5] w-full relative overflow-hidden bg-white">
                                        <img 
                                            src={product.images[0]} 
                                            alt={product.title} 
                                            className="w-full h-full object-cover p-0 transition-transform duration-700 group-hover:scale-110" 
                                        />
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
                                    <div className="p-3 bg-white flex flex-col justify-between flex-grow relative z-10">
                                        <div>
                                            <h3 className="text-xs text-gray-800 font-bold leading-tight line-clamp-2 mb-1">{product.title}</h3>
                                        </div>
                                        <div className="flex items-center justify-between mt-2">
                                            <span className="text-sm font-extrabold text-gray-900">{product.currency}{product.price.toFixed(2)}</span>
                                            <button 
                                                className={`w-8 h-8 rounded-full flex items-center justify-center text-white transition-all shadow-md active:scale-90 group-btn ${product.stock === 0 ? 'bg-gray-300 cursor-not-allowed' : isInCart ? 'bg-green-500 hover:bg-red-500' : 'bg-black hover:bg-primary'}`}
                                                onClick={(e) => {
                                                    e.stopPropagation();
                                                    if (product.stock > 0) {
                                                        isInCart ? removeFromCart(product.id) : addToCart(product);
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
                            );
                        })}
                    </div>
                )}
            </div>
        </div>
    );
};

export const ProductDetail: React.FC = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    const { products, addToCart, cart, removeFromCart, updateCartQuantity, vendors, favorites, toggleFavorite } = useApp();
    const [selectedImageIndex, setSelectedImageIndex] = useState(0);
    
    const product = products.find(p => p.id === id);
    const vendor = vendors.find(v => v.vendorId === product?.vendorId);
    
    // Recommendations
    const relatedProducts = products
        .filter(p => p.category === product?.category && p.id !== product?.id)
        .slice(0, 4);

    const [quantity, setQuantity] = useState(1);
    
    if (!product) return <div className="min-h-screen flex items-center justify-center"><Spinner /></div>;

    const cartItem = cart.find(i => i.productId === product.id);
    const isInCart = !!cartItem;
    const isFav = favorites.includes(product.id);
    
    // Sync local quantity with cart if present
    useEffect(() => {
        if (cartItem) setQuantity(cartItem.quantity);
    }, [cartItem]);

    const handleQuantity = (delta: number) => {
        const newQ = Math.max(1, Math.min(product.stock, quantity + delta));
        setQuantity(newQ);
        if (isInCart) updateCartQuantity(product.id, newQ);
    };

    const handleAddToCart = () => {
        if (isInCart) {
            removeFromCart(product.id);
        } else {
            addToCart(product, quantity);
        }
    };

    return (
        <div className="min-h-screen bg-gray-50 pb-20 animate-fade-in">
            {/* Breadcrumbs & Header */}
            <div className="bg-white border-b border-gray-200 sticky top-0 z-30 px-4 py-3 flex items-center gap-3 shadow-sm">
                <button onClick={() => navigate(-1)} className="text-gray-500 hover:text-gray-900">
                    <i className="fa-solid fa-arrow-left"></i>
                </button>
                <div className="text-xs text-gray-500 breadcrumbs flex items-center gap-2 overflow-hidden whitespace-nowrap">
                    <Link to="/buyer/dashboard" className="hover:text-primary">Home</Link>
                    <i className="fa-solid fa-chevron-right text-[8px]"></i>
                    <span>{product.category}</span>
                    <i className="fa-solid fa-chevron-right text-[8px]"></i>
                    <span className="text-gray-900 font-bold truncate">{product.title}</span>
                </div>
                <div className="ml-auto flex gap-3">
                    <button onClick={() => toggleFavorite(product.id)} className={`${isFav ? 'text-red-500' : 'text-gray-400'} hover:text-red-600 transition-colors`}>
                        <i className={`${isFav ? 'fa-solid' : 'fa-regular'} fa-heart text-lg`}></i>
                    </button>
                    <button onClick={() => {
                        if (navigator.share) navigator.share({ title: product.title, url: window.location.href });
                        else alert("Link copied!");
                    }} className="text-gray-400 hover:text-blue-500">
                        <i className="fa-solid fa-share-nodes text-lg"></i>
                    </button>
                </div>
            </div>

            <div className="max-w-7xl mx-auto p-4 md:p-8">
                <div className="bg-white rounded-2xl shadow-card overflow-hidden grid grid-cols-1 md:grid-cols-2 gap-0 md:gap-8">
                    
                    {/* Left: Image Gallery */}
                    <div className="p-4 md:p-8 bg-white flex flex-col gap-4">
                        <div className="aspect-square w-full bg-gray-50 rounded-2xl overflow-hidden border border-gray-100 relative group">
                            <img 
                                src={product.images[selectedImageIndex]} 
                                alt={product.title} 
                                className="w-full h-full object-contain mix-blend-multiply transition-transform duration-500 group-hover:scale-105" 
                            />
                            {product.stock === 0 && (
                                <div className="absolute top-4 left-4 bg-red-600 text-white text-xs font-bold px-3 py-1 rounded shadow-sm">
                                    SOLD OUT
                                </div>
                            )}
                        </div>
                        {/* Thumbnails */}
                        {product.images.length > 1 && (
                            <div className="flex gap-2 overflow-x-auto hide-scrollbar">
                                {product.images.map((img, idx) => (
                                    <div 
                                        key={idx} 
                                        onClick={() => setSelectedImageIndex(idx)}
                                        className={`w-16 h-16 rounded-lg border-2 cursor-pointer overflow-hidden flex-shrink-0 ${selectedImageIndex === idx ? 'border-primary' : 'border-gray-100 hover:border-gray-300'}`}
                                    >
                                        <img src={img} className="w-full h-full object-cover" />
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>

                    {/* Right: Product Info */}
                    <div className="p-4 md:p-8 md:border-l border-gray-100 flex flex-col">
                        <div className="mb-4">
                            <span className="text-xs font-bold text-gray-400 uppercase tracking-wider">{product.category}</span>
                            <h1 className="text-2xl md:text-3xl font-display font-bold text-gray-900 mt-1 leading-tight">{product.title}</h1>
                            <div className="flex items-center gap-2 mt-2">
                                <div className="flex text-yellow-400 text-xs">
                                    {[1,2,3,4,5].map(i => <i key={i} className={`fa-solid fa-star ${i <= (product.rating||0) ? '' : 'text-gray-200'}`}></i>)}
                                </div>
                                <span className="text-xs text-gray-500">(24 verified ratings)</span>
                            </div>
                        </div>

                        {/* Price Strip - Franko Style */}
                        <div className="bg-red-50 border border-red-100 rounded-xl p-4 mb-6 flex justify-between items-center">
                            <div>
                                <p className="text-xs text-red-400 font-bold uppercase mb-1">Special Price</p>
                                <div className="flex items-baseline gap-1">
                                    <span className="text-3xl font-black text-red-600">{product.currency}{product.price.toFixed(2)}</span>
                                    {/* Mock original price for effect */}
                                    <span className="text-sm text-gray-400 line-through decoration-red-300">{(product.price * 1.2).toFixed(2)}</span>
                                </div>
                            </div>
                            <div className="text-right">
                                <span className={`inline-block px-3 py-1 rounded-full text-xs font-bold border ${product.stock > 0 ? 'bg-green-100 text-green-700 border-green-200' : 'bg-gray-100 text-gray-500 border-gray-200'}`}>
                                    {product.stock > 0 ? 'In Stock' : 'Sold Out'}
                                </span>
                            </div>
                        </div>

                        {/* Description */}
                        <div className="mb-6">
                            <h3 className="font-bold text-gray-900 text-sm mb-2">Product Details</h3>
                            <p className="text-sm text-gray-600 leading-relaxed whitespace-pre-line">
                                {product.description}
                            </p>
                        </div>

                        {/* Actions */}
                        <div className="mt-auto border-t border-gray-100 pt-6">
                            <div className="flex gap-4 mb-4">
                                {/* Quantity */}
                                <div className="flex items-center border border-gray-300 rounded-lg h-12 w-32">
                                    <button 
                                        onClick={() => handleQuantity(-1)}
                                        disabled={quantity <= 1}
                                        className="w-10 h-full flex items-center justify-center text-gray-500 hover:bg-gray-100 disabled:opacity-50"
                                    >
                                        <i className="fa-solid fa-minus text-xs"></i>
                                    </button>
                                    <span className="flex-1 text-center font-bold text-gray-900">{quantity}</span>
                                    <button 
                                        onClick={() => handleQuantity(1)}
                                        disabled={quantity >= product.stock}
                                        className="w-10 h-full flex items-center justify-center text-gray-500 hover:bg-gray-100 disabled:opacity-50"
                                    >
                                        <i className="fa-solid fa-plus text-xs"></i>
                                    </button>
                                </div>
                                
                                {/* Add To Cart - Franko Red/Orange Gradient */}
                                <button 
                                    onClick={handleAddToCart}
                                    disabled={product.stock === 0}
                                    className={`flex-1 h-12 rounded-lg font-bold text-white shadow-lg flex items-center justify-center gap-2 transition-all active:scale-[0.98] ${isInCart ? 'bg-green-600 hover:bg-green-700' : 'bg-gradient-to-r from-orange-500 to-red-600 hover:from-orange-600 hover:to-red-700'} ${product.stock === 0 ? 'opacity-50 cursor-not-allowed grayscale' : ''}`}
                                >
                                    {isInCart ? (
                                        <>
                                            <i className="fa-solid fa-check"></i> Added to Cart
                                        </>
                                    ) : (
                                        <>
                                            <i className="fa-solid fa-cart-shopping"></i> Add to Cart
                                        </>
                                    )}
                                </button>
                            </div>
                            
                            {/* Vendor Info / Trust */}
                            <div className="bg-gray-50 rounded-xl p-3 flex items-center gap-3 cursor-pointer hover:bg-gray-100 transition-colors border border-gray-100" onClick={() => navigate(`/store/${vendor?.vendorId}`)}>
                                <Avatar src={vendor?.storeAvatarUrl} name={vendor?.storeName || 'Vendor'} size="md" />
                                <div className="flex-1">
                                    <p className="text-xs text-gray-400 uppercase font-bold">Sold by</p>
                                    <p className="text-sm font-bold text-gray-900">{vendor?.storeName}</p>
                                </div>
                                {vendor?.contactPhone && (
                                     <a 
                                        href={`https://wa.me/${vendor.contactPhone.replace(/[^0-9]/g, '').replace(/^0/, '233')}?text=Hi, I saw your product ${product.title} on LYNQED`}
                                        onClick={(e) => e.stopPropagation()}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="w-10 h-10 bg-green-500 rounded-full flex items-center justify-center text-white shadow-md hover:scale-110 transition-transform"
                                    >
                                        <i className="fa-brands fa-whatsapp text-xl"></i>
                                    </a>
                                )}
                            </div>
                        </div>
                    </div>
                </div>

                {/* Related Products */}
                {relatedProducts.length > 0 && (
                    <div className="mt-12">
                        <h3 className="font-display font-bold text-xl text-gray-900 mb-6">You May Also Like</h3>
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                            {relatedProducts.map(rp => (
                                <div 
                                    key={rp.id}
                                    onClick={() => {
                                        navigate(`/buyer/product/${rp.id}`);
                                        window.scrollTo(0,0);
                                    }}
                                    className="bg-white rounded-xl border border-gray-100 p-3 shadow-sm hover:shadow-md transition-all cursor-pointer group"
                                >
                                    <div className="aspect-square bg-gray-50 rounded-lg overflow-hidden mb-3">
                                        <img src={rp.images[0]} className="w-full h-full object-cover group-hover:scale-105 transition-transform" />
                                    </div>
                                    <h4 className="font-bold text-sm text-gray-900 line-clamp-1">{rp.title}</h4>
                                    <p className="text-red-600 font-bold mt-1">{rp.currency}{rp.price}</p>
                                </div>
                            ))}
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};

export const Cart: React.FC = () => {
    const { cart, removeFromCart, updateCartQuantity, clearCart } = useApp();
    const navigate = useNavigate();

    const subtotal = cart.reduce((s, i) => s + i.product.price * i.quantity, 0);

    return (
        <div className="min-h-screen bg-gray-50 pb-safe">
             <div className="bg-white p-4 shadow-sm sticky top-0 z-10 flex items-center justify-between">
                <div className="flex items-center gap-3">
                    <button onClick={() => navigate(-1)}><i className="fa-solid fa-arrow-left"></i></button>
                    <h1 className="text-xl font-bold font-display">My Cart ({cart.length})</h1>
                </div>
                {cart.length > 0 && <button onClick={clearCart} className="text-xs text-red-500 font-bold">Clear All</button>}
             </div>

             <div className="p-4 space-y-4">
                {cart.length === 0 ? (
                    <div className="text-center py-20 text-gray-400">
                        <i className="fa-solid fa-cart-arrow-down text-4xl mb-4 opacity-20"></i>
                        <p>Your cart is empty.</p>
                        <Button className="mt-4" onClick={() => navigate('/buyer/dashboard')}>Start Shopping</Button>
                    </div>
                ) : (
                    cart.map(item => (
                        <Card key={item.productId} className="p-3 flex gap-3 items-center">
                            <div className="w-20 h-20 bg-gray-100 rounded-xl overflow-hidden flex-shrink-0">
                                <img src={item.product.images[0]} className="w-full h-full object-cover" />
                            </div>
                            <div className="flex-1">
                                <h4 className="font-bold text-sm text-gray-900 line-clamp-1">{item.product.title}</h4>
                                <p className="text-primary font-bold text-sm">₵{item.product.price.toFixed(2)}</p>
                                
                                <div className="flex items-center justify-between mt-2">
                                    <div className="flex items-center bg-gray-50 rounded-lg h-8">
                                        <button onClick={() => updateCartQuantity(item.productId, item.quantity - 1)} className="w-8 h-full flex items-center justify-center text-gray-500 hover:text-gray-900"><i className="fa-solid fa-minus text-[10px]"></i></button>
                                        <span className="text-xs font-bold w-6 text-center">{item.quantity}</span>
                                        <button onClick={() => updateCartQuantity(item.productId, item.quantity + 1)} className="w-8 h-full flex items-center justify-center text-gray-500 hover:text-gray-900"><i className="fa-solid fa-plus text-[10px]"></i></button>
                                    </div>
                                    <button onClick={() => removeFromCart(item.productId)} className="w-8 h-8 flex items-center justify-center text-gray-400 hover:text-red-500 transition-colors">
                                        <i className="fa-solid fa-trash text-sm"></i>
                                    </button>
                                </div>
                            </div>
                        </Card>
                    ))
                )}

                {cart.length > 0 && (
                    <div className="mt-6 pt-4 border-t border-gray-200">
                        <div className="flex justify-between items-center mb-2">
                            <span className="text-gray-500 text-sm">Subtotal</span>
                            <span className="font-bold text-gray-900">₵{subtotal.toFixed(2)}</span>
                        </div>
                        <p className="text-xs text-gray-400 mb-6 text-right">Delivery fees calculated at checkout</p>
                        
                        <Button fullWidth size="lg" onClick={() => navigate('/buyer/checkout')} className="shadow-xl shadow-primary/20">
                            Proceed to Pay
                        </Button>
                    </div>
                )}
             </div>
        </div>
    );
};

export const Checkout: React.FC = () => {
    const { cart, placeOrder, currentUser, signup, login } = useApp();
    const navigate = useNavigate();
    const [method, setMethod] = useState<'delivery' | 'pickup'>('delivery');
    const [isPlacing, setIsPlacing] = useState(false);
    const [guestEmail, setGuestEmail] = useState('');
    const [deliveryFee, setDeliveryFee] = useState(10); 

    useEffect(() => {
        if (method === 'pickup') {
            setDeliveryFee(0);
        } else {
            setDeliveryFee(15.00); 
        }
    }, [method]);

    const handleOrder = async () => {
        if (!currentUser && !guestEmail) { alert("Email required for guest checkout"); return; }
        
        setIsPlacing(true);

        try {
            // Handle Guest: Create Shadow Account
            if (!currentUser) {
                // Try to create shadow account
                const shadowPass = 'guest123'; 
                const regRes = await signup(guestEmail, shadowPass, 'Guest User', 'buyer');
                
                if (!regRes.success) {
                    // If exists, try to log in (assuming they are a returning guest who knows this implicit flow or we just grab the ID if we could, but we can't easily without password. 
                    // So we prompt them to login if registration fails due to exists.)
                     const loginRes = await login(guestEmail, shadowPass);
                     if (!loginRes.success) {
                         alert("This email is already registered. Please Login first.");
                         setIsPlacing(false);
                         return;
                     }
                }
            }

            // Place Order
            await placeOrder(method, deliveryFee);
            setTimeout(() => { 
                setIsPlacing(false); 
                navigate('/buyer/orders'); 
            }, 2000);

        } catch (e) {
            console.error(e);
            setIsPlacing(false);
            alert("Checkout failed. Please try again.");
        }
    };

    const subtotal = cart.reduce((sum, item) => sum + (item.product.price * item.quantity), 0);
    const total = subtotal + deliveryFee;

    return (
        <div className="p-4 min-h-screen bg-gray-50 pb-32 animate-fade-in pb-safe">
            <h1 className="text-2xl font-display font-bold mb-6">Checkout</h1>
            
            {!currentUser && (
                <Card className="p-4 mb-4">
                    <h3 className="font-bold text-sm mb-2">Guest Checkout</h3>
                    <Input label="Email Address" value={guestEmail} onChange={e => setGuestEmail(e.target.value)} placeholder="Enter email for receipt" />
                    <p className="text-xs text-gray-400 mt-2">We'll create a temporary account for you to track this order.</p>
                </Card>
            )}

            <div className="grid grid-cols-2 gap-4 mb-6">
                <div onClick={() => setMethod('delivery')} className={`p-4 rounded-xl border-2 cursor-pointer text-center ${method === 'delivery' ? 'border-primary bg-blue-50 text-primary' : 'border-transparent bg-white'}`}>
                    <i className="fa-solid fa-motorcycle text-xl mb-2"></i>
                    <p className="font-bold text-sm">Delivery</p>
                    <p className="text-xs">₵{deliveryFee}</p>
                </div>
                <div onClick={() => setMethod('pickup')} className={`p-4 rounded-xl border-2 cursor-pointer text-center ${method === 'pickup' ? 'border-primary bg-blue-50 text-primary' : 'border-transparent bg-white'}`}>
                    <i className="fa-solid fa-person-walking text-xl mb-2"></i>
                    <p className="font-bold text-sm">Pickup</p>
                    <p className="text-xs">Free</p>
                </div>
            </div>

            <Card className="p-5">
                <h3 className="font-bold mb-4">Summary</h3>
                {cart.map(i => <div key={i.productId} className="flex justify-between text-sm mb-2"><span>{i.product.title} x{i.quantity}</span><span>₵{i.product.price * i.quantity}</span></div>)}
                <div className="border-t border-dashed my-4"></div>
                <div className="flex justify-between text-sm"><span>Subtotal</span><span>₵{subtotal.toFixed(2)}</span></div>
                <div className="flex justify-between text-sm"><span>Fee</span><span>₵{deliveryFee.toFixed(2)}</span></div>
                <div className="flex justify-between font-bold text-lg mt-2"><span>Total</span><span>₵{total.toFixed(2)}</span></div>
            </Card>

            <div className="fixed bottom-0 left-0 right-0 p-4 bg-white border-t border-gray-100">
                <Button fullWidth size="lg" onClick={handleOrder} disabled={isPlacing}>
                    {isPlacing ? 'Processing Order...' : `Pay ₵${total.toFixed(2)}`}
                </Button>
            </div>
        </div>
    );
};
