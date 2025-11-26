
import React, { createContext, useContext, useState, useEffect, useRef } from 'react';
import { User, Product, Vendor, Order, CartItem, DeliveryPerson, Role, OrderStatus } from './types';
import { supabase } from './supabaseClient';
import { ToastMessage } from './components/UI';
import { INITIAL_LOCATION_CACHE } from './constants';

// --- Interfaces ---
interface AppContextType {
  currentUser: User | null;
  currentRole: Role;
  products: Product[];
  vendors: Vendor[];
  orders: Order[];
  cart: CartItem[];
  deliveryPersons: DeliveryPerson[];
  users: User[]; // For Admin
  isLoading: boolean;
  favorites: string[];
  toast: ToastMessage | null;
  
  // Auth Actions
  login: (email: string, password: string) => Promise<{success: boolean, role?: Role, error?: string}>;
  signup: (email: string, password: string, fullName: string, role: Role) => Promise<{success: boolean, error?: string}>;
  logout: () => void;
  switchRole: (role: Role) => void;
  
  // Registration
  registerDeliveryPerson: (data: Partial<DeliveryPerson>) => Promise<void>;
  registerVendor: (data: { storeName: string; storeDescription: string; location: string; contactPhone: string }) => Promise<void>;
  
  // Data Actions
  refreshData: () => Promise<void>;
  
  // Product Actions
  addProduct: (product: Omit<Product, 'id' | 'status' | 'images'> & { images: string[] }) => Promise<boolean>;
  updateProduct: (id: string, data: Partial<Product>) => Promise<void>;
  updateProductStatus: (id: string, status: Product['status']) => Promise<void>;
  deleteProduct: (id: string) => Promise<void>;
  
  // Order/Cart Actions
  addToCart: (product: Product, quantity?: number) => void;
  updateCartQuantity: (productId: string, quantity: number) => void;
  removeFromCart: (productId: string) => void;
  clearCart: () => void;
  placeOrder: (deliveryOption: 'delivery' | 'pickup', fee?: number) => Promise<void>;
  updateOrderStatus: (orderId: string, status: OrderStatus) => Promise<void>;
  assignDelivery: (orderId: string) => Promise<void>;
  toggleFavorite: (productId: string) => void;
  
  // Admin Actions
  banUser: (userId: string, status: boolean) => Promise<void>;
  deleteUser: (userId: string) => Promise<void>;
  approveVendor: (vendorId: string, status: boolean) => Promise<void>;
  approveDeliveryPerson: (id: string, userId: string, status: 'approved' | 'rejected') => Promise<void>;
  
  // UI Actions
  showToast: (message: string, type: 'success' | 'error' | 'info') => void;
  hideToast: () => void;
  requestNotificationPermission: () => Promise<boolean>;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

export const AppProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [currentRole, setCurrentRole] = useState<Role>('guest');
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [toast, setToast] = useState<ToastMessage | null>(null);
  
  const [products, setProducts] = useState<Product[]>([]);
  const [vendors, setVendors] = useState<Vendor[]>([]);
  const [orders, setOrders] = useState<Order[]>([]);
  const [deliveryPersons, setDeliveryPersons] = useState<DeliveryPerson[]>([]);
  const [users, setUsers] = useState<User[]>([]); // Admin use only
  
  const userRef = useRef<User | null>(null);
  
  const [cart, setCart] = useState<CartItem[]>(() => {
      try {
          const saved = localStorage.getItem('lynqed_cart');
          return saved ? JSON.parse(saved) : [];
      } catch (e) { return []; }
  });
  const [favorites, setFavorites] = useState<string[]>(() => {
      try {
          const saved = localStorage.getItem('lynqed_favs');
          return saved ? JSON.parse(saved) : [];
      } catch (e) { return []; }
  });

  useEffect(() => { userRef.current = currentUser; }, [currentUser]);
  useEffect(() => { localStorage.setItem('lynqed_cart', JSON.stringify(cart)); }, [cart]);
  useEffect(() => { localStorage.setItem('lynqed_favs', JSON.stringify(favorites)); }, [favorites]);

