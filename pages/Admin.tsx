
import React, { useState } from 'react';
import { useApp } from '../context';
import { Button, Badge, Card, Avatar } from '../components/UI';
import { useNavigate } from 'react-router-dom';

type AdminView = 'dashboard' | 'users' | 'vendors' | 'products' | 'logistics' | 'orders';

export const AdminDashboard: React.FC = () => {
  const { 
    products, users, vendors, orders, deliveryPersons,
    updateProductStatus, deleteProduct, 
    approveVendor, banUser, approveDeliveryPerson,
    logout 
  } = useApp();
  
  const navigate = useNavigate();
  const [view, setView] = useState<AdminView>('dashboard');
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  // Stats
  const revenue = orders.reduce((acc, o) => acc + o.total, 0);
  const pendingProducts = products.filter(p => p.status === 'pending');
  const pendingVendors = vendors.filter(v => !v.isApproved);
  const pendingRiders = deliveryPersons.filter(d => d.status === 'pending');
  
  // Calculate ACTUAL active users (excluding banned)
  const activeUserCount = users.filter(u => !u.isBanned).length;

  const handleSidebarClick = (id: AdminView) => {
      setView(id);
      setIsSidebarOpen(false); // Auto-close on mobile selection
  };

  const SidebarItem = ({ id, icon, label }: { id: AdminView, icon: string, label: string }) => (
      <div 
        onClick={() => handleSidebarClick(id)}
        className={`flex items-center gap-3 px-4 py-3 rounded-xl cursor-pointer transition-all ${view === id ? 'bg-primary text-white shadow-lg shadow-primary/30' : 'text-gray-400 hover:bg-gray-800 hover:text-white'}`}
      >
          <i className={`fa-solid fa-${icon} w-5`}></i>
          <span className="font-bold text-sm">{label}</span>
      </div>
  );

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col lg:flex-row">
        
        {/* Mobile Header / Toggle */}
        <div className="lg:hidden bg-gray-900 text-white p-4 flex justify-between items-center sticky top-0 z-40 shadow-md">
            <div className="flex items-center gap-2">
                <div className="w-8 h-8 bg-gradient-to-tr from-primary to-secondary rounded-lg flex items-center justify-center">
                    <i className="fa-solid fa-shield-halved text-sm"></i>
                </div>
                <span className="font-display font-extrabold text-lg tracking-tight">Admin<span className="text-primary">Panel</span></span>
            </div>
            <button onClick={() => setIsSidebarOpen(true)} className="text-white hover:text-primary transition-colors">
                <i className="fa-solid fa-bars text-2xl"></i>
            </button>
        </div>

        {/* Backdrop (Mobile Only) */}
        {isSidebarOpen && (
            <div 
                className="fixed inset-0 bg-black/50 z-40 lg:hidden backdrop-blur-sm transition-opacity"
                onClick={() => setIsSidebarOpen(false)}
            ></div>
        )}

        {/* Sidebar */}
        <div className={`
            fixed inset-y-0 left-0 z-50 w-64 bg-gray-900 text-white p-4 flex flex-col 
            transform transition-transform duration-300 ease-in-out
            ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full'} 
            lg:translate-x-0 lg:static lg:h-screen lg:sticky lg:top-0
        `}>
            {/* Sidebar Header (Desktop) / Close Button (Mobile) */}
            <div className="flex justify-between items-center mb-10 px-2 mt-4">
                <div className="flex items-center gap-2">
                    <div className="w-8 h-8 bg-gradient-to-tr from-primary to-secondary rounded-lg flex items-center justify-center">
                        <i className="fa-solid fa-shield-halved text-sm"></i>
                    </div>
                    <span className="font-display font-extrabold text-lg tracking-tight">Admin<span className="text-primary">Panel</span></span>
                </div>
                {/* Close Button (Mobile Only) */}
                <button onClick={() => setIsSidebarOpen(false)} className="lg:hidden text-gray-400 hover:text-white">
                    <i className="fa-solid fa-xmark text-xl"></i>
                </button>
            </div>

            <div className="space-y-1 flex-1 overflow-y-auto hide-scrollbar">
                <SidebarItem id="dashboard" icon="chart-line" label="Overview" />
                <SidebarItem id="users" icon="users" label="User Management" />
                <SidebarItem id="vendors" icon="store" label="Vendors" />
                <SidebarItem id="products" icon="box" label="Products" />
                <SidebarItem id="logistics" icon="motorcycle" label="Logistics" />
                <SidebarItem id="orders" icon="receipt" label="All Orders" />
            </div>

            <div className="pt-4 border-t border-gray-800 mt-auto">
                <div 
                    onClick={() => { logout(); navigate('/'); }}
                    className="flex items-center gap-3 px-4 py-3 rounded-xl cursor-pointer text-red-400 hover:bg-gray-800 hover:text-red-300 transition-all"
                >
                    <i className="fa-solid fa-arrow-right-from-bracket w-5"></i>
                    <span className="font-bold text-sm">Logout</span>
                </div>
            </div>
        </div>

        {/* Main Content */}
        <div className="flex-1 p-4 lg:p-8 overflow-x-hidden">
            
            {/* Header - Enhanced Visual Separation */}
            <header className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 bg-white p-4 rounded-2xl shadow-sm border border-gray-100 gap-4">
                <div className="flex items-center gap-3">
                     <div className="w-10 h-10 bg-gray-50 rounded-xl flex items-center justify-center text-gray-400">
                        <i className={`fa-solid fa-${view === 'dashboard' ? 'chart-line' : view === 'users' ? 'users' : view === 'vendors' ? 'store' : view === 'logistics' ? 'motorcycle' : 'box'} text-lg`}></i>
                     </div>
                     <h1 className="text-2xl font-display font-bold text-gray-900 capitalize">{view.replace('_', ' ')}</h1>
                </div>
                <div className="flex items-center gap-4 ml-auto md:ml-0">
                    <span className="bg-green-50 px-3 py-1.5 md:px-4 md:py-2 rounded-full text-[10px] md:text-xs font-bold text-green-700 shadow-sm border border-green-100 flex items-center gap-2 whitespace-nowrap">
                        <span className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></span> System Online
                    </span>
                    <div className="h-8 w-px bg-gray-200 mx-2 hidden md:block"></div>
                    <Avatar name="Admin User" size="sm" />
                </div>
            </header>

            {/* VIEWS */}

            {view === 'dashboard' && (
                <div className="space-y-6 animate-fade-in">
                    {/* Stats Grid */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                        <Card className="p-5 border-l-4 border-primary">
                            <p className="text-xs font-bold text-gray-400 uppercase">Total Revenue</p>
                            <h2 className="text-2xl font-bold text-gray-900 mt-1">₵{revenue.toFixed(2)}</h2>
                        </Card>
                        <Card className="p-5 border-l-4 border-accent">
                            <p className="text-xs font-bold text-gray-400 uppercase">Total Orders</p>
                            <h2 className="text-2xl font-bold text-gray-900 mt-1">{orders.length}</h2>
                        </Card>
                        <Card className="p-5 border-l-4 border-green-500">
                            <p className="text-xs font-bold text-gray-400 uppercase">Active Users</p>
                            <h2 className="text-2xl font-bold text-gray-900 mt-1">{activeUserCount}</h2>
                        </Card>
                        <Card className="p-5 border-l-4 border-yellow-500">
                            <p className="text-xs font-bold text-gray-400 uppercase">Pending Items</p>
                            <h2 className="text-2xl font-bold text-gray-900 mt-1">{pendingProducts.length + pendingVendors.length + pendingRiders.length}</h2>
                        </Card>
                    </div>

                    {/* Pending Actions */}
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                        <Card className="p-6">
                            <h3 className="font-bold text-gray-800 mb-4">Pending Approvals</h3>
                            <div className="space-y-3">
                                {pendingProducts.slice(0, 3).map(p => (
                                    <div key={p.id} className="flex justify-between items-center bg-gray-50 p-3 rounded-xl">
                                        <div className="flex items-center gap-3">
                                            <div className="w-10 h-10 bg-gray-200 rounded-lg overflow-hidden">
                                                <img src={p.images[0]} className="w-full h-full object-cover" />
                                            </div>
                                            <div>
                                                <p className="text-sm font-bold">{p.title}</p>
                                                <p className="text-xs text-gray-500">Product</p>
                                            </div>
                                        </div>
                                        <Button size="sm" onClick={() => setView('products')}>Review</Button>
                                    </div>
                                ))}
                                {pendingVendors.slice(0, 3).map(v => (
                                    <div key={v.vendorId} className="flex justify-between items-center bg-gray-50 p-3 rounded-xl">
                                        <div>
                                            <p className="text-sm font-bold">{v.storeName}</p>
                                            <p className="text-xs text-gray-500">Vendor Application</p>
                                        </div>
                                        <Button size="sm" onClick={() => setView('vendors')}>Review</Button>
                                    </div>
                                ))}
                                {pendingProducts.length === 0 && pendingVendors.length === 0 && <p className="text-sm text-gray-400">No pending approvals.</p>}
                            </div>
                        </Card>
                        <Card className="p-6">
                             <h3 className="font-bold text-gray-800 mb-4">Recent Orders</h3>
                             {/* Header Row */}
                             <div className="grid grid-cols-3 gap-2 mb-2 px-2">
                                 <span className="text-xs font-bold text-gray-400 uppercase">ID</span>
                                 <span className="text-xs font-bold text-gray-400 uppercase">Amount</span>
                                 <span className="text-xs font-bold text-gray-400 uppercase text-right">Status</span>
                             </div>
                             <div className="space-y-2">
                                 {orders.slice(0, 5).map(o => (
                                     <div key={o.id} className="grid grid-cols-3 gap-2 text-sm py-2 border-b border-gray-50 items-center hover:bg-gray-50 rounded px-2 transition-colors">
                                         <span className="font-mono text-gray-500">#{o.id.slice(-4)}</span>
                                         <span className="font-bold">₵{o.total.toFixed(2)}</span>
                                         <div className="text-right">
                                             <Badge color={o.status === 'delivered' ? 'green' : 'blue'}>{o.status}</Badge>
                                         </div>
                                     </div>
                                 ))}
                                 {orders.length === 0 && <p className="text-sm text-gray-400 text-center py-4">No orders yet.</p>}
                             </div>
                        </Card>
                    </div>
                </div>
            )}

            {view === 'users' && (
                <>
                    {/* Mobile Card View (< md) */}
                    <div className="grid grid-cols-1 gap-4 md:hidden animate-fade-in">
                        {users.map(u => (
                            <div key={u.id} className="bg-white p-4 rounded-2xl shadow-sm border border-gray-100 flex flex-col gap-3">
                                <div className="flex items-center gap-3">
                                    <Avatar name={u.name} src={u.avatarUrl} size="md" />
                                    <div>
                                        <p className="font-bold text-gray-900 text-sm">{u.name}</p>
                                        <p className="text-xs text-gray-500 break-all">{u.email}</p>
                                    </div>
                                    <div className="ml-auto">
                                        {u.isBanned ? <Badge color="red">Banned</Badge> : <Badge color="green">Active</Badge>}
                                    </div>
                                </div>
                                <div className="flex items-center justify-between border-t border-gray-50 pt-3 mt-1">
                                    <div className="flex gap-1 flex-wrap">
                                        {u.roles.map(r => <Badge key={r} color="gray" className="text-[10px]">{r}</Badge>)}
                                    </div>
                                    <Button size="sm" variant={u.isBanned ? 'success' : 'danger'} onClick={() => banUser(u.id, !u.isBanned)}>
                                        {u.isBanned ? 'Unban' : 'Ban'}
                                    </Button>
                                </div>
                            </div>
                        ))}
                    </div>

                    {/* Desktop Table View (>= md) */}
                    <div className="hidden md:block bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden animate-fade-in">
                        <table className="w-full text-left">
                            <thead className="bg-gray-50 text-xs uppercase text-gray-400">
                                <tr>
                                    <th className="px-6 py-4">User</th>
                                    <th className="px-6 py-4">Role</th>
                                    <th className="px-6 py-4">Status</th>
                                    <th className="px-6 py-4 text-right">Action</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-100">
                                {users.map(u => (
                                    <tr key={u.id}>
                                        <td className="px-6 py-4 flex items-center gap-3">
                                            <Avatar name={u.name} src={u.avatarUrl} size="sm" />
                                            <div>
                                                <p className="text-sm font-bold text-gray-900">{u.name}</p>
                                                <p className="text-xs text-gray-400">{u.email}</p>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4">
                                            {u.roles.map(r => <Badge key={r} color="gray" className="mr-1">{r}</Badge>)}
                                        </td>
                                        <td className="px-6 py-4">
                                            {u.isBanned ? <Badge color="red">Banned</Badge> : <Badge color="green">Active</Badge>}
                                        </td>
                                        <td className="px-6 py-4 text-right space-x-2">
                                            <Button size="sm" variant={u.isBanned ? 'success' : 'danger'} onClick={() => banUser(u.id, !u.isBanned)}>
                                                {u.isBanned ? 'Unban' : 'Ban'}
                                            </Button>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </>
            )}

            {view === 'products' && (
                 <div className="grid grid-cols-1 gap-4">
                     {products.map(p => (
                         <div key={p.id} className="bg-white p-4 rounded-xl shadow-sm border border-gray-100 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                             <div className="flex items-center gap-4">
                                 <img src={p.images[0]} className="w-16 h-16 rounded-lg object-cover bg-gray-100" />
                                 <div>
                                     <h3 className="font-bold text-gray-900">{p.title}</h3>
                                     <p className="text-xs text-gray-500">Vendor: {p.vendorId} • ₵{p.price}</p>
                                 </div>
                             </div>
                             <div className="flex items-center gap-3 w-full sm:w-auto justify-end">
                                 <Badge color={p.status === 'approved' ? 'green' : p.status === 'pending' ? 'yellow' : 'red'}>{p.status}</Badge>
                                 {p.status === 'pending' && (
                                     <>
                                        <Button size="sm" variant="success" onClick={() => updateProductStatus(p.id, 'approved')}>Approve</Button>
                                        <Button size="sm" variant="danger" onClick={() => updateProductStatus(p.id, 'rejected')}>Reject</Button>
                                     </>
                                 )}
                                 <Button size="sm" variant="ghost" icon="trash" onClick={() => deleteProduct(p.id)}></Button>
                             </div>
                         </div>
                     ))}
                 </div>
            )}

            {view === 'vendors' && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {vendors.map(v => (
                        <Card key={v.vendorId} className="p-5 flex justify-between items-center">
                            <div className="flex items-center gap-3">
                                <Avatar src={v.storeAvatarUrl} name={v.storeName} />
                                <div>
                                    <p className="font-bold">{v.storeName}</p>
                                    <p className="text-xs text-gray-500">{v.location}</p>
                                </div>
                            </div>
                            <div>
                                {v.isApproved ? (
                                    <Button size="sm" variant="outline" onClick={() => approveVendor(v.vendorId, false)}>Suspend</Button>
                                ) : (
                                    <Button size="sm" variant="success" onClick={() => approveVendor(v.vendorId, true)}>Approve</Button>
                                )}
                            </div>
                        </Card>
                    ))}
                </div>
            )}
            
            {view === 'logistics' && (
                <div className="space-y-6">
                    <div>
                        <h3 className="font-bold text-gray-800 mb-3">Rider Applications</h3>
                        {pendingRiders.length === 0 ? <p className="text-sm text-gray-400">No pending applications.</p> : (
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                {pendingRiders.map(r => (
                                    <Card key={r.id} className="p-4 flex justify-between items-center">
                                        <div>
                                            <p className="font-bold">{r.fullName}</p>
                                            <Badge color="blue">{r.vehicleType}</Badge>
                                        </div>
                                        <div className="space-x-2">
                                            <Button size="sm" variant="success" onClick={() => approveDeliveryPerson(r.id, r.userId, 'approved')}>Approve</Button>
                                            <Button size="sm" variant="danger" onClick={() => approveDeliveryPerson(r.id, r.userId, 'rejected')}>Reject</Button>
                                        </div>
                                    </Card>
                                ))}
                            </div>
                        )}
                    </div>
                    <div>
                        <h3 className="font-bold text-gray-800 mb-3">Active Fleet</h3>
                        <div className="bg-white rounded-xl border border-gray-100 p-4">
                            <p className="text-sm text-gray-500">Live map tracking would go here.</p>
                            <div className="mt-4 space-y-2">
                                {deliveryPersons.filter(d => d.status !== 'pending' && d.status !== 'rejected').map(d => (
                                    <div key={d.id} className="flex justify-between items-center text-sm py-2 border-b border-gray-50 last:border-0">
                                        <span className="font-medium text-gray-900">{d.fullName}</span>
                                        <div className="flex items-center gap-4">
                                            {d.status === 'approved' ? (
                                                <Badge color="green">Active</Badge> 
                                            ) : d.status === 'suspended' ? (
                                                <Badge color="red">Suspended</Badge>
                                            ) : (
                                                <Badge color="gray">{d.status}</Badge>
                                            )}
                                            
                                            {/* Admin Action to Suspend/Reactivate - Fixed Alignment */}
                                            {d.status === 'approved' ? (
                                                <button onClick={() => approveDeliveryPerson(d.id, d.userId, 'suspended' as any)} className="text-[10px] text-red-500 hover:text-red-700 font-bold underline transition-colors">Suspend</button>
                                            ) : (
                                                <button onClick={() => approveDeliveryPerson(d.id, d.userId, 'approved')} className="text-[10px] text-green-500 hover:text-green-700 font-bold underline transition-colors">Reactivate</button>
                                            )}
                                        </div>
                                    </div>
                                ))}
                                {deliveryPersons.filter(d => d.status !== 'pending').length === 0 && <p className="text-sm text-gray-400">No active drivers.</p>}
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {view === 'orders' && (
                 <div className="grid grid-cols-1 gap-4">
                     {orders.map(o => (
                         <Card key={o.id} className="p-4">
                             <div className="flex justify-between items-start mb-2">
                                 <div>
                                     <h3 className="font-bold">Order #{o.id.slice(-4)}</h3>
                                     <p className="text-xs text-gray-500">{new Date(o.createdAt).toLocaleString()}</p>
                                 </div>
                                 <Badge color={o.status === 'delivered' ? 'green' : 'blue'}>{o.status}</Badge>
                             </div>
                             <div className="text-sm text-gray-700 mb-2">
                                 Items: {o.items.length} | Total: ₵{o.total.toFixed(2)}
                             </div>
                             <div className="text-xs text-gray-500">
                                 Buyer ID: {o.buyerId.slice(0,8)}... | Vendor ID: {o.vendorId}
                             </div>
                         </Card>
                     ))}
                 </div>
            )}
        </div>
    </div>
  );
};
