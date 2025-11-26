
import React, { useState } from 'react';
import { useApp } from '../context';
import { Button, Card, Badge } from '../components/UI';

export const DeliveryDashboard: React.FC = () => {
    const { orders, currentUser, assignDelivery, updateOrderStatus, refreshData, deliveryPersons } = useApp();
    const [activeTab, setActiveTab] = useState<'available' | 'active' | 'history'>('available');

    // Get current rider profile
    const me = deliveryPersons.find(d => d.userId === currentUser?.id);
    
    if (!me || me.status !== 'approved') return (
        <div className="min-h-screen flex items-center justify-center bg-gray-50 p-6 text-center">
            <div>
                <i className="fa-solid fa-clock text-4xl text-yellow-500 mb-4"></i>
                <h2 className="text-xl font-bold text-gray-900">Account Pending</h2>
                <p className="text-gray-500 mt-2">Your delivery application is under review by admin.</p>
            </div>
        </div>
    );

    // 1. Available: Ready for pickup AND delivery option AND unassigned
    const availableJobs = orders.filter(o => 
        o.status === 'ready_for_pickup' && 
        o.deliveryOption === 'delivery' && 
        !o.deliveryPersonId
    );

    // 2. Active: Assigned to ME and NOT delivered
    const myActiveDeliveries = orders.filter(o => 
        o.deliveryPersonId === currentUser?.id && 
        o.status !== 'delivered' && o.status !== 'cancelled'
    );

    // 3. History
    const myHistory = orders.filter(o => 
        o.deliveryPersonId === currentUser?.id && 
        o.status === 'delivered'
    );

    const totalEarnings = myHistory.length * 10; // ₵10 flat rate for MVP

    const getNextStep = (status: string) => {
        if (status === 'assigned') return { label: 'Confirm Pickup', next: 'picked_up', icon: 'box-open' };
        if (status === 'picked_up') return { label: 'Start Route', next: 'in_route', icon: 'route' };
        if (status === 'in_route') return { label: 'Mark Delivered', next: 'delivered', icon: 'flag-checkered' };
        return null;
    };

    return (
        <div className="min-h-screen bg-gray-50 pb-24 animate-fade-in pb-safe">
            {/* Header */}
            <div className="bg-blue-600 p-6 text-white rounded-b-3xl shadow-lg mb-6 sticky top-0 z-10">
                <div className="flex justify-between items-center mb-4">
                    <h1 className="text-2xl font-display font-bold">Delivery Hub</h1>
                    <div className="flex items-center gap-2">
                        <span className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></span>
                        <span className="text-xs font-bold uppercase tracking-wider">Online</span>
                    </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                    <div className="bg-blue-500/30 p-3 rounded-xl backdrop-blur-sm">
                        <p className="text-blue-100 text-[10px] font-bold uppercase">Earnings</p>
                        <p className="text-2xl font-bold">₵{totalEarnings.toFixed(2)}</p>
                    </div>
                    <div className="bg-blue-500/30 p-3 rounded-xl backdrop-blur-sm">
                        <p className="text-blue-100 text-[10px] font-bold uppercase">Completed</p>
                        <p className="text-2xl font-bold">{myHistory.length}</p>
                    </div>
                </div>
            </div>

            <div className="px-4">
                {/* Tabs */}
                <div className="flex bg-white p-1 rounded-xl shadow-sm mb-6 border border-gray-100 sticky top-40 z-10">
                    <button onClick={() => setActiveTab('available')} className={`flex-1 py-2 text-xs font-bold rounded-lg transition-all ${activeTab === 'available' ? 'bg-blue-50 text-blue-600' : 'text-gray-400'}`}>New Jobs ({availableJobs.length})</button>
                    <button onClick={() => setActiveTab('active')} className={`flex-1 py-2 text-xs font-bold rounded-lg transition-all ${activeTab === 'active' ? 'bg-blue-50 text-blue-600' : 'text-gray-400'}`}>Active ({myActiveDeliveries.length})</button>
                    <button onClick={() => setActiveTab('history')} className={`flex-1 py-2 text-xs font-bold rounded-lg transition-all ${activeTab === 'history' ? 'bg-blue-50 text-blue-600' : 'text-gray-400'}`}>History</button>
                </div>

                <div className="space-y-4">
                    {/* AVAILABLE */}
                    {activeTab === 'available' && (
                        availableJobs.length === 0 ? (
                            <div className="text-center py-10 text-gray-400">
                                <i className="fa-solid fa-map-location-dot text-4xl mb-4 opacity-20"></i>
                                <p>No orders ready for pickup.</p>
                                <Button size="sm" variant="ghost" onClick={refreshData} className="mt-4">Refresh</Button>
                            </div>
                        ) : (
                            availableJobs.map(job => (
                                <Card key={job.id} className="p-0 overflow-hidden border-l-4 border-l-green-500">
                                    <div className="p-4 bg-white">
                                        <div className="flex justify-between items-start mb-2">
                                            <Badge color="green">Ready for Pickup</Badge>
                                            <span className="font-bold text-lg text-green-600">₵10.00</span>
                                        </div>
                                        <div className="flex items-start gap-3 mt-3">
                                            <div className="flex flex-col items-center gap-1 mt-1">
                                                <div className="w-2 h-2 rounded-full bg-blue-500"></div>
                                                <div className="w-0.5 h-8 bg-gray-200"></div>
                                                <div className="w-2 h-2 rounded-full bg-red-500"></div>
                                            </div>
                                            <div className="flex-1 space-y-4">
                                                <div>
                                                    <p className="text-xs text-gray-400 uppercase font-bold">Pickup</p>
                                                    <p className="text-sm font-bold text-gray-800">Vendor #{job.vendorId.slice(-4)}</p>
                                                </div>
                                                <div>
                                                    <p className="text-xs text-gray-400 uppercase font-bold">Dropoff</p>
                                                    <p className="text-sm font-bold text-gray-800">Customer Location</p>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                    <div className="bg-gray-50 p-3 border-t border-gray-100">
                                        <Button fullWidth onClick={() => assignDelivery(job.id)}>Accept Job</Button>
                                    </div>
                                </Card>
                            ))
                        )
                    )}

                    {/* ACTIVE */}
                    {activeTab === 'active' && (
                        myActiveDeliveries.length === 0 ? (
                            <div className="text-center py-10 text-gray-400">
                                <p>You have no active deliveries.</p>
                            </div>
                        ) : (
                            myActiveDeliveries.map(job => {
                                const step = getNextStep(job.status);
                                return (
                                    <Card key={job.id} className="p-5 border-2 border-blue-500 shadow-xl">
                                        <div className="flex justify-between mb-4 border-b border-gray-100 pb-2">
                                            <span className="font-bold text-gray-900">Order #{job.id.slice(-4)}</span>
                                            <Badge color="blue">{job.status.replace('_', ' ')}</Badge>
                                        </div>
                                        
                                        {/* Mock Map Placeholder */}
                                        <div className="h-32 bg-gray-200 rounded-xl mb-4 flex items-center justify-center relative overflow-hidden">
                                            <div className="absolute inset-0 opacity-20 bg-[url('https://upload.wikimedia.org/wikipedia/commons/e/ec/World_map_blank_without_borders.svg')] bg-cover"></div>
                                            <i className="fa-solid fa-location-arrow text-blue-500 text-3xl animate-pulse"></i>
                                            <p className="absolute bottom-2 left-2 bg-white/80 px-2 py-1 rounded text-[10px] font-bold">GPS Tracking Active</p>
                                        </div>

                                        {step && (
                                            <Button 
                                                fullWidth 
                                                size="lg" 
                                                onClick={() => updateOrderStatus(job.id, step.next as any)} 
                                                className="shadow-lg shadow-blue-500/30"
                                                icon={step.icon}
                                            >
                                                {step.label}
                                            </Button>
                                        )}
                                    </Card>
                                );
                            })
                        )
                    )}
                </div>
            </div>
        </div>
    );
};
