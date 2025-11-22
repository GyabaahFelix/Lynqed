
import React, { useState } from 'react';
import { useApp } from '../context';
import { Button, Badge, Card } from '../components/UI';
import { useNavigate } from 'react-router-dom';

export const AdminDashboard: React.FC = () => {
  const { products, updateProductStatus, deleteProduct, deliveryPersons, approveDeliveryPerson, logout } = useApp();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<'pending' | 'approved' | 'rejected' | 'all'>('pending');
  const [deleteId, setDeleteId] = useState<string | null>(null);

  const filteredProducts = products.filter(p => {
      if (activeTab === 'all') return true;
      return p.status === activeTab;
  });

  const pendingDelivery = deliveryPersons.filter(d => d.status === 'pending');

  const handleStatusUpdate = (e: React.MouseEvent, id: string, status: any) => {
      e.stopPropagation();
      updateProductStatus(id, status);
  };

  return (
    <div className="min-h-screen bg-gray-50 animate-fade-in">
        {/* Admin Header */}
        <div className="bg-gray-900 text-white px-6 py-5 flex justify-between items-center shadow-lg">
            <div className="flex items-center gap-3">
                 <div className="w-10 h-10 bg-gray-700 rounded-xl flex items-center justify-center shadow-inner">
                     <i className="fa-solid fa-shield-halved text-primaryLight"></i>
                 </div>
                 <h1 className="font-display font-bold text-xl tracking-tight">Admin Panel</h1>
            </div>
            <Button variant="ghost" size="sm" className="text-gray-300 hover:text-white hover:bg-gray-800" onClick={() => { logout(); navigate('/'); }}>
                Logout
            </Button>
        </div>

        <div className="max-w-6xl mx-auto p-6 space-y-8">
            
            {/* Stats Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <Card className="p-5 border-l-4 border-yellow-400">
                     <h3 className="text-xs font-bold text-gray-400 uppercase tracking-wider">Pending Products</h3>
                     <p className="text-3xl font-display font-bold mt-1 text-gray-900">{products.filter(p => p.status === 'pending').length}</p>
                </Card>
                <Card className="p-5 border-l-4 border-green-500">
                     <h3 className="text-xs font-bold text-gray-400 uppercase tracking-wider">Total Approved</h3>
                     <p className="text-3xl font-display font-bold mt-1 text-gray-900">{products.filter(p => p.status === 'approved').length}</p>
                </Card>
                <Card className="p-5 border-l-4 border-blue-500">
                     <h3 className="text-xs font-bold text-gray-400 uppercase tracking-wider">Delivery Requests</h3>
                     <p className="text-3xl font-display font-bold mt-1 text-gray-900">{pendingDelivery.length}</p>
                </Card>
            </div>

            {/* Product Management Section */}
            <section>
                <div className="flex items-center justify-between mb-4">
                    <h2 className="text-lg font-bold text-gray-800">Product Management</h2>
                </div>

                {/* Tabs */}
                <div className="flex gap-2 mb-4 overflow-x-auto pb-2">
                    {['pending', 'approved', 'rejected', 'all'].map(tab => (
                        <button 
                            key={tab}
                            onClick={() => setActiveTab(tab as any)}
                            className={`px-4 py-2 rounded-full text-xs font-bold uppercase tracking-wide transition-all ${activeTab === tab ? 'bg-gray-900 text-white shadow-lg' : 'bg-white text-gray-500 hover:bg-gray-100'}`}
                        >
                            {tab}
                        </button>
                    ))}
                </div>

                <div className="bg-white rounded-2xl shadow-card overflow-hidden border border-gray-100">
                    {filteredProducts.length === 0 ? (
                        <div className="p-10 text-center text-gray-400">
                            <i className="fa-solid fa-box-open text-3xl mb-3 opacity-50"></i>
                            <p>No products found in {activeTab}.</p>
                        </div>
                    ) : (
                        <div className="overflow-x-auto">
                            <table className="min-w-full divide-y divide-gray-100">
                                <thead className="bg-gray-50/50">
                                    <tr>
                                        <th className="px-6 py-4 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">Product</th>
                                        <th className="px-6 py-4 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">Price</th>
                                        <th className="px-6 py-4 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">Vendor</th>
                                        <th className="px-6 py-4 text-right text-xs font-bold text-gray-500 uppercase tracking-wider">Actions</th>
                                    </tr>
                                </thead>
                                <tbody className="bg-white divide-y divide-gray-100">
                                    {filteredProducts.map(p => (
                                        <tr key={p.id} className="hover:bg-gray-50/50 transition-colors">
                                            <td className="px-6 py-4 whitespace-nowrap">
                                                <div className="flex items-center">
                                                    <img src={p.images[0] || 'https://via.placeholder.com/40'} className="h-12 w-12 rounded-lg object-cover bg-gray-100 mr-4 shadow-sm" />
                                                    <div>
                                                        <div className="text-sm font-bold text-gray-900">{p.title}</div>
                                                        <Badge color={p.status === 'pending' ? 'yellow' : p.status === 'approved' ? 'green' : 'red'} className="mt-1">
                                                            {p.status}
                                                        </Badge>
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm font-bold text-gray-600">
                                                {p.currency}{p.price}
                                            </td>
                                             <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                                {p.vendorId}
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium space-x-2">
                                                {/* Action Buttons */}
                                                {deleteId === p.id ? (
                                                    <div className="flex items-center justify-end gap-2 animate-fade-in">
                                                        <span className="text-[10px] text-red-500 font-bold uppercase">Sure?</span>
                                                        <button 
                                                            type="button"
                                                            onClick={(e) => { e.stopPropagation(); deleteProduct(p.id); setDeleteId(null); }}
                                                            className="text-white bg-red-500 px-2 py-1 rounded text-xs hover:bg-red-600 transition-colors"
                                                        >
                                                            Yes
                                                        </button>
                                                        <button 
                                                            type="button"
                                                            onClick={(e) => { e.stopPropagation(); setDeleteId(null); }}
                                                            className="text-gray-600 bg-gray-200 px-2 py-1 rounded text-xs hover:bg-gray-300 transition-colors"
                                                        >
                                                            No
                                                        </button>
                                                    </div>
                                                ) : (
                                                    <>
                                                        {p.status === 'pending' && (
                                                            <>
                                                                <button type="button" onClick={(e) => handleStatusUpdate(e, p.id, 'approved')} className="text-green-600 bg-green-50 px-3 py-1.5 rounded-lg hover:bg-green-100 font-bold text-xs transition-colors">Approve</button>
                                                                <button type="button" onClick={(e) => handleStatusUpdate(e, p.id, 'rejected')} className="text-red-600 bg-red-50 px-3 py-1.5 rounded-lg hover:bg-red-100 font-bold text-xs transition-colors">Reject</button>
                                                            </>
                                                        )}
                                                        {p.status === 'approved' && (
                                                            <button type="button" onClick={(e) => handleStatusUpdate(e, p.id, 'rejected')} className="text-orange-500 bg-orange-50 px-3 py-1.5 rounded-lg hover:bg-orange-100 font-bold text-xs transition-colors">Suspend</button>
                                                        )}
                                                        {p.status === 'rejected' && (
                                                            <button type="button" onClick={(e) => handleStatusUpdate(e, p.id, 'approved')} className="text-blue-500 bg-blue-50 px-3 py-1.5 rounded-lg hover:bg-blue-100 font-bold text-xs transition-colors">Restore</button>
                                                        )}
                                                        
                                                        <button 
                                                            type="button"
                                                            onClick={(e) => { e.stopPropagation(); setDeleteId(p.id); }}
                                                            className="text-gray-400 hover:text-red-600 px-3 py-1.5 rounded-lg hover:bg-red-50 transition-all inline-flex items-center justify-center" 
                                                            title="Delete Permanently"
                                                        >
                                                            <i className="fa-solid fa-trash"></i>
                                                        </button>
                                                    </>
                                                )}
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    )}
                </div>
            </section>

            {/* Delivery Staff Approvals */}
            {pendingDelivery.length > 0 && (
                <section>
                    <h2 className="text-lg font-bold mb-4 text-gray-800">Pending Delivery Staff</h2>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {pendingDelivery.map(dp => (
                            <Card key={dp.id} className="p-5 flex justify-between items-center border border-blue-100 bg-blue-50/30">
                                <div>
                                    <div className="flex items-center gap-2 mb-1">
                                        <p className="font-bold text-gray-900">{dp.fullName}</p>
                                        <Badge color="blue">New</Badge>
                                    </div>
                                    <p className="text-sm text-gray-500 capitalize"><i className="fa-solid fa-bicycle mr-1"></i> {dp.vehicleType}</p>
                                </div>
                                <div className="space-x-2">
                                    <Button size="sm" onClick={() => approveDeliveryPerson(dp.id)} className="shadow-none">Approve</Button>
                                </div>
                            </Card>
                        ))}
                    </div>
                </section>
            )}

        </div>
    </div>
  );
};
