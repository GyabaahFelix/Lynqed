
import React, { createContext, useContext, useState, useEffect, useRef } from 'react';
import { User, Product, Vendor, Order, CartItem, DeliveryPerson, Role, OrderStatus } from './types';
import { supabase } from './supabaseClient';
import { ToastMessage } from './components/UI';
import { INITIAL_LOCATION_CACHE } from './constants';

interface AppContextType {
  currentUser: User | null;
  currentRole: Role;
  products: Product[];
  vendors: Vendor[];
  orders: Order[];
  cart: CartItem[];
  deliveryPersons: DeliveryPerson[];
  users: User[];
  isLoading: boolean;
  isDataLoading: boolean;
  favorites: string[];
  toast: ToastMessage | null;
  
  login: (email: string, password: string) => Promise<{success: boolean, role?: Role, error?: string}>;
  signup: (email: string, password: string, fullName: string, role: Role) => Promise<{success: boolean, error?: string}>;
  logout: () => Promise<void>;
  resetPassword: (email: string) => Promise<{success: boolean, error?: string}>;
  updatePassword: (password: string) => Promise<{success: boolean, error?: string}>;
  switchRole: (role: Role) => void;
  
  registerDeliveryPerson: (data: Partial<DeliveryPerson>) => Promise<void>;
  registerVendor: (data: { storeName: string; storeDescription: string; location: string; contactPhone: string }) => Promise<void>;
  refreshData: () => Promise<void>;
  
  addProduct: (product: any) => Promise<boolean>;
  updateProduct: (id: string, data: Partial<Product>) => Promise<void>;
  updateProductStatus: (id: string, status: Product['status']) => Promise<void>;
  deleteProduct: (id: string) => Promise<void>;
  
  addToCart: (product: Product, quantity?: number) => void;
  updateCartQuantity: (productId: string, quantity: number) => void;
  removeFromCart: (productId: string) => void;
  clearCart: () => void;
  placeOrder: (deliveryOption: 'delivery' | 'pickup', fee?: number) => Promise<void>;
  updateOrderStatus: (orderId: string, status: OrderStatus) => Promise<void>;
  assignDelivery: (orderId: string) => Promise<void>;
  toggleFavorite: (productId: string) => void;
  
  banUser: (userId: string, status: boolean) => Promise<void>;
  deleteUser: (userId: string) => Promise<void>;
  approveVendor: (vendorId: string, status: boolean) => Promise<void>;
  approveDeliveryPerson: (id: string, userId: string, status: 'approved' | 'rejected' | 'suspended') => Promise<void>;
  
  showToast: (message: string, type: 'success' | 'error' | 'info') => void;
  hideToast: () => void;
  requestNotificationPermission: () => Promise<boolean>;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

// Helper to safely write to localStorage without crashing app if full
const safeSetItem = (key: string, value: string) => {
    try {
        localStorage.setItem(key, value);
    } catch (e) {
        console.warn(`LocalStorage quota exceeded. Failed to save ${key}.`);
    }
};

export const AppProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  
  // FIX: Initialize as empty arrays. Do NOT read large data from localStorage to prevent crash.
  const [products, setProducts] = useState<Product[]>([]);
  const [vendors, setVendors] = useState<Vendor[]>([]);
  const [orders, setOrders] = useState<Order[]>([]);
  const [deliveryPersons, setDeliveryPersons] = useState<DeliveryPerson[]>([]);
  const [users, setUsers] = useState<User[]>([]);