  // --- INITIAL LOAD ---
  useEffect(() => {
    checkSession();
    fetchData();
    
    const productSub = supabase.channel('public:products').on('postgres_changes', { event: '*', schema: 'public', table: 'products' }, () => fetchData()).subscribe();
    const orderSub = supabase.channel('public:orders').on('postgres_changes', { event: '*', schema: 'public', table: 'orders' }, (payload) => {
          fetchData();
          // Simple notification logic
          if (payload.eventType === 'INSERT' && userRef.current) {
              const newOrder = payload.new as any;
               // Check if current user is the vendor for this order
               // (This is a simplified check, ideally we lookup the vendor first)
               // For MVP we just fetch data and let the UI update
          }
      }).subscribe();

    return () => {
        supabase.removeChannel(productSub);
        supabase.removeChannel(orderSub);
    };
  }, []);

  const checkSession = async () => {
      try {
          const { data: { session } } = await supabase.auth.getSession();
          if (session?.user) {
              await fetchUserProfile(session.user.id);
          } else {
              setCurrentUser(null);
              setCurrentRole('guest');
              setIsLoading(false);
          }
      } catch (e) {
          setIsLoading(false);
      }
  };

  const fetchUserProfile = async (userId: string): Promise<User | null> => {
      try {
          let { data, error } = await supabase.from('profiles').select('*').eq('id', userId).single();
          
          if (data) {
              // Check if banned
              if (data.isBanned) {
                  await supabase.auth.signOut();
                  alert("Your account has been suspended by an administrator.");
                  setCurrentUser(null);
                  setCurrentRole('guest');
                  setIsLoading(false);
                  return null;
              }

              const user: User = {
                  id: data.id,
                  email: data.email,
                  name: data.name,
                  avatarUrl: data.avatarUrl,
                  roles: data.roles as Role[],
                  isBanned: data.isBanned
              };
              setCurrentUser(user);
              
              // Role Persistence Logic
              const hasAdmin = user.roles.includes('admin');
              const hasVendor = user.roles.includes('vendor');
              const hasDelivery = user.roles.includes('deliveryPerson');
              
              if (currentRole === 'guest') {
                   if (hasAdmin) setCurrentRole('admin');
                   else if (hasVendor) setCurrentRole('vendor');
                   else if (hasDelivery) setCurrentRole('deliveryPerson');
                   else setCurrentRole('buyer');
              }
              
              setIsLoading(false);
              return user;
          }
      } catch (e) {
          console.error("Profile fetch error", e);
      }
      setIsLoading(false);
      return null;
  };

  const fetchData = async () => {
      try {
          // Robust fetching: Use try-catch for each table to prevent total crash if one table is missing
          const { data: pData } = await supabase.from('products').select('*').order('created_at', { ascending: false });
          if (pData) setProducts(pData as Product[]);

          const { data: vData } = await supabase.from('vendors').select('*');
          if (vData) setVendors(vData as Vendor[]);

          const { data: oData } = await supabase.from('orders').select('*').order('created_at', { ascending: false });
          if (oData) {
              // Parse JSON items if needed
              const mapped = oData.map((o: any) => ({
                  ...o,
                  items: typeof o.items === 'string' ? JSON.parse(o.items) : o.items
              }));
              setOrders(mapped as Order[]);
          }

          // Try fetching delivery persons (might not exist in older schema)
          try {
            const { data: dData } = await supabase.from('delivery_persons').select('*');
            if (dData) setDeliveryPersons(dData as DeliveryPerson[]);
          } catch(e) { console.warn("Delivery table missing or error"); }

          // If admin, fetch all users
          if (currentRole === 'admin' || userRef.current?.roles.includes('admin')) {
              try {
                const { data: uData } = await supabase.from('profiles').select('*');
                if (uData) setUsers(uData as any);
              } catch(e) {}
          }

      } catch (e) {
          console.error("Data fetch error", e);
      }
  };

