
import React, { useState, useEffect, useRef, useMemo } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useApp } from '../context';
import { Button, Input, Card, Badge, Avatar } from '../components/UI';
import { CATEGORIES } from '../constants';
import { OrderStatus, Product } from '../types';

const readFile = (file: File): Promise<string> => {
  return new Promise((resolve) => {
    const reader = new FileReader();
    reader.onloadend = () => resolve(reader.result as string);
    reader.readAsDataURL(file);
  });
};

export const VendorDashboard: React.FC = () => {
  const { products, orders, currentUser, vendors } = useApp();
  const navigate = useNavigate();
  
  const currentVendor = useMemo(() => vendors.find(v => v.userId === currentUser?.id), [vendors, currentUser]);
  const vendorId = currentVendor?.vendorId;

  // Optimized Calculations
  const pendingOrders = useMemo(() => {
      return orders.filter(o => o.vendorId === vendorId && o.status !== 'delivered');
  }, [orders, vendorId]);

  const totalSales = useMemo(() => {
      return orders.filter(o => o.vendorId === vendorId).reduce((acc, curr) => acc + curr.total, 0);
  }, [orders, vendorId]);

  return (
    <div className="p-4 min-h-screen bg-gray-50 pb-24 animate-fade-in pb-safe">
        <div className="flex justify-between items-center mb-6">
            <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>
            <Button size="sm" onClick={() => navigate('/vendor/products/new')}>+ Add Product</Button>
        </div>

        <div className="grid grid-cols-2 gap-4 mb-6">
            <Card className="p-4 border-l-4 border-primary">
                <h3 className="text-gray-500 text-xs uppercase font-bold">Total Sales</h3>
                <p className="text-2xl font-bold mt-1 text-gray-900">₵{totalSales.toFixed(2)}</p>
            </Card>
            <Card className="p-4 border-l-4 border-accent">
                <h3 className="text-gray-500 text-xs uppercase font-bold">Active Orders</h3>
                <p className="text-2xl font-bold mt-1 text-gray-900">{pendingOrders.length}</p>
            </Card>
        </div>

        <h3 className="font-bold text-lg mb-3 text-gray-800">Recent Orders</h3>
        <div className="space-y-3 mb-8">
            {pendingOrders.length === 0 ? <p className="text-gray-500 text-sm bg-white p-4 rounded-xl shadow-sm">No active orders.</p> : 
             pendingOrders.slice(0, 3).map(order => (
                 <Card key={order.id} className="p-4" onClick={() => navigate('/vendor/orders')}>
                     <div className="flex justify-between mb-2">
                         <span className="font-bold text-sm">Order #{order.id.slice(-4)}</span>
                         <Badge color="blue">{order.status.replace('_', ' ')}</Badge>
                     </div>
                     <p className="text-xs text-gray-500 mb-2">{order.items.length} items • {order.deliveryOption}</p>
                 </Card>
             ))}
        </div>
    </div>
  );
};

export const VendorProducts: React.FC = () => {
    const { products, vendors, currentUser } = useApp();
    const navigate = useNavigate();
    const currentVendor = vendors.find(v => v.userId === currentUser?.id);
    const myProducts = products.filter(p => p.vendorId === currentVendor?.vendorId);

    return (
        <div className="p-4 min-h-screen bg-gray-50 pb-24 animate-fade-in pb-safe">
            <div className="flex justify-between items-center mb-6">
                <h1 className="text-xl font-bold text-gray-900">My Products</h1>
                <Button size="sm" onClick={() => navigate('/vendor/products/new')}>Add New</Button>
            </div>
            
            <div className="space-y-4">
                {myProducts.length === 0 ? <div className="text-center py-10 text-gray-400">No products added yet.</div> : (
                    myProducts.map(p => (
                        <div key={p.id} className="bg-white p-3 rounded-2xl shadow-sm flex gap-3 items-center border border-gray-100">
                            <div className="w-16 h-16 rounded-xl bg-gray-100 flex-shrink-0 overflow-hidden relative">
                                <img src={p.images[0]} className="w-full h-full object-cover" />
                            </div>
                            <div className="flex-grow">
                                <h4 className="font-bold text-sm text-gray-900 line-clamp-1">{p.title}</h4>
                                <div className="flex items-center gap-2 text-xs text-gray-500 mt-1">
                                    <span>{p.stock} left</span>
                                </div>
                                <p className="font-bold text-primary text-sm mt-1">{p.currency}{p.price}</p>
                            </div>
                            <div className="flex flex-col items-end gap-2">
                                <Badge color={p.status === 'approved' ? 'green' : p.status === 'rejected' ? 'red' : 'yellow'}>{p.status}</Badge>
                                <button onClick={() => navigate(`/vendor/products/${p.id}/edit`)} className="text-gray-400 text-xs hover:text-primary"><i className="fa-solid fa-pen"></i> Edit</button>
                            </div>
                        </div>
                    ))
                )}
            </div>
        </div>
    )
}

