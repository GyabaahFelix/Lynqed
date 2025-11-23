
import React, { useState } from 'react';
import { useApp } from '../context';
import { Button, Card, Input, Badge, Avatar } from '../components/UI';
import { useNavigate } from 'react-router-dom';

export const UserProfile: React.FC = () => {
    const { currentUser, currentRole, logout, switchRole, registerDeliveryPerson, orders, deliveryPersons, requestNotificationPermission } = useApp();
    const navigate = useNavigate();
    const [showDeliveryForm, setShowDeliveryForm] = useState(false);
    const [deliveryForm, setDeliveryForm] = useState({ fullName: '', vehicleType: 'bicycle' });
    const [smsEnabled, setSmsEnabled] = useState(false);
    const [pushEnabled, setPushEnabled] = useState(false);

    if (!currentUser) return <div>Please login</div>;

    const handleDeliverySubmit = (e: React.FormEvent) => {
        e.preventDefault();
        registerDeliveryPerson(deliveryForm);
        setShowDeliveryForm(false);
        alert("Registration submitted! Wait for admin approval.");
    };

    const handlePushToggle = async () => {
        if (!pushEnabled) {
            const granted = await requestNotificationPermission();
            if (granted) {
                setPushEnabled(true);
                new Notification("Alerts Enabled", { body: "You will now be notified of new orders." });
            } else {
                alert("Notification permission denied by browser.");
            }
        } else {
            setPushEnabled(false);
        }
    };

    const handleSmsToggle = () => {
        if (!smsEnabled) {
             // Mock check
             alert("SMS Alerts Enabled. (Note: This requires a paid API integration. Simulated for now).");
        }
        setSmsEnabled(!smsEnabled);
    };

    const myOrders = orders
        .filter(o => o.buyerId === currentUser.id)
        .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

    // Check delivery status
    const deliveryProfile = deliveryPersons.find(d => d.userId === currentUser.id);
    const isDeliveryApproved = deliveryProfile?.status === 'approved';
    const isDeliveryPending = deliveryProfile?.status === 'pending';

    return (
        <div className="min-h-screen bg-gray-50 pb-24">
            <div className="bg-white p-6 pb-10 rounded-b-3xl shadow-sm text-center">
                <div className="flex justify-center mb-4">
                    <Avatar 
                        src={currentUser.avatarUrl} 
                        name={currentUser.name} 
                        size="xl" 
                        className="border-4 border-blue-50" 
                    />
                </div>
                <h1 className="text-xl font-bold text-gray-900">{currentUser.name}</h1>
                <p className="text-gray-500 text-sm">{currentUser.email}</p>
                <div className="mt-4 flex justify-center gap-2">
                    <span className="px-3 py-1 bg-gray-100 rounded-full text-xs font-medium text-gray-600 uppercase tracking-wide">{currentRole} Mode</span>
                </div>
            </div>

            <div className="p-4 space-y-4 -mt-6">
                {/* Role Switching */}
                <Card className="p-4">
                    <h3 className="font-bold text-sm mb-3 text-gray-900">Switch Role</h3>
                    <div className="grid grid-cols-2 gap-2">
                        <Button 
                            variant={currentRole === 'buyer' ? 'primary' : 'outline'} 
                            fullWidth 
                            size="sm"
                            onClick={() => { switchRole('buyer'); navigate('/buyer/dashboard'); }}
                        >
                            Buyer
                        </Button>
                        {currentUser.roles.includes('vendor') ? (
                            <Button 
                                variant={currentRole === 'vendor' ? 'primary' : 'outline'} 
                                fullWidth 
                                size="sm"
                                onClick={() => { switchRole('vendor'); navigate('/vendor/dashboard'); }}
                            >
                                Vendor
                            </Button>
                        ) : (
                            <Button variant="outline" fullWidth size="sm" onClick={() => navigate('/vendor/onboarding')}>Become Vendor</Button>
                        )}

                        {/* Delivery Role Switch */}
                        {isDeliveryApproved && (
                             <Button 
                                variant={currentRole === 'deliveryPerson' ? 'primary' : 'outline'} 
                                fullWidth 
                                size="sm"
                                className="col-span-2"
                                onClick={() => { switchRole('deliveryPerson'); navigate('/delivery/dashboard'); }}
                            >
                                Delivery Dashboard
                            </Button>
                        )}
                    </div>
                </Card>

                {/* Notification Settings (For Vendors) */}
                {currentRole === 'vendor' && (
                    <Card className="p-4">
                         <h3 className="font-bold text-sm mb-3 text-gray-900">Notifications</h3>
                         <div className="space-y-3">
                             <div className="flex items-center justify-between">
                                 <div>
                                     <p className="text-sm font-bold text-gray-700">Push Alerts</p>
                                     <p className="text-xs text-gray-400">Get notified on device</p>
                                 </div>
                                 <div 
                                    onClick={handlePushToggle}
                                    className={`w-10 h-5 rounded-full relative transition-colors cursor-pointer ${pushEnabled ? 'bg-green-500' : 'bg-gray-300'}`}
                                 >
                                     <div className={`absolute top-0.5 w-4 h-4 bg-white rounded-full shadow-sm transition-transform ${pushEnabled ? 'left-5' : 'left-0.5'}`}></div>
                                 </div>
                             </div>
                             <div className="flex items-center justify-between">
                                 <div>
                                     <p className="text-sm font-bold text-gray-700">SMS Alerts</p>
                                     <p className="text-xs text-gray-400">Send text to phone</p>
                                 </div>
                                 <div 
                                    onClick={handleSmsToggle}
                                    className={`w-10 h-5 rounded-full relative transition-colors cursor-pointer ${smsEnabled ? 'bg-green-500' : 'bg-gray-300'}`}
                                 >
                                     <div className={`absolute top-0.5 w-4 h-4 bg-white rounded-full shadow-sm transition-transform ${smsEnabled ? 'left-5' : 'left-0.5'}`}></div>
                                 </div>
                             </div>
                         </div>
                    </Card>
                )}

                {/* Order History Preview */}
                {currentRole === 'buyer' && (
                    <Card className="p-4">
                         <div className="flex justify-between items-center mb-3 border-b border-gray-50 pb-2">
                            <h3 className="font-bold text-sm text-gray-900">Recent Orders</h3>
                            <button className="text-primary text-xs font-bold bg-primary/5 px-2 py-1 rounded hover:bg-primary/10 transition-colors" onClick={() => navigate('/buyer/orders')}>View All</button>
                         </div>
                         <div className="space-y-1">
                             {myOrders.slice(0, 3).map(o => (
                                 <div key={o.id} className="flex items-center justify-between py-2 border-b border-dashed border-gray-100 last:border-0 hover:bg-gray-50 -mx-2 px-2 rounded-lg transition-colors cursor-pointer" onClick={() => navigate('/buyer/orders')}>
                                     <div>
                                         <div className="flex items-center gap-2 mb-1">
                                             <span className="font-bold text-sm text-gray-800">#{o.id.slice(-5)}</span>
                                             <span className="text-[10px] text-gray-400 bg-gray-100 px-1.5 py-0.5 rounded">{new Date(o.createdAt).toLocaleDateString()}</span>
                                         </div>
                                         <p className="text-xs text-gray-500">{o.items.length} items • {o.deliveryOption}</p>
                                     </div>
                                     <div className="text-right">
                                         <p className="font-bold text-sm text-gray-900">₵{o.total.toFixed(2)}</p>
                                         <span className={`text-[10px] font-bold uppercase ${o.status === 'delivered' ? 'text-green-600' : 'text-blue-600'}`}>{o.status.replace('_', ' ')}</span>
                                     </div>
                                 </div>
                             ))}
                             {myOrders.length === 0 && <p className="text-sm text-center text-gray-400 py-4">No past orders found.</p>}
                         </div>
                    </Card>
                )}

                {/* Delivery Registration */}
                {!isDeliveryApproved && (
                    <Card className="p-4">
                        <h3 className="font-bold text-sm mb-2 text-gray-900">Delivery Opportunities</h3>
                        {isDeliveryPending ? (
                            <div className="bg-yellow-50 text-yellow-700 p-3 rounded-xl text-sm font-medium flex items-center gap-2">
                                <i className="fa-solid fa-clock"></i> Application Pending
                            </div>
                        ) : !showDeliveryForm ? (
                            <div onClick={() => setShowDeliveryForm(true)} className="flex items-center justify-between cursor-pointer py-2 hover:bg-gray-50 rounded px-2 -mx-2 transition-colors">
                                <span className="text-sm text-gray-600">Register as Delivery Person</span>
                                <i className="fa-solid fa-chevron-right text-gray-400 text-xs"></i>
                            </div>
                        ) : (
                            <form onSubmit={handleDeliverySubmit} className="mt-2 space-y-3">
                                <Input 
                                    placeholder="Full Legal Name" 
                                    value={deliveryForm.fullName}
                                    onChange={e => setDeliveryForm({...deliveryForm, fullName: e.target.value})}
                                    required
                                />
                                <select 
                                    className="block w-full rounded-lg border-gray-300 border bg-white py-2 px-3 text-sm"
                                    value={deliveryForm.vehicleType}
                                    onChange={e => setDeliveryForm({...deliveryForm, vehicleType: e.target.value})}
                                >
                                    <option value="bicycle">Bicycle</option>
                                    <option value="motorbike">Motorbike</option>
                                    <option value="scooter">Scooter</option>
                                </select>
                                <div className="flex gap-2">
                                    <Button type="submit" size="sm" fullWidth>Submit</Button>
                                    <Button type="button" variant="ghost" size="sm" onClick={() => setShowDeliveryForm(false)}>Cancel</Button>
                                </div>
                            </form>
                        )}
                    </Card>
                )}

                <Button variant="danger" fullWidth onClick={() => { logout(); navigate('/'); }}>Log Out</Button>
            </div>
        </div>
    );
};

