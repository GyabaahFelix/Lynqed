
import React, { useState } from 'react';
import { useApp } from '../context';
import { Button, Card, Badge } from '../components/UI';

export const DeliveryDashboard: React.FC = () => {
    const { orders, currentUser, assignDelivery, updateOrderStatus, refreshData } = useApp();
    const [activeTab, setActiveTab] = useState<'available' | 'active' | 'history'>('available');

    // 1. Available Jobs: Orders that are "received" (accepted by vendor) AND "delivery" option AND no driver yet
    const availableJobs = orders.filter(o => 
        o.status === 'received' && 
        o.deliveryOption === 'delivery' && 
        !o.deliveryPersonId
    );

    // 2. Active Deliveries: Assigned to ME and IN ROUTE
    const myActiveDeliveries = orders.filter(o => 
        o.deliveryPersonId === currentUser?.id && 
        o.status === 'in_route'
    );

    // 3. History: Assigned to ME and DELIVERED
    const myHistory = orders.filter(o => 
        o.deliveryPersonId === currentUser?.id && 
        o.status === 'delivered'
    );

    const totalEarnings = myHistory.length * 10; // ₵10 per delivery

    return (
        <div className="min-h-screen bg-gray-50 pb-24 animate-fade-in pb-safe">
            <div className="bg-blue-600 p-6 text-white rounded-b-3xl shadow-lg mb-6">
                <div className="flex justify-between items-center mb-4">
                    <h1 className="text-2xl font-display font-bold">Delivery Hub</h1>
                    <div className="bg-blue-500/50 px-3 py-1 rounded-full text-xs font-bold">
                        {currentUser?.name}
                    </div>
                </div>
                <div className="flex justify-between items-end">
                    <div>
                        <p className="text-blue-200 text-xs font-bold uppercase tracking-wider mb-1">Total Earnings</p>
                        <p className="text-3xl font-bold">₵{totalEarnings.toFixed(2)}</p>
                    </div>
                    <div className="text-right">
                        <p className="text-blue-200 text-xs font-bold uppercase tracking-wider mb-1">Completed</p>
                        <p className="text-xl font-bold">{myHistory.length} Jobs</p>
                    </div>
                </div>
            </div>

            <div className="px-4">
                {/* Tabs */}
                <div className="flex bg-white p-1 rounded-xl shadow-sm mb-4 border border-gray-100">
                    <button 
                        onClick={() => setActiveTab('available')}
                        className={`flex-1 py-2 text-xs font-bold rounded-lg transition-all ${activeTab === 'available' ? 'bg-blue-50 text-blue-600' : 'text-gray-400'}`}
                    >
                        Available ({availableJobs.length})
                    </button>
                    <button 
                        onClick={() => setActiveTab('active')}
                        className={`flex-1 py-2 text-xs font-bold rounded-lg transition-all ${activeTab === 'active' ? 'bg-blue-50 text-blue-600' : 'text-gray-400'}`}
                    >
                        Active ({myActiveDeliveries.length})
                    </button>
                    <button 
                        onClick={() => setActiveTab('history')}
                        className={`flex-1 py-2 text-xs font-bold rounded-lg transition-all ${activeTab === 'history' ? 'bg-blue-50 text-blue-600' : 'text-gray-400'}`}
                    >
                        History
                    </button>
                </div>

                <div className="space-y-4">
                    {/* Render List based on Tab */}
                    {activeTab === 'available' && (
                        availableJobs.length === 0 ? (
                            <div className="text-center py-10 text-gray-400">
                                <i className="fa-solid fa-map-location-dot text-3xl mb-3 opacity-30"></i>
                                <p>No new delivery jobs available.</p>
                                <Button size="sm" variant="ghost" className="mt-2" onClick={refreshData}>Refresh</Button>
                            </div>
                        ) : (
                            availableJobs.map(job => (
                                <Card key={job.id} className="p-4 border-l-4 border-l-green-500">
                                    <div className="flex justify-between items-start mb-2">
                                        <Badge color="green">New Job</Badge>
                                        <span className="font-bold text-gray-900">₵10.00</span>
                                    </div>
                                    <h3 className="font-bold text-gray-800 text-sm mb-1">Pickup: Vendor #{job.vendorId.slice(-4)}</h3>
                                    <p className="text-xs text-gray-500 mb-3">Deliver to: Customer</p>
                                    <div className="flex justify-between items-center bg-gray-50 p-2 rounded-lg mb-3">
                                        <span className="text-xs font-medium text-gray-600">{job.items.length} items</span>
                                        <span className="text-xs font-medium text-gray-600">Total Order: ₵{job.total}</span>
                                    </div>
                                    <Button fullWidth size="sm" onClick={() => assignDelivery(job.id)}>Accept Job</Button>
                                </Card>
                            ))
                        )
                    )}

                    {activeTab === 'active' && (
                         myActiveDeliveries.length === 0 ? (
                            <div className="text-center py-10 text-gray-400">
                                <p>You have no active deliveries.</p>
                            </div>
                        ) : (
                            myActiveDeliveries.map(job => (
                                <Card key={job.id} className="p-4 border-l-4 border-l-blue-500">
                                    <div className="flex justify-between mb-2">
                                        <Badge color="blue">In Progress</Badge>
                                        <span className="font-bold text-gray-900">#{job.id.slice(-4)}</span>
                                    </div>
                                    <p className="text-sm text-gray-600 mb-4">You are delivering this order.</p>
                                    <Button fullWidth variant="success" size="sm" onClick={() => updateOrderStatus(job.id, 'delivered')}>
                                        Mark Delivered
                                    </Button>
                                </Card>
                            ))
                        )
                    )}
                    
                    {activeTab === 'history' && (
                         myHistory.length === 0 ? (
                            <div className="text-center py-10 text-gray-400">
                                <p>No history yet.</p>
                            </div>
                        ) : (
                            myHistory.map(job => (
                                <div key={job.id} className="bg-white p-3 rounded-xl border border-gray-100 flex justify-between items-center opacity-70">
                                    <div>
                                        <p className="text-xs font-bold text-gray-700">Order #{job.id.slice(-4)}</p>
                                        <p className="text-[10px] text-gray-400">{new Date(job.createdAt).toLocaleDateString()}</p>
                                    </div>
                                    <span className="text-sm font-bold text-green-600">+₵10.00</span>
                                </div>
                            ))
                        )
                    )}
                </div>
            </div>
        </div>
    );
};