export const VendorOrders: React.FC = () => {
    const { orders, updateOrderStatus, vendors, currentUser, refreshData } = useApp();
    const [filter, setFilter] = useState<'all' | 'active' | 'completed'>('active');
    const [isRefreshing, setIsRefreshing] = useState(false);

    const currentVendor = vendors.find(v => v.userId === currentUser?.id);
    const vendorId = currentVendor?.vendorId;
    
    // Explicitly filter orders for this vendor
    const myOrders = useMemo(() => orders.filter(o => o.vendorId === vendorId), [orders, vendorId]);

    const handleRefresh = async () => {
        setIsRefreshing(true);
        await refreshData();
        setIsRefreshing(false);
    };

    useEffect(() => { 
        handleRefresh(); 
    }, []);

    const filteredOrders = myOrders.filter(o => {
        if (filter === 'all') return true;
        if (filter === 'active') return ['placed', 'received', 'preparing', 'ready_for_pickup', 'assigned'].includes(o.status);
        if (filter === 'completed') return ['picked_up', 'in_route', 'delivered', 'declined', 'cancelled'].includes(o.status);
        return true;
    }).sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

    const handleStatusChange = async (e: React.MouseEvent, orderId: string, newStatus: OrderStatus) => {
        e.stopPropagation();
        await updateOrderStatus(orderId, newStatus);
    };

    const getNextAction = (status: OrderStatus, deliveryOption: 'delivery' | 'pickup') => {
        if (status === 'placed') return { label: 'Accept Order', next: 'received' as OrderStatus, icon: 'check', btnVariant: 'primary' as const };
        if (status === 'received') return { label: 'Start Preparing', next: 'preparing' as OrderStatus, icon: 'fire-burner', btnVariant: 'primary' as const };
        if (status === 'preparing') {
             return deliveryOption === 'delivery' 
                ? { label: 'Ready for Driver', next: 'ready_for_pickup' as OrderStatus, icon: 'box', btnVariant: 'primary' as const }
                : { label: 'Ready for Pickup', next: 'ready_for_pickup' as OrderStatus, icon: 'box', btnVariant: 'primary' as const };
        }
        if (status === 'ready_for_pickup' && deliveryOption === 'pickup') {
             return { label: 'Picked Up', next: 'delivered' as OrderStatus, icon: 'check', btnVariant: 'success' as const };
        }
        return null;
    };

    return (
        <div className="p-4 min-h-screen bg-gray-50 pb-24 animate-fade-in pb-safe">
            <div className="mb-4 flex flex-col gap-2">
                <div className="flex justify-between items-center">
                    <h1 className="text-xl font-bold text-gray-900">Orders Management</h1>
                    <Button size="sm" variant="outline" onClick={handleRefresh} icon={isRefreshing ? 'spinner' : 'rotate'}>
                        {isRefreshing ? 'Checking...' : 'Check Orders'}
                    </Button>
                </div>
            </div>

            <div className="flex gap-2 mb-6">
                {['active', 'completed', 'all'].map(f => (
                    <button key={f} onClick={() => setFilter(f as any)} className={`px-5 py-2 rounded-full text-xs font-bold capitalize ${filter === f ? 'bg-gray-900 text-white' : 'bg-white text-gray-500 border border-gray-100'}`}>{f}</button>
                ))}
            </div>

            {/* DEBUG INFO: Only shows if empty */}
            {filteredOrders.length === 0 && (
                <div className="mb-4 p-3 bg-yellow-50 border border-yellow-100 rounded-lg text-xs text-yellow-800 font-mono">
                    <p><strong>Debug Status:</strong></p>
                    <p>Current Vendor ID: {vendorId || 'Not Found'}</p>
                    <p>Total Orders in System: {orders.length}</p>
                    <p>Orders matching this Vendor: {myOrders.length}</p>
                    <p>Current Filter: {filter}</p>
                </div>
            )}

            <div className="space-y-4">
                {filteredOrders.length === 0 ? <p className="text-center py-10 text-gray-400">No orders found.</p> : 
                    filteredOrders.map(order => {
                        const nextAction = getNextAction(order.status, order.deliveryOption);
                        return (
                            <Card key={order.id} className="p-5">
                                <div className="flex justify-between items-start mb-4 border-b border-gray-50 pb-3">
                                    <div>
                                        <span className="font-bold text-gray-900">#{order.id.slice(-4)}</span>
                                        <Badge color="blue">{order.deliveryOption}</Badge>
                                        <p className="text-xs text-gray-400 mt-1">{new Date(order.createdAt).toLocaleDateString()}</p>
                                    </div>
                                    <div className="text-right">
                                        <span className="block font-bold text-primary">₵{order.total.toFixed(2)}</span>
                                        <span className="text-[10px] font-bold uppercase text-blue-500">{order.status.replace('_', ' ')}</span>
                                    </div>
                                </div>
                                <div className="space-y-2 mb-4 bg-gray-50 p-3 rounded-xl">
                                    {order.items.map((item, idx) => (
                                        <div key={idx} className="flex justify-between text-sm"><span className="font-medium">{item.quantity}x {item.product.title}</span></div>
                                    ))}
                                </div>
                                <div className="flex justify-end gap-2">
                                    {['placed', 'received', 'preparing'].includes(order.status) && <Button size="sm" variant="danger" onClick={(e) => handleStatusChange(e, order.id, 'declined')}>Decline</Button>}
                                    {nextAction && <Button size="sm" variant={nextAction.btnVariant} onClick={(e) => handleStatusChange(e, order.id, nextAction.next)} icon={nextAction.icon}>{nextAction.label}</Button>}
                                    {order.status === 'ready_for_pickup' && order.deliveryOption === 'delivery' && <span className="text-xs text-gray-400 italic py-2">Waiting for driver...</span>}
                                </div>
                            </Card>
                        );
                    })
                }
            </div>
        </div>
    );
};