  // Keep small items in Storage
  const [currentRole, setCurrentRole] = useState<Role>(() => {
      try { return (localStorage.getItem('lynqed_role') as Role) || 'guest'; } catch { return 'guest'; }
  });

  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isDataLoading, setIsDataLoading] = useState<boolean>(true);
  const [toast, setToast] = useState<ToastMessage | null>(null);
  
  const [cart, setCart] = useState<CartItem[]>(() => {
      try { return JSON.parse(localStorage.getItem('lynqed_cart') || '[]'); } catch { return []; }
  });
  const [favorites, setFavorites] = useState<string[]>(() => {
      try { return JSON.parse(localStorage.getItem('lynqed_favs') || '[]'); } catch { return []; }
  });

  // State Persistence (Only for small items)
  useEffect(() => { safeSetItem('lynqed_cart', JSON.stringify(cart)); }, [cart]);
  useEffect(() => { safeSetItem('lynqed_favs', JSON.stringify(favorites)); }, [favorites]);
  useEffect(() => { if (currentRole !== 'guest') safeSetItem('lynqed_role', currentRole); }, [currentRole]);

  // CRITICAL FIX: CLEAN UP BLOATED STORAGE ON MOUNT
  useEffect(() => {
      try {
          localStorage.removeItem('lynqed_products');
          localStorage.removeItem('lynqed_vendors');
          localStorage.removeItem('lynqed_orders');
          localStorage.removeItem('lynqed_drivers');
          console.log("Cleaned up heavy local storage items to prevent QuotaExceededError");
      } catch(e) {
          console.error("Cleanup failed", e);
      }
  }, []);

  // Audio Notification Helper
  const playNotificationSound = () => {
      try {
          const AudioContext = window.AudioContext || (window as any).webkitAudioContext;
          if (!AudioContext) return;
          
          const ctx = new AudioContext();
          const osc = ctx.createOscillator();
          const gain = ctx.createGain();
          
          osc.connect(gain);
          gain.connect(ctx.destination);
          
          osc.type = 'sine';
          osc.frequency.setValueAtTime(500, ctx.currentTime);
          osc.frequency.exponentialRampToValueAtTime(1000, ctx.currentTime + 0.1);
          
          gain.gain.setValueAtTime(0.1, ctx.currentTime);
          gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.5);
          
          osc.start();
          osc.stop(ctx.currentTime + 0.5);
      } catch (e) {
          console.error("Audio play failed", e);
      }
  };

  useEffect(() => {
    initApp();
    
    // Realtime subscriptions
    const productSub = supabase.channel('public:products').on('postgres_changes', { event: '*', schema: 'public', table: 'products' }, () => fetchData()).subscribe();
    
    const orderSub = supabase.channel('public:orders').on('postgres_changes', { event: '*', schema: 'public', table: 'orders' }, (payload) => {
          fetchData();
          
          // Enhanced Notification for Vendors
          if (payload.eventType === 'INSERT' && currentRole === 'vendor') {
              const newOrder = payload.new as Order;
              const myVendorId = vendors.find(v => v.userId === currentUser?.id)?.vendorId;
              
              if (myVendorId && newOrder.vendorId === myVendorId) {
                  playNotificationSound();
                  setToast({ message: "🔔 New Order Received!", type: "info" });
                  if (Notification.permission === 'granted') {
                      new Notification("New Order", { body: `Order received for ₵${newOrder.total}` });
                  }
              }
          }
      }).subscribe();

    return () => {
        supabase.removeChannel(productSub);
        supabase.removeChannel(orderSub);
    };
  }, [currentUser, currentRole, vendors]);

  const initApp = async () => {
      await checkSession();
      fetchData();
  };

  const checkSession = async () => {
      try {
          const { data: { session } } = await supabase.auth.getSession();
          if (session?.user) {
              await fetchUserProfile(session.user.id);
          } else {
              setCurrentUser(null);
              setCurrentRole('guest');
          }
      } catch (e) { console.error(e); } 
      finally { setIsLoading(false); }
  };

  const fetchUserProfile = async (userId: string) => {
      try {
          const persistedRole = localStorage.getItem('lynqed_role') as Role;
          const { data } = await supabase.from('profiles').select('*').eq('id', userId).single();
          if (data) {
              if (data.isBanned) {
                  await logout();
                  alert("Account Suspended");
                  return null;
              }
              const user: User = { ...data, roles: data.roles || ['buyer'] };
              setCurrentUser(user);
              
              if (persistedRole && user.roles.includes(persistedRole)) setCurrentRole(persistedRole);
              else setCurrentRole(user.roles.includes('admin') ? 'admin' : user.roles.includes('vendor') ? 'vendor' : 'buyer');
              return user;
          }
      } catch (e) {}
      return null;
  };

  const fetchData = async () => {
      try {
          const fetchSafely = async (table: string, orderBy?: string) => {
             try {
                let query = supabase.from(table).select('*');
                if (orderBy) query = query.order(orderBy, { ascending: false });
                const { data, error } = await query;
                return error ? null : data;
             } catch { return null; }
          };

          const [pData, vData, oData, dData] = await Promise.all([
              fetchSafely('products', 'created_at'),
              fetchSafely('vendors'),
              fetchSafely('orders', 'created_at'),
              fetchSafely('delivery_persons')
          ]);

          if (pData) setProducts(pData as Product[]);
          if (vData) setVendors(vData as Vendor[]);
          if (oData) {
              setOrders(oData.map((o: any) => ({
                  ...o, items: typeof o.items === 'string' ? JSON.parse(o.items) : o.items
              })) as Order[]);
          }
          if (dData) setDeliveryPersons(dData as DeliveryPerson[]);

          if (localStorage.getItem('lynqed_role') === 'admin') {
              const uData = await fetchSafely('profiles');
              if (uData) setUsers(uData as any);
          }
      } catch (e) { console.error(e); } 
      finally { setIsDataLoading(false); }
  };

  // Auth Functions (Login, Signup, Logout, Reset...)
  const login = async (email: string, pass: string) => {
      const { data, error } = await supabase.auth.signInWithPassword({ email, password: pass });
      if (error) return { success: false, error: error.message };
      if (data.user) {
          const user = await fetchUserProfile(data.user.id);
          fetchData();
          
          let role: Role = 'buyer';
          if (user) {
              const persistedRole = localStorage.getItem('lynqed_role') as Role;
              if (persistedRole && user.roles.includes(persistedRole)) {
                  role = persistedRole;
              } else {
                   if (user.roles.includes('admin')) role = 'admin';
                   else if (user.roles.includes('vendor')) role = 'vendor';
                   else if (user.roles.includes('deliveryPerson')) role = 'deliveryPerson';
              }
          }
          return { success: true, role }; 
      }
      return { success: false };
  };

  const signup = async (email: string, password: string, fullName: string, role: Role) => {
      const { data, error } = await supabase.auth.signUp({ email, password, options: { data: { full_name: fullName, roles: [role] } } });
      if (error) return { success: false, error: error.message };
      if (data.user) {
           await supabase.from('profiles').insert({ id: data.user.id, email, name: fullName, roles: [role] });
           await login(email, password);
           return { success: true };
      }
      return { success: false };
  };

  const logout = async () => {
      await supabase.auth.signOut();
      localStorage.removeItem('lynqed_role');
      // No need to clear other big items as they are not persisted anymore
      setCurrentUser(null);
      setCurrentRole('guest');
      setCart([]);
  };

  const resetPassword = async (email: string) => { return { success: true }; };
  const updatePassword = async (pass: string) => { return { success: true }; };
  const switchRole = (role: Role) => { if(currentUser?.roles.includes(role)) setCurrentRole(role); };
  
  // Utils
  const showToast = (message: string, type: 'success'|'error'|'info') => setToast({message, type});
  const hideToast = () => setToast(null);
  const requestNotificationPermission = async () => (await Notification.requestPermission()) === 'granted';

  // Specific Actions
  const registerVendor = async (data: any) => {
      if(!currentUser) return;
      await supabase.from('vendors').insert({ vendorId: `v-${Date.now()}`, userId: currentUser.id, ...data, isApproved: false, rating: 5.0 });
      showToast("Store application submitted", "success"); fetchData();
  };
  const registerDeliveryPerson = async (data: any) => {
      if(!currentUser) return;
      await supabase.from('delivery_persons').insert({ userId: currentUser.id, ...data, status: 'pending' });
      showToast("Rider application submitted", "success"); fetchData();
  };
  const addProduct = async (prod: any) => {
      if(!currentUser) return false;
      const v = vendors.find(v => v.userId === currentUser.id);
      if(!v) return false;
      const { customCategory, ...dbProduct } = prod;
      await supabase.from('products').insert({ ...dbProduct, vendorId: v.vendorId, status: 'pending' });
      showToast("Product submitted", "success"); fetchData(); return true;
  };
  const updateProduct = async (id: string, data: any) => {
      const { customCategory, ...dbData } = data;
      await supabase.from('products').update(dbData).eq('id', id); fetchData();
  };
  const deleteProduct = async (id: string) => { await supabase.from('products').delete().eq('id', id); fetchData(); };
  const updateProductStatus = async (id: string, status: string) => { await supabase.from('products').update({status}).eq('id', id); fetchData(); };
  
  const addToCart = (product: Product, quantity = 1) => {
      setCart(prev => {
          const exists = prev.find(i => i.productId === product.id);
          if (exists) return prev.map(i => i.productId === product.id ? { ...i, quantity: i.quantity + quantity } : i);
          return [...prev, { productId: product.id, quantity, product }];
      });
      showToast("Added to Cart", "success");
  };
  const updateCartQuantity = (pid: string, qty: number) => {
      if(qty <= 0) removeFromCart(pid);
      else setCart(prev => prev.map(i => i.productId === pid ? { ...i, quantity: qty } : i));
  };
  const removeFromCart = (pid: string) => setCart(prev => prev.filter(i => i.productId !== pid));
  const clearCart = () => setCart([]);
  
  const toggleFavorite = (pid: string) => {
      const isFav = favorites.includes(pid);
      if (isFav) {
          setFavorites(prev => prev.filter(i => i !== pid));
          showToast("Removed from Wishlist", "info");
      } else {
          setFavorites(prev => [...prev, pid]);
          showToast("Added to Wishlist ❤️", "success");
      }
  };
  
  const placeOrder = async (option: 'delivery'|'pickup', fee = 0) => {
      if (!currentUser) return;
      const byVendor: any = {};
      cart.forEach(i => { if(!byVendor[i.product.vendorId]) byVendor[i.product.vendorId]=[]; byVendor[i.product.vendorId].push(i); });
      
      try {
          for(const vid in byVendor) {
              const items = byVendor[vid];
              const subtotal = items.reduce((s:number, i:any) => s + i.product.price * i.quantity, 0);
              
              const { error } = await supabase.from('orders').insert({ 
                  buyerId: currentUser.id, 
                  vendorId: vid, 
                  items, 
                  total: subtotal+fee, 
                  deliveryFee: fee, 
                  status: 'placed', 
                  deliveryOption: option 
              });

              if (error) {
                  // Fallback if deliveryFee column missing
                  if (error.message.includes('deliveryFee')) {
                      await supabase.from('orders').insert({ 
                          buyerId: currentUser.id, 
                          vendorId: vid, 
                          items, 
                          total: subtotal+fee, 
                          status: 'placed', 
                          deliveryOption: option 
                      });
                  } else {
                      throw error;
                  }
              }
          }
          showToast("Order Placed!", "success"); 
          clearCart(); 
          fetchData();
      } catch (e: any) {
          console.error("Order failed:", e);
          showToast(`Order failed: ${e.message}`, "error");
      }
  };
  const updateOrderStatus = async (oid: string, status: string) => { await supabase.from('orders').update({status}).eq('id', oid); fetchData(); };
  const assignDelivery = async (oid: string) => { if(currentUser) await supabase.from('orders').update({deliveryPersonId: currentUser.id, status: 'assigned'}).eq('id', oid); fetchData(); };
  
  // Admin
  const banUser = async (uid: string, s: boolean) => { await supabase.from('profiles').update({isBanned: s}).eq('id', uid); fetchData(); };
  const deleteUser = async (uid: string) => { await supabase.from('profiles').delete().eq('id', uid); fetchData(); };
  const approveVendor = async (vid: string, s: boolean) => { await supabase.from('vendors').update({isApproved: s}).eq('vendorId', vid); fetchData(); };
  const approveDeliveryPerson = async (id: string, uid: string, status: string) => { 
      await supabase.from('delivery_persons').update({status}).eq('id', id);
      if(status === 'approved') await supabase.from('profiles').update({roles: ['deliveryPerson']}).eq('id', uid); 
      fetchData(); 
  };

  return (
    <AppContext.Provider value={{
        currentUser, currentRole, products, vendors, orders, deliveryPersons, users, isLoading, isDataLoading, cart, favorites, toast,
        login, signup, logout, resetPassword, updatePassword, switchRole,
        registerVendor, registerDeliveryPerson, refreshData: fetchData,
        addProduct, updateProduct, updateProductStatus, deleteProduct,
        addToCart, updateCartQuantity, removeFromCart, clearCart, placeOrder, updateOrderStatus, assignDelivery, toggleFavorite,
        banUser, deleteUser, approveVendor, approveDeliveryPerson,
        showToast, hideToast, requestNotificationPermission
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
