
import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useApp } from '../context';
import { Button, Badge, Card, Input, Avatar } from '../components/UI';
import { Product } from '../types';

export const StorePage: React.FC = () => {
    const { vendorId } = useParams<{ vendorId: string }>();
    const navigate = useNavigate();
    const { vendors, products, addToCart, cart, removeFromCart, toggleFavorite, favorites } = useApp();
    
    const vendor = vendors.find(v => v.vendorId === vendorId);
    const vendorProducts = products.filter(p => p.vendorId === vendorId && p.status === 'approved');

    if (!vendor) return <div className="p-8 text-center text-gray-500">Store not found</div>;

    const initials = vendor.storeName.substring(0, 2).toUpperCase();

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
                                    <div className="aspect-square w-full relative overflow-hidden">
                                        <img 
                                            src={product.images[0]} 
                                            alt={product.title} 
                                            className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110" 
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
                                            <h3 className="text-sm text-gray-800 font-bold leading-tight line-clamp-2 mb-1">{product.title}</h3>
                                        </div>
                                        <div className="flex items-center justify-between mt-2">
                                            <span className="text-lg font-extrabold text-gray-900">{product.currency}{product.price.toFixed(2)}</span>
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
    const { products, addToCart, cart, removeFromCart, updateCartQuantity, vendors } = useApp();
    
    const product = products.find(p => p.id === id);
    const vendor = vendors.find(v => v.vendorId === product?.vendorId);
    
    // Local state for quantity selector logic when item NOT in cart
    const [preAddQuantity, setPreAddQuantity] = useState(1);
    
    if (!product) return <div className="p-8 text-center text-gray-500">Product not found</div>;

    const cartItem = cart.find(i => i.productId === product.id);
    const isInCart = !!cartItem;
    
    // If in cart, use cart quantity. If not, use local pre-add quantity.
    const currentQuantity = cartItem ? cartItem.quantity : preAddQuantity;

    const handleQuantityChange = (delta: number) => {
        const newQty = Math.max(1, currentQuantity + delta);
        if (newQty > product.stock) return; // Cap at stock

        if (isInCart) {
            updateCartQuantity(product.id, newQty);
        } else {
            setPreAddQuantity(newQty);
        }
    };

    const handleAction = () => {
        if (isInCart) {
            removeFromCart(product.id);
        } else {
            addToCart(product, preAddQuantity);
        }
    };

    return (
        <div className="min-h-screen bg-white pb-24 animate-fade-in relative">
             {/* Full Screen Image */}
             <div className="relative h-[50vh] bg-gray-100">
                <button 
                    onClick={() => navigate(-1)} 
                    className="absolute top-4 left-4 z-10 w-10 h-10 bg-white/50 backdrop-blur-md rounded-full flex items-center justify-center text-gray-800 hover:bg-white transition-all"
                >
                    <i className="fa-solid fa-arrow-left"></i>
                </button>
                <img src={product.images[0]} className="w-full h-full object-cover" alt={product.title} />
             </div>

             {/* Content Sheet */}
             <div className="relative -mt-6 bg-white rounded-t-[2rem] p-6 min-h-[50vh] shadow-[0_-10px_40px_rgba(0,0,0,0.1)]">
                <div className="w-12 h-1.5 bg-gray-200 rounded-full mx-auto mb-6"></div>
                
                <div className="flex justify-between items-start mb-4">
                    <div>
                        <h1 className="text-2xl font-display font-bold text-gray-900 leading-tight mb-2">{product.title}</h1>
                        <div className="flex items-center gap-2" onClick={() => navigate(`/store/${vendor?.vendorId}`)}>
                            <Avatar src={vendor?.storeAvatarUrl} name={vendor?.storeName || 'Vendor'} size="sm" />
                            <span className="text-sm font-medium text-gray-600 underline decoration-gray-300 underline-offset-2">{vendor?.storeName}</span>
                        </div>
                    </div>
                    <div className="text-right">
                        <span className="block text-2xl font-extrabold text-primary">{product.currency}{product.price.toFixed(2)}</span>
                        <span className="text-xs font-bold text-green-500 bg-green-50 px-2 py-0.5 rounded-full">{product.stock > 0 ? 'In Stock' : 'Sold Out'}</span>
                    </div>
                </div>

                {/* WhatsApp Action */}
                {vendor?.contactPhone && (
                     <a 
                        href={`https://wa.me/${vendor.contactPhone.replace(/[^0-9]/g, '').replace(/^0/, '233')}?text=Hi, I'm interested in ${product.title}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center gap-3 bg-green-50 p-3 rounded-xl mb-6 hover:bg-green-100 transition-colors cursor-pointer"
                    >
                        <div className="w-10 h-10 bg-green-500 rounded-full flex items-center justify-center text-white shadow-lg shadow-green-200">
                            <i className="fa-brands fa-whatsapp text-xl"></i>
                        </div>
                        <div className="flex-1">
                            <p className="font-bold text-gray-800 text-sm">Chat with Vendor</p>
                            <p className="text-xs text-green-600">Ask about availability or details</p>
                        </div>
                        <i className="fa-solid fa-chevron-right text-green-300 text-xs mr-2"></i>
                    </a>
                )}

                <h3 className="font-bold text-gray-900 mb-2 text-sm uppercase tracking-wide">Description</h3>
                <p className="text-gray-600 leading-relaxed text-sm mb-8">{product.description}</p>
             </div>

             {/* Sticky Bottom Bar */}
             <div className="fixed bottom-0 left-0 right-0 p-4 bg-white border-t border-gray-100 flex items-center gap-4 z-30 pb-safe">
                {/* Quantity Selector */}
                <div className="flex items-center bg-gray-100 rounded-2xl p-1">
                    <button 
                        onClick={() => handleQuantityChange(-1)}
                        className="w-10 h-10 flex items-center justify-center text-gray-600 hover:bg-white rounded-xl transition-all disabled:opacity-30"
                        disabled={currentQuantity <= 1}
                    >
                        <i className="fa-solid fa-minus text-xs"></i>
                    </button>
                    <span className="w-8 text-center font-bold text-sm">{currentQuantity}</span>
                    <button 
                        onClick={() => handleQuantityChange(1)}
                        className="w-10 h-10 flex items-center justify-center text-gray-600 hover:bg-white rounded-xl transition-all disabled:opacity-30"
                        disabled={currentQuantity >= product.stock}
                    >
                        <i className="fa-solid fa-plus text-xs"></i>
                    </button>
                </div>

                {/* Add/Remove Button */}
                <Button 
                    fullWidth 
                    size="lg" 
                    variant={isInCart ? 'danger' : 'primary'}
                    onClick={handleAction}
                    disabled={product.stock === 0}
                    className={isInCart ? 'shadow-red-200' : ''}
                >
                    {isInCart ? (
                        <>
                            <i className="fa-solid fa-trash mr-2"></i> Remove
                        </>
                    ) : (
                        <>
                            Add to Cart <span className="ml-2 bg-white/20 px-2 py-0.5 rounded text-sm">₵{(product.price * currentQuantity).toFixed(2)}</span>
                        </>
                    )}
                </Button>
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

                {/* Summary Section - Integrated into flow */}
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
    const { cart, placeOrder, currentUser, login } = useApp();
    const navigate = useNavigate();
    const [method, setMethod] = useState<'delivery' | 'pickup'>('delivery');
    const [isPlacing, setIsPlacing] = useState(false);
    const [guestEmail, setGuestEmail] = useState('');
    const [deliveryFee, setDeliveryFee] = useState(10); // Default base fee

    // Simple fee calculation simulation
    useEffect(() => {
        if (method === 'pickup') {
            setDeliveryFee(0);
        } else {
            // In a real app, we'd calculate distance between User GPS and Vendor GPS
            // For MVP, we use a random distance factor or flat rate
            setDeliveryFee(15.00); 
        }
    }, [method]);

    const handleOrder = async () => {
        if (!currentUser && !guestEmail) { alert("Email required"); return; }
        if (!currentUser) await login(guestEmail, 'guest');
        
        setIsPlacing(true);
        // Pass the calculated fee to placeOrder
        await placeOrder(method, deliveryFee);
        setTimeout(() => { setIsPlacing(false); navigate('/buyer/orders'); }, 2000);
    };

    const subtotal = cart.reduce((sum, item) => sum + (item.product.price * item.quantity), 0);
    const total = subtotal + deliveryFee;

    return (
        <div className="p-4 min-h-screen bg-gray-50 pb-32 animate-fade-in pb-safe">
            <h1 className="text-2xl font-display font-bold mb-6">Checkout</h1>
            
            {!currentUser && (
                <Card className="p-4 mb-4">
                    <Input label="Guest Email" value={guestEmail} onChange={e => setGuestEmail(e.target.value)} />
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
                    {isPlacing ? 'Processing...' : `Pay ₵${total.toFixed(2)}`}
                </Button>
            </div>
        </div>
    );
};