// ... Rest of the file (ProductForm, AddProduct, EditProduct, VendorOnboarding) remains same but included for completeness in a real file replacement ...
const ProductForm: React.FC<{
  initialData?: Partial<Product>;
  onSubmit: (data: any) => Promise<void>;
  isLoading?: boolean;
}> = ({ initialData, onSubmit, isLoading }) => {
  const [formData, setFormData] = useState({
    title: initialData?.title || '',
    description: initialData?.description || '',
    price: initialData?.price || 0,
    category: initialData?.category || 'Food',
    customCategory: '',
    stock: initialData?.stock || 1,
    location: initialData?.location || '',
    contactPhone: initialData?.contactPhone || '',
  });
  
  const [images, setImages] = useState<string[]>(initialData?.images || []);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
      if (e.target.files && e.target.files.length > 0) {
          const newImages = await Promise.all(Array.from(e.target.files).map(readFile));
          setImages([...images, ...newImages]);
      }
  };

  const removeImage = (index: number) => {
      setImages(images.filter((_, i) => i !== index));
  };

  const moveImage = (index: number, direction: 'up' | 'down') => {
      const newImages = [...images];
      const targetIndex = direction === 'up' ? index - 1 : index + 1;
      if (targetIndex >= 0 && targetIndex < newImages.length) {
          [newImages[index], newImages[targetIndex]] = [newImages[targetIndex], newImages[index]];
          setImages(newImages);
      }
  };

  const handleSubmit = (e: React.FormEvent) => {
      e.preventDefault();
      const finalCategory = formData.category === 'OTHER' ? formData.customCategory : formData.category;
      
      onSubmit({
          ...formData,
          category: finalCategory,
          images
      });
  };

  const isCustomCat = initialData?.category && !CATEGORIES.some(c => c.name === initialData.category);
  useEffect(() => {
      if (isCustomCat && initialData?.category) {
          setFormData(prev => ({...prev, category: 'OTHER', customCategory: initialData.category!}));
      }
  }, [isCustomCat]);

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
        <div className="space-y-4">
            <div>
                <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">Product Images</label>
                <div className="grid grid-cols-3 gap-2 mb-2">
                    {images.map((img, idx) => (
                        <div key={idx} className="relative aspect-square rounded-xl overflow-hidden group bg-gray-100 border border-gray-200">
                            <img src={img} className="w-full h-full object-cover" />
                            <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col items-center justify-center gap-2">
                                <button type="button" onClick={() => removeImage(idx)} className="text-white hover:text-red-400"><i className="fa-solid fa-trash"></i></button>
                                <div className="flex gap-2">
                                    {idx > 0 && <button type="button" onClick={() => moveImage(idx, 'up')} className="text-white"><i className="fa-solid fa-arrow-left"></i></button>}
                                    {idx < images.length - 1 && <button type="button" onClick={() => moveImage(idx, 'down')} className="text-white"><i className="fa-solid fa-arrow-right"></i></button>}
                                </div>
                            </div>
                            {idx === 0 && <span className="absolute bottom-0 left-0 right-0 bg-primary text-white text-[9px] font-bold text-center py-0.5">Cover</span>}
                        </div>
                    ))}
                    <div 
                        onClick={() => fileInputRef.current?.click()}
                        className="aspect-square rounded-xl border-2 border-dashed border-gray-300 flex flex-col items-center justify-center text-gray-400 hover:border-primary hover:text-primary cursor-pointer transition-colors bg-gray-50"
                    >
                        <i className="fa-solid fa-cloud-arrow-up text-xl mb-1"></i>
                        <span className="text-[10px] font-bold">Upload</span>
                    </div>
                </div>
                <input type="file" ref={fileInputRef} hidden multiple accept="image/*" onChange={handleImageUpload} />
            </div>

            <Input label="Product Title" value={formData.title} onChange={e => setFormData({...formData, title: e.target.value})} required placeholder="e.g. Spicy Jollof Rice" />
            
            <div className="grid grid-cols-2 gap-4">
                <Input label="Price (GHS)" type="number" value={formData.price} onChange={e => setFormData({...formData, price: parseFloat(e.target.value)})} required />
                <Input label="Stock" type="number" value={formData.stock} onChange={e => setFormData({...formData, stock: parseInt(e.target.value)})} required />
            </div>

            <div>
                 <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-2 ml-1">Category</label>
                 <select 
                    className="block w-full rounded-2xl border-transparent bg-white shadow-sm ring-1 ring-gray-100 py-3.5 px-4 text-gray-900 focus:border-primary focus:ring-primary/20 text-sm mb-2"
                    value={formData.category}
                    onChange={e => setFormData({...formData, category: e.target.value})}
                 >
                     {CATEGORIES.map(c => <option key={c.id} value={c.name}>{c.name}</option>)}
                     <option value="OTHER">Other (Custom)</option>
                 </select>
                 {formData.category === 'OTHER' && (
                     <Input placeholder="Enter category name" value={formData.customCategory} onChange={e => setFormData({...formData, customCategory: e.target.value})} />
                 )}
            </div>

            <div>
                <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-2 ml-1">Description</label>
                <textarea 
                    className="block w-full rounded-2xl border-transparent bg-white shadow-sm ring-1 ring-gray-100 py-3 px-4 text-gray-900 placeholder-gray-400 focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all text-sm h-32"
                    value={formData.description}
                    onChange={e => setFormData({...formData, description: e.target.value})}
                    required
                ></textarea>
            </div>
            
            <Input label="Location (e.g. Hostel A)" value={formData.location} onChange={e => setFormData({...formData, location: e.target.value})} />
            <Input label="Contact Phone" value={formData.contactPhone} onChange={e => setFormData({...formData, contactPhone: e.target.value})} placeholder="050..." />
        </div>

        <Button fullWidth size="lg" type="submit" disabled={isLoading}>{isLoading ? 'Saving...' : 'Save Product'}</Button>
    </form>
  );
};