export const OrdersPage: React.FC = () => {
    const { orders, currentUser } = useApp();
    const navigate = useNavigate();
    const myOrders = orders
        .filter(o => o.buyerId === currentUser?.id)
        .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

    // Helper for Stepper
    const getStepStatus = (current: string, step: string) => {
        const steps = ['placed', 'received', 'in_route', 'delivered'];
        const cIdx = steps.indexOf(current);
        const sIdx = steps.indexOf(step);
        return cIdx >= sIdx ? 'text-primary font-bold' : 'text-gray-300';
    };

    return (
        <div className="min-h-screen bg-gray-50 p-4 pb-24">
            <div className="flex items-center mb-6">
                <button onClick={() => navigate(-1)} className="mr-4 w-8 h-8 bg-white rounded-full shadow-sm flex items-center justify-center"><i className="fa-solid fa-arrow-left"></i></button>
                <h1 className="text-xl font-bold">My Orders</h1>
            </div>

            <div className="space-y-6">
                {myOrders.map(order => (
                    <Card key={order.id} className="p-5">
                        <div className="flex justify-between items-start mb-4">
                            <div>
                                <div className="flex items-center gap-2">
                                    <span className="font-bold text-gray-900">#{order.id.slice(-5)}</span>
                                    <span className="text-xs text-gray-400 bg-gray-50 px-1.5 py-0.5 rounded">{new Date(order.createdAt).toLocaleDateString()}</span>
                                </div>
                                <p className="font-bold text-lg mt-1 text-primary">₵{order.total.toFixed(2)}</p>
                            </div>
                            <Badge color={order.deliveryOption === 'delivery' ? 'blue' : 'yellow'}>
                                {order.deliveryOption}
                            </Badge>
                        </div>

                        {/* Simplified Stepper */}
                        <div className="flex justify-between text-[10px] sm:text-xs mb-5 relative mt-2">
                            {/* Line */}
                            <div className="absolute top-2 left-2 right-2 h-0.5 bg-gray-100 -z-10"></div>
                            
                            <div className={`flex flex-col items-center bg-white px-1 ${getStepStatus(order.status, 'placed')}`}>
                                <i className={`fa-solid fa-circle-check mb-1 text-sm ${getStepStatus(order.status, 'placed').includes('primary') ? 'text-primary' : 'text-gray-200'}`}></i> Placed
                            </div>
                             <div className={`flex flex-col items-center bg-white px-1 ${getStepStatus(order.status, 'received')}`}>
                                <i className={`fa-solid fa-store mb-1 text-sm ${getStepStatus(order.status, 'received').includes('primary') ? 'text-primary' : 'text-gray-200'}`}></i> Received
                            </div>
                             <div className={`flex flex-col items-center bg-white px-1 ${getStepStatus(order.status, 'in_route')}`}>
                                <i className={`fa-solid fa-truck mb-1 text-sm ${getStepStatus(order.status, 'in_route').includes('primary') ? 'text-primary' : 'text-gray-200'}`}></i> In Route
                            </div>
                             <div className={`flex flex-col items-center bg-white px-1 ${getStepStatus(order.status, 'delivered')}`}>
                                <i className={`fa-solid fa-box-open mb-1 text-sm ${getStepStatus(order.status, 'delivered').includes('primary') ? 'text-primary' : 'text-gray-200'}`}></i> Delivered
                            </div>
                        </div>

                        <div className="bg-gray-50/80 p-3 rounded-xl text-xs text-gray-600 space-y-2 border border-gray-100">
                            {order.items.map((i, idx) => (
                                <div key={idx} className="flex justify-between items-center">
                                    <span className="font-medium">{i.product.title} <span className="text-gray-400">x{i.quantity}</span></span>
                                    <span className="font-bold text-gray-900">₵{(i.product.price * i.quantity).toFixed(2)}</span>
                                </div>
                            ))}
                        </div>
                    </Card>
                ))}
                {myOrders.length === 0 && (
                     <div className="text-center py-20 text-gray-400">
                        <i className="fa-solid fa-receipt text-4xl mb-4 opacity-30"></i>
                        <p>You haven't placed any orders yet.</p>
                        <Button size="sm" className="mt-4" onClick={() => navigate('/buyer/dashboard')}>Start Shopping</Button>
                    </div>
                )}
            </div>
        </div>
    );
};