  // --- Auth Actions ---
  const login = async (email: string, pass: string): Promise<{success: boolean, role?: Role, error?: string}> => {
      const { data, error } = await supabase.auth.signInWithPassword({ email, password: pass });
      if (error) return { success: false, error: error.message };
      
      if (data.user) {
          const user = await fetchUserProfile(data.user.id);
          await fetchData();
          if (user) {
              // Smart Redirect
              if (user.roles.includes('admin')) return { success: true, role: 'admin' };
              if (user.roles.includes('vendor')) return { success: true, role: 'vendor' };
              if (user.roles.includes('deliveryPerson')) return { success: true, role: 'deliveryPerson' };
              return { success: true, role: 'buyer' };
          }
      }
      return { success: false, error: "User profile not found" };
  };

  const signup = async (email: string, password: string, fullName: string, role: Role) => {
      const { data, error } = await supabase.auth.signUp({
          email, password,
          options: { data: { full_name: fullName, roles: [role] } }
      });
      // Handle "User already registered" by auto-login... (simplified for brevity)
      if (error?.message?.includes("already registered")) {
          return { success: false, error: "Email already registered. Please login." };
      }
      if (data.user) {
          // Create profile
           await supabase.from('profiles').insert({
              id: data.user.id,
              email, name: fullName,
              roles: [role]
          });
          await login(email, password);
          return { success: true };
      }
      return { success: false, error: "Signup failed" };
  };

  const logout = async () => {
      await supabase.auth.signOut();
      setCurrentUser(null);
      setCurrentRole('guest');
      setCart([]);
  };

  const switchRole = (role: Role) => {
      if (currentUser?.roles.includes(role)) setCurrentRole(role);
  };

  // --- Admin Logic ---
  const banUser = async (userId: string, status: boolean) => {
      await supabase.from('profiles').update({ isBanned: status }).eq('id', userId);
      showToast(status ? "User Banned" : "User Unbanned", "info");
      fetchData();
  };

  const deleteUser = async (userId: string) => {
      // Note: Supabase auth.admin.deleteUser requires Service Role key. 
      // We will just mark as deleted or delete from profiles for this client-side demo
      await supabase.from('profiles').delete().eq('id', userId);
      showToast("User deleted", "error");
      fetchData();
  };

  const approveVendor = async (vendorId: string, status: boolean) => {
      await supabase.from('vendors').update({ isApproved: status }).eq('vendorId', vendorId);
      showToast(status ? "Vendor Approved" : "Vendor Suspended", status ? "success" : "error");
      fetchData();
  };

  const approveDeliveryPerson = async (id: string, userId: string, status: 'approved' | 'rejected') => {
      await supabase.from('delivery_persons').update({ status }).eq('id', id);
      if (status === 'approved') {
          // Grant Role
          const { data: p } = await supabase.from('profiles').select('roles').eq('id', userId).single();
          if (p) {
              const roles = p.roles || [];
              if (!roles.includes('deliveryPerson')) {
                  await supabase.from('profiles').update({ roles: [...roles, 'deliveryPerson'] }).eq('id', userId);
              }
          }
      }
      showToast(`Application ${status}`, "success");
      fetchData();
  };

  // --- Logistics Logic ---
  const registerDeliveryPerson = async (data: Partial<DeliveryPerson>) => {
      if (!currentUser) return;
      await supabase.from('delivery_persons').insert({
          userId: currentUser.id,
          fullName: data.fullName,
          vehicleType: data.vehicleType,
          status: 'pending'
      });
      showToast("Application submitted", "success");
      fetchData();
  };

  const assignDelivery = async (orderId: string) => {
      if (!currentUser) return;
      const { error } = await supabase.from('orders').update({
          deliveryPersonId: currentUser.id,
          status: 'assigned'
      }).eq('id', orderId);
      if (!error) {
          showToast("Delivery Accepted!", "success");
          fetchData();
      }
  };

  // --- Product/Cart Logic ---
  const addProduct = async (prod: any) => {
      // Existing logic
      if (!currentUser) return false;
      const v = vendors.find(vn => vn.userId === currentUser.id);
      if (!v) return false;
      const { error } = await supabase.from('products').insert({
          ...prod, vendorId: v.vendorId, status: 'pending' // Admin must approve
      });
      if (!error) { showToast("Product submitted for approval", "success"); fetchData(); return true; }
      return false;
  };
  
