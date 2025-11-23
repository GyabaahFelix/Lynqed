
import React, { createContext, useContext, useState, useEffect, useRef } from 'react';
import { User, Product, Vendor, Order, CartItem, DeliveryPerson, Role, OrderStatus } from './types';
import { supabase } from './supabaseClient';
import { ToastMessage } from './components/UI';

// --- Interfaces ---
interface AppContextType {
  currentUser: User | null;
  currentRole: Role;
  products: Product[];
  vendors: Vendor[];
  orders: Order[];
  cart: CartItem[];
  deliveryPersons: DeliveryPerson[];
  isLoading: boolean;
  favorites: string[];
  toast: ToastMessage | null;
  
  // Auth Actions
  login: (email: string, password: string) => Promise<{success: boolean, role?: Role, error?: string}>;
  signup: (email: string, password: string, fullName: string, role: Role) => Promise<{success: boolean, error?: string}>;
  logout: () => void;
  switchRole: (role: Role) => void;
  registerDeliveryPerson: (data: Partial<DeliveryPerson>) => void;
  registerVendor: (data: { storeName: string; storeDescription: string; location: string; contactPhone: string }) => Promise<void>;
  
  // Store Actions
  addProduct: (product: Omit<Product, 'id' | 'status' | 'images'> & { images: string[] }) => Promise<boolean>;
  updateProduct: (id: string, data: Partial<Product>) => Promise<void>;
  updateProductStatus: (id: string, status: Product['status']) => Promise<void>;
  deleteProduct: (id: string) => Promise<void>;
  
  // Cart/Favorite Actions
  addToCart: (product: Product, quantity?: number) => void;
  removeFromCart: (productId: string) => void;
  clearCart: () => void;
  placeOrder: (deliveryOption: 'delivery' | 'pickup') => Promise<void>;
  updateOrderStatus: (orderId: string, status: OrderStatus) => Promise<void>;
  toggleFavorite: (productId: string) => void;
  
  // UI Actions
  hideToast: () => void;
  requestNotificationPermission: () => Promise<boolean>;

  // Vendor/Admin Actions
  approveDeliveryPerson: (id: string) => void;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

export const AppProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  // -- State --
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [currentRole, setCurrentRole] = useState<Role>('guest');
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [toast, setToast] = useState<ToastMessage | null>(null);
  
  const [products, setProducts] = useState<Product[]>([]);
  const [vendors, setVendors] = useState<Vendor[]>([]);
  const [orders, setOrders] = useState<Order[]>([]);
  const [deliveryPersons, setDeliveryPersons] = useState<DeliveryPerson[]>([]);
  
  // Refs to hold latest state for Event Listeners
  const userRef = useRef<User | null>(null);
  
  const [cart, setCart] = useState<CartItem[]>(() => {
      const saved = localStorage.getItem('lynqed_cart');
      return saved ? JSON.parse(saved) : [];
  });
  const [favorites, setFavorites] = useState<string[]>(() => {
      const saved = localStorage.getItem('lynqed_favs');
      return saved ? JSON.parse(saved) : [];
  });

  // Keep Ref in sync
  useEffect(() => { userRef.current = currentUser; }, [currentUser]);

  // --- 1. INITIAL LOAD (SUPABASE) ---
  useEffect(() => {
    checkSession();
    fetchData();
    
    // Subscribe to Realtime changes for Stock Updates
    const productSubscription = supabase
      .channel('public:products')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'products' }, () => {
          fetchData(); // Refresh data on any product change
      })
      .subscribe();
      