export const AddProduct: React.FC = () => {
    const { addProduct } = useApp();
    const navigate = useNavigate();
    const [loading, setLoading] = useState(false);

    const handleSubmit = async (data: any) => {
        setLoading(true);
        const success = await addProduct(data);
        setLoading(false);
        if (success) {
            navigate('/vendor/products');
        } 
    };

    return (
        <div className="p-4 min-h-screen bg-gray-50 pb-safe">
            <div className="flex items-center mb-6">
                <button onClick={() => navigate(-1)} className="mr-4 w-8 h-8 bg-white rounded-full shadow-sm flex items-center justify-center"><i className="fa-solid fa-arrow-left"></i></button>
                <h1 className="text-xl font-bold">Add Product</h1>
            </div>
            <Card className="p-6">
                <ProductForm onSubmit={handleSubmit} isLoading={loading} />
            </Card>
        </div>
    );
};

export const EditProduct: React.FC = () => {
    const { id } = useParams();
    const { products, updateProduct } = useApp();
    const navigate = useNavigate();
    const product = products.find(p => p.id === id);

    if (!product) return <div>Product not found</div>;

    const handleSubmit = async (data: any) => {
        await updateProduct(id!, data);
        navigate('/vendor/products');
    };

    return (
        <div className="p-4 min-h-screen bg-gray-50 pb-safe">
            <div className="flex items-center mb-6">
                <button onClick={() => navigate(-1)} className="mr-4 w-8 h-8 bg-white rounded-full shadow-sm flex items-center justify-center"><i className="fa-solid fa-arrow-left"></i></button>
                <h1 className="text-xl font-bold">Edit Product</h1>
            </div>
            <Card className="p-6">
                <ProductForm initialData={product} onSubmit={handleSubmit} />
            </Card>
        </div>
    );
};

