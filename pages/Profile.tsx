
import React, { useState } from 'react';
import { useApp } from '../context';
import { Button, Card, Input, Badge } from '../components/UI';
import { useNavigate } from 'react-router-dom';

export const UserProfile: React.FC = () => {
    const { currentUser, currentRole, logout, switchRole, registerDeliveryPerson, orders } = useApp();
    const navigate = useNavigate();
    const [showDeliveryForm, setShowDeliveryForm] = useState(false);
    const [deliveryForm, setDeliveryForm] = useState({ fullName: '', vehicleType: 'bicycle' });

    if (!currentUser) return <div>Please login</div>;

    const handleDeliverySubmit = (e: React.FormEvent) => {
        e.preventDefault();
        registerDeliveryPerson(deliveryForm);
        setShowDeliveryForm(false);
        alert("Registration submitted! Wait for admin approval.");
    };

    // Filter orders for this user
    // Sort by date descending (newest first)
    const myOrders = orders
        .filter(o => o.buyerId === currentUser.id)
        .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

    return (
        <div className="min-h-screen bg-gray-50 pb-24">
            <div className="bg-white p-6 pb-10 rounded-b-3xl shadow-sm text-center">
                <img src={currentUser.avatarUrl} className="w-24 h-24 rounded-full mx-auto mb-4 border-4 border-blue-50" />
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
                    <div className="flex gap-2">
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
                    </div>
                </Card>

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
                                <option value="scooter">Scooter</option>
                            </select>
                            <div className="flex gap-2">
                                <Button type="submit" size="sm" fullWidth>Submit</Button>
                                <Button type="button" variant="ghost" size="sm" onClick={() => setShowDeliveryForm(false)}>Cancel</Button>
                            </div>
                        </form>
                    )}
                </Card>

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
