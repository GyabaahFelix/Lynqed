import React, { useState } from 'react';
import { useApp } from '../context';
import { Button, Card, Input, Badge, Avatar } from '../components/UI';
import { useNavigate } from 'react-router-dom';

const BuyerSettings: React.FC = () => {
    const { currentUser } = useApp();
    const [name, setName] = useState(currentUser?.name || '');
    const [email, setEmail] = useState(currentUser?.email || '');

    return (
        <Card className="p-4">
            <h3 className="font-bold text-sm mb-3 text-gray-900">Personal Settings</h3>
            <Input label="Full Name" value={name} onChange={e => setName(e.target.value)} />
            <Input label="Email" value={email} disabled className="opacity-50" />
            <Button size="sm" fullWidth>Update Profile</Button>
        </Card>
    );
};

const VendorSettings: React.FC = () => {
    const { currentUser, vendors } = useApp();
    const currentVendor = vendors.find(v => v.userId === currentUser?.id);
    
    const [storeName, setStoreName] = useState(currentVendor?.storeName || '');
    const [desc, setDesc] = useState(currentVendor?.storeDescription || '');
    const [phone, setPhone] = useState(currentVendor?.contactPhone || '');

    if (!currentVendor) return null;

    return (
        <Card className="p-4">
            <h3 className="font-bold text-sm mb-3 text-gray-900">Store Settings</h3>
            <Input label="Store Name" value={storeName} onChange={e => setStoreName(e.target.value)} />
            <Input label="Description" value={desc} onChange={e => setDesc(e.target.value)} />
            <Input label="Business Phone" value={phone} onChange={e => setPhone(e.target.value)} />
            <Button size="sm" fullWidth>Save Changes</Button>
        </Card>
    );
};