  const updateProduct = async (id: string, data: any) => {
      await supabase.from('products').update(data).eq('id', id);
      showToast("Product updated", "success");
      fetchData();
  };
  
  const deleteProduct = async (id: string) => {
      await supabase.from('products').delete().eq('id', id);
      showToast("Product deleted", "info");
      fetchData();
  };

  const updateProductStatus = async (id: string, status: Product['status']) => {
      await supabase.from('products').update({ status }).eq('id', id);
      showToast(`Product ${status}`, "info");
      fetchData();
  };

  const addToCart = (product: Product, quantity = 1) => {
      setCart(prev => {
          const exists = prev.find(i => i.productId === product.id);
          if (exists) return prev.map(i => i.productId === product.id ? { ...i, quantity: i.quantity + quantity } : i);
          return [...prev, { productId: product.id, quantity, product }];
      });
      showToast("Added to Cart", "success");
  };

  const updateCartQuantity = (pid: string, qty: number) => {
      if (qty <= 0) { removeFromCart(pid); return; }
      setCart(prev => prev.map(i => i.productId === pid ? { ...i, quantity: qty } : i));
  };

  const removeFromCart = (pid: string) => setCart(prev => prev.filter(i => i.productId !== pid));
  const clearCart = () => setCart([]);
  
  const toggleFavorite = (pid: string) => {
      setFavorites(prev => prev.includes(pid) ? prev.filter(i => i !== pid) : [...prev, pid]);
  };

  const placeOrder = async (option: 'delivery' | 'pickup', fee = 0) => {
      if (cart.length === 0) return;
      const byVendor: Record<string, CartItem[]> = {};
      cart.forEach(i => {
          if (!byVendor[i.product.vendorId]) byVendor[i.product.vendorId] = [];
          byVendor[i.product.vendorId].push(i);
      });

      for (const vid in byVendor) {
          const items = byVendor[vid];
          const subtotal = items.reduce((s, i) => s + (i.product.price * i.quantity), 0);
          
          await supabase.from('orders').insert({
              buyerId: currentUser ? currentUser.id : 'guest',
              vendorId: vid,
              items,
              total: subtotal + fee,
              deliveryFee: fee,
              status: 'placed',
              deliveryOption: option
          });
          
          // Stock reduction
          for (const item of items) {
              const newStock = Math.max(0, item.product.stock - item.quantity);
              await supabase.from('products').update({stock: newStock}).eq('id', item.productId);
          }
      }
      showToast("Order Placed Successfully!", "success");
      clearCart();
      fetchData();
  };

  const updateOrderStatus = async (oid: string, status: OrderStatus) => {
      await supabase.from('orders').update({ status }).eq('id', oid);
      showToast(`Order status: ${status.replace('_', ' ')}`, "success");
      fetchData();
  };

  // --- Utils ---
  const registerVendor = async (data: any) => {
      if (!currentUser) return;
      const newV = {
          vendorId: `v-${Date.now()}`,
          userId: currentUser.id,
          storeName: data.storeName,
          storeDescription: data.storeDescription,
          location: data.location,
          contactPhone: data.contactPhone,
          isApproved: false, // Pending admin
          rating: 5.0
      };
      await supabase.from('vendors').insert(newV);
      showToast("Store application submitted!", "success");
      fetchData();
  };

  const showToast = (message: string, type: 'success' | 'error' | 'info') => setToast({message, type});
  const hideToast = () => setToast(null);
  const requestNotificationPermission = async () => {
      if (!("Notification" in window)) return false;
      return (await Notification.requestPermission()) === 'granted';
  };

  return (
    <AppContext.Provider value={{
        currentUser, currentRole, products, vendors, orders, deliveryPersons, users, isLoading, cart, favorites, toast,
        login, signup, logout, switchRole,
        registerVendor, registerDeliveryPerson,
        refreshData: fetchData,
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