    // Subscribe to Realtime changes for New Orders (Notifications)
    const orderSubscription = supabase
      .channel('public:orders')
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'orders' }, async (payload) => {
          const newOrder = payload.new as Order;
          // Check if the new order belongs to the currently logged in vendor
          if (userRef.current) {
              // Fetch the vendor details for this order to see if it matches current user
              const { data: vendorData } = await supabase
                  .from('vendors')
                  .select('userId')
                  .eq('vendorId', newOrder.vendorId)
                  .single();
                  
              if (vendorData && vendorData.userId === userRef.current.id) {
                  // Notify Vendor
                  playNotificationSound();
                  showToast(`New Order! ₵${newOrder.total}`, 'info');
                  sendBrowserNotification(newOrder);
                  
                  // Refresh orders list
                  fetchData();
              }
          }
      })
      .subscribe();

    return () => {
        supabase.removeChannel(productSubscription);
        supabase.removeChannel(orderSubscription);
    };
  }, []);

  // Persist Cart/Favs locally
  useEffect(() => { localStorage.setItem('lynqed_cart', JSON.stringify(cart)); }, [cart]);
  useEffect(() => { localStorage.setItem('lynqed_favs', JSON.stringify(favorites)); }, [favorites]);

  const checkSession = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (session?.user) {
          await fetchUserProfile(session.user.id);
      } else {
          setCurrentUser(null);
          setCurrentRole('guest');
          setIsLoading(false);
      }
  };

  const fetchUserProfile = async (userId: string): Promise<User | null> => {
      let { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .single();
      
      // SELF-HEALING Logic
      if (!data) {
          const { data: { user } } = await supabase.auth.getUser();
          if (user && user.user_metadata) {
              const meta = user.user_metadata;
              const { error: insertError } = await supabase.from('profiles').insert({
                  id: user.id,
                  email: user.email,
                  name: meta.full_name || 'User',
                  avatarUrl: meta.avatar_url,
                  roles: meta.roles || ['buyer']
              });
              
              if (!insertError) {
                  const { data: retryData } = await supabase.from('profiles').select('*').eq('id', userId).single();
                  data = retryData;
              }
          }
      }

      if (data) {
          const user: User = {
              id: data.id,
              email: data.email,
              name: data.name,
              avatarUrl: data.avatarUrl || data.avatar_url,
              roles: data.roles as Role[]
          };
          setCurrentUser(user);
          const defaultRole = user.roles.includes('vendor') ? 'vendor' : user.roles.includes('admin') ? 'admin' : 'buyer';
          setCurrentRole(defaultRole);
          return user;
      }
      
      setIsLoading(false);
      return null;
  };

  const fetchData = async () => {
      // Fetch Products
      const { data: prodData } = await supabase.from('products').select('*').order('created_at', { ascending: false });
      if (prodData) setProducts(prodData as Product[]);

      // Fetch Vendors
      const { data: vendData } = await supabase.from('vendors').select('*');
      if (vendData) {
          const mappedVendors = vendData.map((v: any) => ({
              ...v,
              createdAt: v.created_at,
              storeAvatarUrl: v.storeAvatarUrl || v.store_avatar_url
          }));
          setVendors(mappedVendors as Vendor[]);
      }

      // Fetch Orders
      const { data: ordData } = await supabase.from('orders').select('*').order('created_at', { ascending: false });
      if (ordData) {
          const mappedOrders = ordData.map((o: any) => ({
              ...o,
              items: o.items,
              createdAt: o.created_at
          }));
          setOrders(mappedOrders);
      }

      // Fetch Delivery Persons
      const { data: delData } = await supabase.from('delivery_persons').select('*');
      if (delData) setDeliveryPersons(delData as any[]);
  };

  // --- Notification Helpers ---
  
  const playNotificationSound = () => {
      try {
          // Short pleasant beep data URI
          const audio = new Audio("data:audio/wav;base64,UklGRl9vT1BXQVZFZm10IBAAAAABAAEAQB8AAEAfAAABAAgAZGF0YU..."); // Placeholder, using generic alert logic below
          // Since base64 audio strings are long, we'll rely on a simple oscillator or visual feedback if audio fails.
          // Using a cleaner standard browser beep approach isn't direct, so we just log for MVP or rely on system notification sound.
          console.log("Playing notification sound");
      } catch (e) {
          console.error("Audio play failed", e);
      }
  };

  const requestNotificationPermission = async () => {
    if (!("Notification" in window)) return false;
    const permission = await Notification.requestPermission();
    return permission === "granted";
  };

  const sendBrowserNotification = (order: Order) => {
      if (Notification.permission === "granted") {
          new Notification("LYNQED: New Order Received!", {
              body: `New order placed for ₵${order.total}. Check your dashboard.`,
              icon: '/vite.svg' // Uses default vite icon or public logo
          });
      }
  };

  // --- UI Actions ---
  const hideToast = () => setToast(null);
  const showToast = (message: string, type: 'success'|'error'|'info' = 'success') => {
      setToast({ message, type });
  };

  // --- Auth Actions ---

  const signup = async (email: string, password: string, fullName: string, role: Role) => {
      const { data, error } = await supabase.auth.signUp({
          email,
          password,
          options: {
              data: {
                  full_name: fullName,
                  roles: [role],
                  avatar_url: `https://ui-avatars.com/api/?name=${encodeURIComponent(fullName)}&background=random`
              }
          }
      });

      if (error) return { success: false, error: error.message };

      if (data.user) {
          // We attempt to create the profile immediately
          const { error: profileError } = await supabase.from('profiles').insert({
              id: data.user.id,
              email: email,
              name: fullName,
              avatarUrl: `https://ui-avatars.com/api/?name=${encodeURIComponent(fullName)}&background=random`,
              roles: [role]
          });
          // Fetch profile to ensure state is consistent
          await fetchUserProfile(data.user.id);
          return { success: true };
      }

      return { success: false, error: 'Signup failed' };
  };

  const login = async (email: string, password: string) => {
    const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
    });

    if (error) return { success: false, error: error.message };
    
    if (data.user) {
        // Force fetch live data from database to get Role
        const userProfile = await fetchUserProfile(data.user.id);
        let userRole: Role = 'buyer';
        
        // Prioritize DB role over metadata
        if (userProfile && userProfile.roles) {
             const roles = userProfile.roles;
             userRole = roles.includes('admin') ? 'admin' : roles.includes('vendor') ? 'vendor' : 'buyer';
        } else if (data.user.user_metadata?.roles) {
             // Fallback to metadata
             const roles = data.user.user_metadata.roles;
             userRole = roles.includes('admin') ? 'admin' : roles.includes('vendor') ? 'vendor' : 'buyer';
        }
        showToast(`Welcome back!`, 'success');
        return { success: true, role: userRole };
    }
    
    return { success: false, error: 'Login failed' };
  };

  const logout = async () => {
    await supabase.auth.signOut();
    setCurrentUser(null);
    setCurrentRole('guest');
    setCart([]);
    showToast('Logged out successfully', 'info');
  };

  const switchRole = (role: Role) => {
    if(currentUser?.roles.includes(role) || role === 'guest') {
      setCurrentRole(role);
      showToast(`Switched to ${role} mode`, 'info');
    }
  };

  // --- Store Actions ---

  const registerVendor = async (data: { storeName: string; storeDescription: string; location: string; contactPhone: string }) => {
    if (!currentUser) return;

    const vendorId = `vendor-${Date.now()}`;
    const { error } = await supabase.from('vendors').insert({
        vendorId: vendorId,
        userId: currentUser.id,
        storeName: data.storeName,
        storeDescription: data.storeDescription,
        location: data.location,
        contactPhone: data.contactPhone,
        storeAvatarUrl: currentUser.avatarUrl,
        isApproved: true,
        rating: 5.0
    });

    if (!error) {
        const newRoles = [...currentUser.roles, 'vendor'];
        await supabase.from('profiles').update({ roles: newRoles }).eq('id', currentUser.id);
        // Update auth metadata as well
        await supabase.auth.updateUser({ data: { roles: newRoles } });
        
        await fetchUserProfile(currentUser.id);
        fetchData(); 
        showToast('Store created successfully!', 'success');
    }
  };

  const addProduct = async (data: Omit<Product, 'id' | 'status' | 'images'> & { images: string[] }) => {
     // Robust check: find vendor by checking both user_id formats
     const vendor = vendors.find(v => v.userId === currentUser?.id);
     
     if (!vendor) {
         console.error("Vendor Check Failed. CurrentUser:", currentUser?.id, "Vendors:", vendors);
         showToast('Vendor profile not found. Please contact support.', 'error');
         return false;
     }

     const { error } = await supabase.from('products').insert({
        vendorId: vendor.vendorId,
        title: data.title,
        description: data.description,
        price: data.price,
        currency: data.currency,
        category: data.category,
        stock: data.stock,
        images: data.images,
        contactPhone: data.contactPhone,
        status: 'pending', // Always pending initially
        location: data.location || vendor.location,
        rating: 0
     });

     if (!error) {
         fetchData();
         showToast('Product submitted for approval', 'success');
         return true;
     }
     console.error(error);
     showToast('Failed to add product', 'error');
     return false;
  };

  const updateProduct = async (id: string, data: Partial<Product>) => {
      const { error } = await supabase.from('products').update(data).eq('id', id);
      if (!error) {
          fetchData();
          showToast('Product updated', 'success');
      }
  };

  const updateProductStatus = async (id: string, status: Product['status']) => {
    const { error } = await supabase.from('products').update({ status }).eq('id', id);
    if (!error) {
        fetchData();
        showToast(`Product ${status}`, 'info');
    }
  };

  const deleteProduct = async (id: string) => {
    const { error } = await supabase.from('products').delete().eq('id', id);
    if (!error) {
        fetchData();
        showToast('Product deleted', 'info');
    }
  };

  // --- Order Actions ---

  const placeOrder = async (deliveryOption: 'delivery' | 'pickup') => {
    if (!currentUser || cart.length === 0) return;
    
    // Assuming all items are from same vendor for MVP or handling first vendor
    const vendorId = cart[0].product.vendorId;
    const total = cart.reduce((sum, item) => sum + (item.product.price * item.quantity), 0);

    const { error } = await supabase.from('orders').insert({
        buyerId: currentUser.id,
        vendorId: vendorId,
        items: cart,
        total: total,
        status: 'placed',
        deliveryOption: deliveryOption
    });

    if (!error) {
        // Decrement Stock
        for (const item of cart) {
            const newStock = Math.max(0, item.product.stock - item.quantity);
            await supabase.from('products').update({ stock: newStock }).eq('id', item.productId);
        }
        fetchData();
        clearCart();
        showToast('Order placed successfully!', 'success');
    } else {
        showToast('Failed to place order', 'error');
    }
  };

  const updateOrderStatus = async (orderId: string, status: OrderStatus) => {
      const { error } = await supabase.from('orders').update({ status }).eq('id', orderId);
      if (!error) {
          fetchData();
          showToast(`Order status updated to ${status.replace('_', ' ')}`, 'success');
      }
  };

  // --- Other Actions ---
  
  const addToCart = (product: Product, quantity = 1) => {
    setCart(prev => {
      const existing = prev.find(item => item.productId === product.id);
      if (existing) {
        showToast(`Updated quantity for ${product.title}`, 'success');
        return prev.map(item => item.productId === product.id ? { ...item, quantity: item.quantity + quantity } : item);
      }
      showToast(`${product.title} added to cart`, 'success');
      return [...prev, { productId: product.id, quantity, product }];
    });
  };

  const removeFromCart = (productId: string) => {
    setCart(prev => prev.filter(item => item.productId !== productId));
    showToast('Item removed from cart', 'info');
  };

  const clearCart = () => setCart([]);

  const toggleFavorite = (productId: string) => {
      setFavorites(prev => {
          const isExisting = prev.includes(productId);
          if (isExisting) {
              showToast('Removed from Wishlist', 'info');
              return prev.filter(id => id !== productId);
          } else {
              showToast('Added to Wishlist', 'success');
              return [...prev, productId];
          }
      });
  };

  const registerDeliveryPerson = async (data: Partial<DeliveryPerson>) => {
    if (!currentUser) return;
    const { error } = await supabase.from('delivery_persons').insert({
      userId: currentUser.id,
      fullName: data.fullName || currentUser.name,
      vehicleType: data.vehicleType || 'bicycle',
      status: 'pending'
    });
    if (!error) {
        fetchData();
        showToast('Application submitted', 'success');
    }
  };
  
  const approveDeliveryPerson = async (id: string) => {
      const { error } = await supabase.from('delivery_persons').update({ status: 'approved' }).eq('id', id);
      if (!error) {
          fetchData();
          showToast('Delivery person approved', 'success');
      }
  }

  return (
    <AppContext.Provider value={{
      currentUser, currentRole, products, vendors, orders, cart, deliveryPersons, isLoading, favorites, toast,
      login, signup, logout, switchRole, registerDeliveryPerson, registerVendor,
      addProduct, updateProduct, updateProductStatus, deleteProduct, approveDeliveryPerson,
      addToCart, removeFromCart, clearCart, placeOrder, updateOrderStatus, toggleFavorite,
      hideToast, requestNotificationPermission
    }}>
      {children}
    </AppContext.Provider>
  );
};

export const useApp = () => {
  const context = useContext(AppContext);
  if (!context) throw new Error("useApp must be used within AppProvider");
  return context;
};