export const UserProfile: React.FC = () => {
    const { currentUser, currentRole, logout, switchRole, registerDeliveryPerson, orders, deliveryPersons, requestNotificationPermission } = useApp();
    const navigate = useNavigate();
    const [showDeliveryForm, setShowDeliveryForm] = useState(false);
    const [deliveryForm, setDeliveryForm] = useState({ fullName: '', vehicleType: 'bicycle' });
    const [smsEnabled, setSmsEnabled] = useState(false);
    const [pushEnabled, setPushEnabled] = useState(false);

    if (!currentUser) return <div>Please login</div>;

    const handleDeliverySubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        const result = await registerDeliveryPerson(deliveryForm);
        if (result.success) {
             setShowDeliveryForm(false);
             alert("Registration submitted! Wait for admin approval.");
        }
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

    const myOrders = orders
        .filter(o => o.buyerId === currentUser.id)
        .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

    const deliveryProfile = deliveryPersons.find(d => d.userId === currentUser.id);
    const isDeliveryApproved = deliveryProfile?.status === 'approved';

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
                    <span className={`px-3 py-1 rounded-full text-xs font-medium uppercase tracking-wide ${currentRole === 'vendor' ? 'bg-pink-100 text-pink-700' : 'bg-gray-100 text-gray-600'}`}>
                        {currentRole} Mode
                    </span>
                </div>
            </div>

            <div className="p-4 space-y-4 -mt-6">
                
                {/* DYNAMIC SETTINGS BASED ON ROLE */}
                {currentRole === 'vendor' ? <VendorSettings /> : <BuyerSettings />}

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

                {/* Vendor Notification Settings */}
                {currentRole === 'vendor' && (
                    <Card className="p-4">
                         <h3 className="font-bold text-sm mb-3 text-gray-900">Notifications</h3>
                         <div className="flex items-center justify-between">
                             <div>
                                 <p className="text-sm font-bold text-gray-700">Push Alerts</p>
                                 <p className="text-xs text-gray-400">Sound & Screen Popup</p>
                             </div>
                             <div 
                                onClick={handlePushToggle}
                                className={`w-10 h-5 rounded-full relative transition-colors cursor-pointer ${pushEnabled ? 'bg-green-500' : 'bg-gray-300'}`}
                             >
                                 <div className={`absolute top-0.5 w-4 h-4 bg-white rounded-full shadow-sm transition-transform ${pushEnabled ? 'left-5' : 'left-0.5'}`}></div>
                             </div>
                         </div>
                    </Card>
                )}

                {/* Buyer Recent Orders */}
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
                                     </div>
                                     <span className={`text-[10px] font-bold uppercase ${o.status === 'delivered' ? 'text-green-600' : 'text-blue-600'}`}>{o.status.replace('_', ' ')}</span>
                                 </div>
                             ))}
                             {myOrders.length === 0 && <p className="text-sm text-center text-gray-400 py-4">No past orders found.</p>}
                         </div>
                    </Card>
                )}

                {/* Delivery Registration */}
                {(!isDeliveryApproved && currentRole === 'buyer') && (
                    <Card className="p-4">
                        <h3 className="font-bold text-sm mb-2 text-gray-900">Delivery Opportunities</h3>
                        {!showDeliveryForm ? (
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
    const myOrders = orders.filter(o => o.buyerId === currentUser?.id);
    return (
        <div className="min-h-screen bg-gray-50 p-4 pb-24">
            <div className="flex items-center mb-6">
                <button onClick={() => navigate(-1)} className="mr-4 w-8 h-8 bg-white rounded-full shadow-sm flex items-center justify-center"><i className="fa-solid fa-arrow-left"></i></button>
                <h1 className="text-xl font-bold">My Orders</h1>
            </div>
            
            <div className="space-y-4">
                {myOrders.length === 0 ? <p className="text-center text-gray-400 py-10">No orders found.</p> : (
                    myOrders.map(o => (
                        <Card key={o.id} className="p-4">
                            <div className="flex justify-between items-start mb-2">
                                <span className="font-bold text-gray-900">#{o.id.slice(-5)}</span>
                                <Badge color="blue">{o.status}</Badge>
                            </div>
                            <div className="text-sm text-gray-600">
                                {o.items.map((i, idx) => <div key={idx}>{i.quantity}x {i.product.title}</div>)}
                            </div>
                            <div className="mt-3 pt-3 border-t border-gray-50 flex justify-between items-center">
                                <span className="text-xs text-gray-400">{new Date(o.createdAt).toLocaleDateString()}</span>
                                <span className="font-bold text-gray-900">₵{o.total.toFixed(2)}</span>
                            </div>
                        </Card>
                    ))
                )}
            </div>
        </div>
    )
};

export const WishlistPage: React.FC = () => {
    const { favorites, products, toggleFavorite, addToCart } = useApp();
    const navigate = useNavigate();
    
    // Filter products that are in the favorites list
    const wishlistItems = products.filter(p => favorites.includes(p.id));

    return (
        <div className="min-h-screen bg-gray-50 pb-24">
            {/* Header */}
            <div className="bg-white p-4 shadow-sm sticky top-0 z-10 flex items-center gap-3">
                <button onClick={() => navigate(-1)} className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-gray-100">
                    <i className="fa-solid fa-arrow-left"></i>
                </button>
                <h1 className="text-xl font-bold font-display">My Wishlist ({favorites.length})</h1>
            </div>

            <div className="p-4 grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
                {wishlistItems.length === 0 ? (
                    <div className="col-span-full text-center py-20 text-gray-400">
                        <i className="fa-regular fa-heart text-4xl mb-4 opacity-20"></i>
                        <p>Your wishlist is empty.</p>
                        <Button className="mt-4" onClick={() => navigate('/buyer/dashboard')}>Start Exploring</Button>
                    </div>
                ) : (
                    wishlistItems.map(product => (
                        <div key={product.id} className="bg-white rounded-2xl overflow-hidden shadow-card border border-gray-100 group relative flex flex-col h-full">
                            <div className="aspect-square w-full relative overflow-hidden bg-gray-50">
                                <img 
                                    src={product.images[0]} 
                                    alt={product.title} 
                                    className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105" 
                                    onClick={() => navigate(`/buyer/product/${product.id}`)}
                                />
                                <button 
                                    className="absolute top-2 right-2 z-10 w-7 h-7 rounded-full bg-white/90 text-red-500 flex items-center justify-center shadow-sm active:scale-90"
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        toggleFavorite(product.id);
                                    }}
                                >
                                    <i className="fa-solid fa-trash text-xs"></i>
                                </button>
                            </div>
                            <div className="p-3 flex flex-col flex-grow justify-between">
                                <h3 className="text-xs font-bold text-gray-800 line-clamp-2 mb-1">{product.title}</h3>
                                <div className="flex items-center justify-between mt-1">
                                    <span className="text-sm font-extrabold text-gray-900">{product.currency}{product.price.toFixed(2)}</span>
                                    <button 
                                        className="w-7 h-7 rounded-full bg-black text-white flex items-center justify-center shadow-md active:scale-90 hover:bg-primary transition-colors"
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            addToCart(product);
                                        }}
                                        disabled={product.stock === 0}
                                    >
                                        <i className="fa-solid fa-plus text-xs"></i>
                                    </button>
                                </div>
                            </div>
                        </div>
                    ))
                )}
            </div>
        </div>
    );
};