
import React, { useState, useEffect, useRef } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useApp } from '../context';
import { Button, Input, Card, Badge } from '../components/UI';
import { CATEGORIES } from '../constants';
import { OrderStatus, Product } from '../types';

// Helper to read file as Base64
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
  
  // Find current user's vendor ID
  const currentVendor = vendors.find(v => v.userId === currentUser?.id);
  const vendorId = currentVendor?.vendorId;

  const pendingOrders = orders.filter(o => o.vendorId === vendorId && o.status !== 'delivered');
  // Calculate sales based on orders for this vendor
  const totalSales = orders
    .filter(o => o.vendorId === vendorId)
    .reduce((acc, curr) => acc + curr.total, 0);

  return (
    <div className="p-4 min-h-screen bg-gray-50 pb-24 animate-fade-in pb-safe">
        <div className="flex justify-between items-center mb-6">
            <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>
            <Button size="sm" onClick={() => navigate('/vendor/products/new')}>+ Add Product</Button>
        </div>

        {/* Stats */}
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
                         <Badge color={order.status === 'placed' ? 'blue' : 'green'}>{order.status.replace('_', ' ')}</Badge>
                     </div>
                     <p className="text-xs text-gray-500 mb-2">{order.items.length} items • {order.deliveryOption}</p>
                     <div className="flex justify-end">
                         <Button size="sm" variant="outline">Manage</Button>
                     </div>
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
                {myProducts.length === 0 ? (
                     <div className="text-center py-10 text-gray-400">No products added yet.</div>
                ) : (
                    myProducts.map(p => (
                        <div key={p.id} className="bg-white p-3 rounded-2xl shadow-sm flex gap-3 items-center border border-gray-100">
                            <div className="w-16 h-16 rounded-xl bg-gray-100 flex-shrink-0 overflow-hidden relative">
                                <img src={p.images[0] || 'https://via.placeholder.com/80'} className="w-full h-full object-cover" />
                                {p.images.length > 1 && (
                                    <div className="absolute bottom-0 right-0 bg-black/50 text-white text-[9px] px-1.5 rounded-tl-lg">
                                        +{p.images.length - 1}
                                    </div>
                                )}
                            </div>
                            <div className="flex-grow">
                                <h4 className="font-bold text-sm text-gray-900 line-clamp-1">{p.title}</h4>
                                <div className="flex items-center gap-2 text-xs text-gray-500 mt-1">
                                    <span>{p.stock} left</span>
                                    <span>•</span>
                                    <span>{p.location}</span>
                                </div>
                                <p className="font-bold text-primary text-sm mt-1">{p.currency}{p.price}</p>
                                {p.status === 'pending' && <p className="text-[10px] text-orange-500 font-medium mt-1"><i className="fa-solid fa-clock mr-1"></i> Awaiting Admin Approval</p>}
                            </div>
                            <div className="flex flex-col items-end gap-2">
                                <Badge color={p.status === 'approved' ? 'green' : p.status === 'rejected' ? 'red' : 'yellow'}>
                                    {p.status}
                                </Badge>
                                <button 
                                    onClick={() => navigate(`/vendor/products/${p.id}/edit`)}
                                    className="text-gray-400 text-xs hover:text-primary transition-colors flex items-center gap-1"
                                >
                                    <i className="fa-solid fa-pen"></i> Edit
                                </button>
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

    // Force refresh on mount to ensure orders are seen
    useEffect(() => {
        refreshData();
    }, []);

    const currentVendor = vendors.find(v => v.userId === currentUser?.id);
    const myOrders = orders.filter(o => o.vendorId === currentVendor?.vendorId);

    const filteredOrders = myOrders.filter(o => {
        if (filter === 'all') return true;
        if (filter === 'active') return o.status !== 'delivered' && o.status !== 'declined' && o.status !== 'cancelled';
        if (filter === 'completed') return o.status === 'delivered' || o.status === 'declined' || o.status === 'cancelled';
        return true;
    });

    // Sort by date descending
    filteredOrders.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

    const handleStatusChange = async (e: React.MouseEvent, orderId: string, newStatus: OrderStatus) => {
        e.stopPropagation(); // Prevent any parent click events
        // Direct update for better UX
        await updateOrderStatus(orderId, newStatus);
    };

    const getNextAction = (status: OrderStatus, deliveryOption: 'delivery' | 'pickup') => {
        switch (status) {
            case 'received': return deliveryOption === 'delivery' 
                ? { label: 'Dispatch Driver', next: 'in_route' as OrderStatus, icon: 'motorcycle', btnVariant: 'primary' as const }
                : { label: 'Ready for Pickup', next: 'ready_for_pickup' as OrderStatus, icon: 'box', btnVariant: 'primary' as const };
            case 'in_route': return { label: 'Mark Delivered', next: 'delivered' as OrderStatus, icon: 'flag-checkered', btnVariant: 'success' as const };
            case 'ready_for_pickup': return { label: 'Picked Up', next: 'delivered' as OrderStatus, icon: 'flag-checkered', btnVariant: 'success' as const };
            default: return null;
        }
    };

    return (
        <div className="p-4 min-h-screen bg-gray-50 pb-24 animate-fade-in pb-safe">
            <div className="mb-6">
                <h1 className="text-xl font-bold text-gray-900">Orders Management</h1>
            </div>

            <div className="flex gap-2 mb-6 overflow-x-auto hide-scrollbar">
                {['active', 'completed', 'all'].map(f => (
                    <button 
                        key={f}
                        onClick={() => setFilter(f as any)}
                        className={`px-5 py-2 rounded-full text-xs font-bold capitalize transition-all whitespace-nowrap ${filter === f ? 'bg-gray-900 text-white shadow-lg' : 'bg-white text-gray-500 border border-gray-100'}`}
                    >
                        {f}
                    </button>
                ))}
            </div>

            <div className="space-y-4">
                {filteredOrders.length === 0 ? (
                    <div className="text-center py-16 bg-white rounded-3xl border border-dashed border-gray-200">
                        <div className="w-16 h-16 bg-gray-50 rounded-full flex items-center justify-center mx-auto mb-3">
                            <i className="fa-solid fa-clipboard-list text-2xl text-gray-300"></i>
                        </div>
                        <p className="text-gray-400 font-medium text-sm">No {filter} orders found.</p>
                    </div>
                ) : (
                    filteredOrders.map(order => {
                        const nextAction = getNextAction(order.status, order.deliveryOption);
                        const isPlaced = order.status === 'placed';

                        return (
                            <Card key={order.id} className="p-5 overflow-visible">
                                <div className="flex justify-between items-start mb-4 border-b border-gray-50 pb-3">
                                    <div>
                                        <div className="flex items-center gap-2">
                                            <span className="font-bold text-gray-900">#{order.id.slice(-4)}</span>
                                            <Badge color={order.deliveryOption === 'delivery' ? 'blue' : 'yellow'}>
                                                <i className={`fa-solid fa-${order.deliveryOption === 'delivery' ? 'motorcycle' : 'person-walking'} mr-1`}></i>
                                                {order.deliveryOption}
                                            </Badge>
                                        </div>
                                        <span className="text-xs text-gray-400 block mt-1">{new Date(order.createdAt).toLocaleDateString()}</span>
                                    </div>
                                    <div className="text-right">
                                        <span className="block font-bold text-primary">₵{order.total.toFixed(2)}</span>
                                        <span className={`text-[10px] font-bold uppercase tracking-wide ${order.status === 'delivered' ? 'text-green-500' : order.status === 'declined' ? 'text-red-500' : 'text-blue-500'}`}>
                                            {order.status.replace('_', ' ')}
                                        </span>
                                    </div>
                                </div>

                                <div className="space-y-2 mb-4 bg-gray-50 p-3 rounded-xl">
                                    {order.items.map((item, idx) => (
                                        <div key={idx} className="flex justify-between text-sm items-center">
                                            <div className="flex items-center gap-2">
                                                <span className="bg-white w-6 h-6 flex items-center justify-center rounded text-xs font-bold shadow-sm text-gray-600">{item.quantity}x</span>
                                                <span className="text-gray-700 font-medium">{item.product.title}</span>
                                            </div>
                                            <span className="text-gray-500 text-xs">₵{(item.product.price * item.quantity).toFixed(2)}</span>
                                        </div>
                                    ))}
                                </div>

                                <div className="flex justify-between items-center pt-1">
                                    <button className="text-xs font-bold text-gray-400 hover:text-gray-600">
                                        <i className="fa-solid fa-circle-info mr-1"></i> Details
                                    </button>
                                    
                                    <div className="flex gap-2">
                                        {isPlaced ? (
                                            <>
                                                <Button size="sm" variant="danger" onClick={(e) => handleStatusChange(e, order.id, 'declined')} icon="xmark">Decline</Button>
                                                <Button size="sm" variant="primary" onClick={(e) => handleStatusChange(e, order.id, 'received')} icon="check">Accept</Button>
                                            </>
                                        ) : (
                                            nextAction && (
                                                <Button 
                                                    size="sm" 
                                                    variant={nextAction.btnVariant}
                                                    onClick={(e) => handleStatusChange(e, order.id, nextAction.next)}
                                                    icon={nextAction.icon}
                                                >
                                                    {nextAction.label}
                                                </Button>
                                            )
                                        )}
                                    </div>
                                </div>
                            </Card>
                        );
                    })
                )}
            </div>
        </div>
    );
};

// --- Product Form (Reusable for Add/Edit) ---
interface ProductFormProps {
  initialData?: Partial<Product>;
  onSubmit: (data: any) => Promise<void>;
  isEdit?: boolean;
}

const ProductForm: React.FC<ProductFormProps> = ({ initialData = {}, onSubmit, isEdit }) => {
  const navigate = useNavigate();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  const [formData, setFormData] = useState({
    title: initialData.title || '',
    description: initialData.description || '',
    price: initialData.price || '',
    category: initialData.category || 'Food',
    stock: initialData.stock || '',
    location: initialData.location || '',
    contactPhone: initialData.contactPhone || '',
    images: initialData.images || [] as string[]
  });

  // Custom Category Logic
  const [useCustomCategory, setUseCustomCategory] = useState(false);
  const [customCategoryInput, setCustomCategoryInput] = useState('');

  useEffect(() => {
      // If we are editing and the category is NOT in the standard list, switch to custom mode
      if (initialData.category) {
          const isStandard = CATEGORIES.some(c => c.name === initialData.category);
          if (!isStandard) {
              setUseCustomCategory(true);
              setCustomCategoryInput(initialData.category);
              setFormData(prev => ({ ...prev, category: 'OTHER' }));
          }
      }
  }, [initialData]);

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      const newImages: string[] = [];
      for (let i = 0; i < e.target.files.length; i++) {
        const base64 = await readFile(e.target.files[i]);
        newImages.push(base64);
      }
      setFormData(prev => ({ ...prev, images: [...prev.images, ...newImages] }));
    }
  };

  const removeImage = (index: number) => {
    setFormData(prev => ({ ...prev, images: prev.images.filter((_, i) => i !== index) }));
  };

  const moveImage = (index: number, direction: 'left' | 'right') => {
    const newImages = [...formData.images];
    if (direction === 'left' && index > 0) {
        [newImages[index - 1], newImages[index]] = [newImages[index], newImages[index - 1]];
    } else if (direction === 'right' && index < newImages.length - 1) {
        [newImages[index + 1], newImages[index]] = [newImages[index], newImages[index + 1]];
    }
    setFormData(prev => ({ ...prev, images: newImages }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    // Basic validation
    if (!formData.title || !formData.price || formData.images.length === 0) {
        alert("Please fill in required fields and add at least one image.");
        return;
    }

    const finalCategory = useCustomCategory ? customCategoryInput : formData.category;
    if (!finalCategory || finalCategory === 'OTHER') {
        alert("Please specify a category.");
        return;
    }

    setIsSubmitting(true);
    await onSubmit({
        ...formData,
        category: finalCategory,
        price: Number(formData.price),
        stock: Number(formData.stock),
        currency: 'GHS'
    });
    setIsSubmitting(false);
  };

  return (
    <div className="p-4 min-h-screen bg-gray-50 pb-24 animate-fade-in pb-safe">
         <div className="flex items-center mb-6">
            <button onClick={() => navigate(-1)} className="w-10 h-10 bg-white rounded-full shadow-sm flex items-center justify-center text-gray-600 mr-4"><i className="fa-solid fa-arrow-left"></i></button>
            <h1 className="text-xl font-bold">{isEdit ? 'Edit Product' : 'Add New Product'}</h1>
        </div>

        <form onSubmit={handleSubmit} className="space-y-5 max-w-lg mx-auto">
            {/* Image Uploader Section */}
            <div className="bg-white p-5 rounded-2xl shadow-sm border border-gray-100">
                <div className="flex justify-between items-center mb-3">
                    <label className="text-xs font-bold text-gray-500 uppercase">Product Images ({formData.images.length})</label>
                    <button 
                        type="button"
                        onClick={() => fileInputRef.current?.click()} 
                        className="text-xs font-bold text-primary bg-primary/10 px-3 py-1 rounded-lg hover:bg-primary/20 transition-colors"
                    >
                        + Add Photos
                    </button>
                    <input 
                        type="file" 
                        ref={fileInputRef} 
                        hidden 
                        multiple 
                        accept="image/*" 
                        onChange={handleImageUpload} 
                    />
                </div>
                
                {formData.images.length === 0 ? (
                    <div 
                        onClick={() => fileInputRef.current?.click()}
                        className="aspect-video rounded-xl border-2 border-dashed border-gray-300 bg-gray-50 flex flex-col items-center justify-center text-gray-400 cursor-pointer hover:bg-gray-100 transition-colors"
                    >
                        <i className="fa-solid fa-camera text-3xl mb-2"></i>
                        <span className="text-sm font-medium">Tap to upload images</span>
                    </div>
                ) : (
                    <div className="grid grid-cols-3 gap-3">
                        {formData.images.map((img, idx) => (
                            <div key={idx} className="relative aspect-square rounded-xl overflow-hidden group border border-gray-200 bg-white shadow-sm">
                                <img src={img} className="w-full h-full object-cover" alt="Product" />
                                
                                {/* Overlay Controls */}
                                <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2 backdrop-blur-[1px]">
                                    {idx > 0 && (
                                        <button type="button" onClick={() => moveImage(idx, 'left')} className="w-6 h-6 rounded-full bg-white/90 text-gray-700 hover:text-primary flex items-center justify-center shadow-sm"><i className="fa-solid fa-arrow-left text-[10px]"></i></button>
                                    )}
                                    <button type="button" onClick={() => removeImage(idx)} className="w-8 h-8 rounded-full bg-red-500 text-white flex items-center justify-center shadow-sm hover:scale-110 transition-transform"><i className="fa-solid fa-trash text-xs"></i></button>
                                    {idx < formData.images.length - 1 && (
                                        <button type="button" onClick={() => moveImage(idx, 'right')} className="w-6 h-6 rounded-full bg-white/90 text-gray-700 hover:text-primary flex items-center justify-center shadow-sm"><i className="fa-solid fa-arrow-right text-[10px]"></i></button>
                                    )}
                                </div>
                                
                                {/* Main Tag */}
                                {idx === 0 && <div className="absolute top-1 left-1 bg-primary/90 backdrop-blur-md text-white text-[8px] font-bold px-2 py-0.5 rounded shadow-sm">MAIN</div>}
                            </div>
                        ))}
                        {/* Add Button Tile */}
                        <div 
                            onClick={() => fileInputRef.current?.click()}
                            className="aspect-square rounded-xl border-2 border-dashed border-gray-200 flex flex-col items-center justify-center text-gray-400 cursor-pointer hover:border-primary hover:text-primary hover:bg-primary/5 transition-all"
                        >
                            <i className="fa-solid fa-plus text-xl"></i>
                        </div>
                    </div>
                )}
                <p className="text-[10px] text-gray-400 mt-2 text-center">First image will be the cover. Drag or use arrows to reorder.</p>
            </div>

            <div className="bg-white p-5 rounded-2xl shadow-sm border border-gray-100 space-y-4">
                <Input 
                    label="Product Title" 
                    placeholder="e.g. iPhone Fast Charger" 
                    value={formData.title}
                    onChange={e => setFormData({...formData, title: e.target.value})}
                />
                
                <div>
                    <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-2 ml-1">Description</label>
                    <textarea 
                        className="block w-full rounded-2xl border-transparent bg-white shadow-sm ring-1 ring-gray-100 p-4 text-gray-900 placeholder-gray-400 focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all resize-none text-sm"
                        rows={4}
                        placeholder="Describe the condition, features, etc."
                        value={formData.description}
                        onChange={e => setFormData({...formData, description: e.target.value})}
                    />
                </div>

                <div className="grid grid-cols-2 gap-4">
                    <Input 
                        label="Price (GHS)" 
                        type="number"
                        placeholder="0.00" 
                        value={formData.price}
                        onChange={e => setFormData({...formData, price: e.target.value})}
                    />
                    <Input 
                        label="Stock Qty" 
                        type="number"
                        placeholder="1" 
                        value={formData.stock}
                        onChange={e => setFormData({...formData, stock: e.target.value})}
                    />
                </div>

                <div>
                    <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-2 ml-1">Category</label>
                    <select 
                        className="block w-full rounded-2xl border-transparent bg-white shadow-sm ring-1 ring-gray-100 py-3.5 px-4 text-gray-900 focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all text-sm appearance-none"
                        value={useCustomCategory ? 'OTHER' : formData.category}
                        onChange={e => {
                            if (e.target.value === 'OTHER') {
                                setUseCustomCategory(true);
                                setFormData({...formData, category: 'OTHER'});
                            } else {
                                setUseCustomCategory(false);
                                setFormData({...formData, category: e.target.value});
                            }
                        }}
                    >
                        {CATEGORIES.map(c => <option key={c.id} value={c.name}>{c.name}</option>)}
                        <option value="OTHER">Other (Specify Manually)</option>
                    </select>
                    
                    {useCustomCategory && (
                        <div className="mt-3 animate-fade-in">
                            <Input 
                                placeholder="Enter custom category name" 
                                value={customCategoryInput}
                                onChange={e => setCustomCategoryInput(e.target.value)}
                                autoFocus
                            />
                        </div>
                    )}
                </div>

                <Input 
                    label="Pickup Location" 
                    icon="location-dot"
                    placeholder="e.g. Hostel B, Room 204" 
                    value={formData.location}
                    onChange={e => setFormData({...formData, location: e.target.value})}
                />

                 <Input 
                    label="Contact Phone" 
                    icon="phone"
                    type="tel"
                    placeholder="233..." 
                    value={formData.contactPhone}
                    onChange={e => setFormData({...formData, contactPhone: e.target.value})}
                />
            </div>

            <div className="pt-2">
                <Button fullWidth size="lg" type="submit" disabled={isSubmitting} className="shadow-xl shadow-primary/20">
                    {isSubmitting ? 'Saving...' : (isEdit ? 'Update Product' : 'Publish Product')}
                </Button>
                {!isEdit && <p className="text-center text-[10px] text-gray-400 mt-2">New products require admin approval before appearing in search.</p>}
            </div>
        </form>
    </div>
  );
}

export const AddProduct: React.FC = () => {
    const { addProduct } = useApp();
    const navigate = useNavigate();

    const handleSubmit = async (data: any) => {
        const success = await addProduct(data);
        if (success) {
            navigate('/vendor/products');
        }
    };

    return <ProductForm onSubmit={handleSubmit} />;
};

export const EditProduct: React.FC = () => {
    const { id } = useParams<{id: string}>();
    const { products, updateProduct } = useApp();
    const navigate = useNavigate();
    const product = products.find(p => p.id === id);

    const handleSubmit = async (data: any) => {
        if(id) {
            await updateProduct(id, data);
            navigate('/vendor/products');
        }
    };

    if (!product) return <div>Loading...</div>;

    return <ProductForm initialData={product} onSubmit={handleSubmit} isEdit />;
};

// --- Vendor Onboarding Component ---
export const VendorOnboarding: React.FC = () => {
    const { registerVendor } = useApp();
    const navigate = useNavigate();
    const [formData, setFormData] = useState({ storeName: '', storeDescription: '', location: '', contactPhone: '' });

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!formData.storeName || !formData.location) {
            alert("Please fill in all required fields.");
            return;
        }
        await registerVendor(formData);
        navigate('/vendor/dashboard');
    };

    return (
        <div className="p-6 min-h-screen bg-white flex flex-col justify-center max-w-md mx-auto animate-fade-in">
            <div className="text-center mb-10">
                <div className="w-20 h-20 bg-secondary/10 text-secondary rounded-full flex items-center justify-center mx-auto mb-4 shadow-glow">
                    <i className="fa-solid fa-shop text-3xl"></i>
                </div>
                <h1 className="text-2xl font-display font-bold text-gray-900">Start Your Business</h1>
                <p className="text-gray-500 text-sm mt-2">Join hundreds of student entrepreneurs on LYNQED.</p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-6">
                <Input 
                    label="Store Name" 
                    placeholder="e.g. John's Gadgets" 
                    value={formData.storeName}
                    onChange={e => setFormData({...formData, storeName: e.target.value})}
                    icon="store"
                    required
                />
                <div>
                    <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-2 ml-1">Store Description</label>
                    <textarea 
                        className="block w-full rounded-2xl border-transparent bg-gray-50 shadow-sm ring-1 ring-gray-100 p-4 text-gray-900 placeholder-gray-400 focus:bg-white focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all resize-none text-sm"
                        rows={3}
                        placeholder="What do you sell?"
                        value={formData.storeDescription}
                        onChange={e => setFormData({...formData, storeDescription: e.target.value})}
                    />
                </div>
                <Input 
                    label="Campus Location" 
                    placeholder="e.g. Hostel A, Common Room" 
                    value={formData.location}
                    onChange={e => setFormData({...formData, location: e.target.value})}
                    icon="location-dot"
                    required
                />
                <Input 
                    label="Phone Number" 
                    placeholder="e.g. 024xxxxxxx" 
                    value={formData.contactPhone}
                    onChange={e => setFormData({...formData, contactPhone: e.target.value})}
                    icon="phone"
                    type="tel"
                    required
                />
                
                <div className="pt-4">
                    <Button fullWidth size="lg" type="submit" className="shadow-xl shadow-secondary/20 bg-gradient-to-r from-secondary to-pink-600">
                        Launch Store
                    </Button>
                    <Button type="button" fullWidth variant="ghost" className="mt-2" onClick={() => navigate(-1)}>
                        Cancel
                    </Button>
                </div>
            </form>
        </div>
    );
};