export const WishlistPage: React.FC = () => {
    const { favorites, products, toggleFavorite, addToCart, vendors } = useApp();
    const navigate = useNavigate();
    
    const favProducts = products.filter(p => favorites.includes(p.id));

    return (
        <div className="min-h-screen bg-gray-50 p-4 pb-24">
             <div className="flex items-center mb-6">
                <button onClick={() => navigate(-1)} className="mr-4 w-8 h-8 bg-white rounded-full shadow-sm flex items-center justify-center"><i className="fa-solid fa-arrow-left"></i></button>
                <h1 className="text-xl font-bold">My Wishlist</h1>
                <span className="ml-2 text-sm text-gray-500 bg-white px-2 py-0.5 rounded-full border border-gray-200">{favProducts.length}</span>
            </div>

            {favProducts.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-20 text-center">
                    <div className="w-20 h-20 bg-white rounded-full flex items-center justify-center mb-4 shadow-sm">
                        <i className="fa-regular fa-heart text-3xl text-gray-300"></i>
                    </div>
                    <h2 className="text-gray-900 font-bold text-lg">Your wishlist is empty</h2>
                    <p className="text-gray-500 text-sm mt-2 max-w-xs mx-auto">Tap the heart icon on products you like to save them for later.</p>
                    <Button className="mt-6" onClick={() => navigate('/buyer/dashboard')}>Explore Products</Button>
                </div>
            ) : (
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
                    {favProducts.map(product => {
                         const vendor = vendors.find(v => v.vendorId === product.vendorId);
                         return (
                            <div 
                                key={product.id} 
                                className="bg-white rounded-2xl overflow-hidden shadow-card border border-gray-100 hover:shadow-xl transition-all duration-300 group relative flex flex-col h-full cursor-pointer"
                                onClick={() => navigate(`/buyer/product/${product.id}`)}
                            >
                                {/* Image - Fills large space */}
                                <div className="aspect-[4/5] w-full relative overflow-hidden">
                                    <img 
                                        src={product.images[0] || 'https://via.placeholder.com/300'} 
                                        alt={product.title} 
                                        className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110" 
                                    />
                                    
                                    {/* Remove Fav Button */}
                                    <button 
                                        className="absolute top-2 right-2 z-10 w-7 h-7 rounded-full bg-white border border-red-100 text-red-500 flex items-center justify-center transition-colors shadow-sm active:scale-90 hover:bg-red-50"
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            toggleFavorite(product.id);
                                        }}
                                    >
                                        <i className="fa-solid fa-heart text-xs"></i>
                                    </button>
    
                                    {product.stock === 0 && <div className="absolute inset-0 bg-black/40 flex items-center justify-center z-10"><span className="bg-black/80 text-white text-[10px] px-3 py-1 rounded font-bold uppercase tracking-wide">Out of Stock</span></div>}
                                </div>
    
                                {/* Bottom Details */}
                                <div className="p-3 bg-white flex flex-col justify-between flex-grow relative z-10">
                                    <div>
                                        <h3 className="text-xs text-gray-800 font-bold leading-tight line-clamp-2 mb-1">{product.title}</h3>
                                        <p className="text-[10px] text-gray-400 line-clamp-1">{vendor?.storeName}</p>
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
                         );
                    })}
                </div>
            )}
        </div>
    );
};