export const VendorOnboarding: React.FC = () => {
    const { registerVendor } = useApp();
    const navigate = useNavigate();
    const [formData, setFormData] = useState({ storeName: '', storeDescription: '', location: '', contactPhone: '' });
    const [loading, setLoading] = useState(false);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        await registerVendor(formData);
        setLoading(false);
        navigate('/vendor/dashboard');
    };

    return (
        <div className="min-h-screen bg-white p-8 flex flex-col justify-center max-w-md mx-auto animate-slide-up">
            <div className="text-center mb-8">
                <div className="w-16 h-16 bg-pink-50 rounded-2xl flex items-center justify-center mx-auto mb-4 text-secondary text-2xl">
                    <i className="fa-solid fa-store"></i>
                </div>
                <h1 className="text-2xl font-bold text-gray-900">Setup Your Store</h1>
                <p className="text-gray-500 mt-2">Tell us about your business</p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-6">
                <Input label="Store Name" value={formData.storeName} onChange={e => setFormData({...formData, storeName: e.target.value})} required />
                <Input label="Description" value={formData.storeDescription} onChange={e => setFormData({...formData, storeDescription: e.target.value})} required />
                <Input label="Campus Location" value={formData.location} onChange={e => setFormData({...formData, location: e.target.value})} required placeholder="e.g. Legon Hall" />
                <Input label="Phone Number" value={formData.contactPhone} onChange={e => setFormData({...formData, contactPhone: e.target.value})} required placeholder="050..." type="tel" />
                
                <Button fullWidth size="lg" type="submit" disabled={loading} className="mt-4">
                    {loading ? 'Creating Store...' : 'Launch Store'}
                </Button>
            </form>
        </div>
    );
};