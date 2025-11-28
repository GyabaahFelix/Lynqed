
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
  approveDeliveryPerson: (id: string, userId: string, status: 'approved' | 'rejected' | 'suspended') => Promise<void>;
  
  // UI Actions
  showToast: (message: string, type: 'success' | 'error' | 'info') => void;
  hideToast: () => void;
  requestNotificationPermission: () => Promise<boolean>;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

export const AppProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  
  // Initialize Role from LocalStorage
  const [currentRole, setCurrentRole] = useState<Role>(() => {
      try {
        const saved = localStorage.getItem('lynqed_role');
        return (saved as Role) || 'guest';
      } catch (e) {
        return 'guest';
      }
  });

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
  
  useEffect(() => {
      if (currentRole !== 'guest') {
          localStorage.setItem('lynqed_role', currentRole);
      }
  }, [currentRole]);

  // --- INITIAL LOAD ---
  useEffect(() => {
    // We start init immediately
    initApp();
    
    // Realtime subscriptions
    const productSub = supabase.channel('public:products').on('postgres_changes', { event: '*', schema: 'public', table: 'products' }, () => fetchData()).subscribe();
    const orderSub = supabase.channel('public:orders').on('postgres_changes', { event: '*', schema: 'public', table: 'orders' }, (payload) => {
          fetchData();
      }).subscribe();

    return () => {
        supabase.removeChannel(productSub);
        supabase.removeChannel(orderSub);
    };
  }, []);

  const initApp = async () => {
      // 1. Check Session First
      await checkSession();
      // 2. Fetch Data in background (Don't block UI if possible)
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
              localStorage.removeItem('lynqed_role');
          }
      } catch (e) {
          console.error("Session check failed", e);
      } finally {
          // Crucial: Stop loading spinner regardless of data fetch status
          setIsLoading(false);
      }
  };

  const fetchUserProfile = async (userId: string): Promise<User | null> => {
      try {
          const persistedRole = localStorage.getItem('lynqed_role') as Role;

          let { data, error } = await supabase.from('profiles').select('*').eq('id', userId).single();
          
          if (data) {
              if (data.isBanned) {
                  await supabase.auth.signOut();
                  localStorage.removeItem('lynqed_role');
                  alert("Your account has been suspended by an administrator.");
                  setCurrentUser(null);
                  setCurrentRole('guest');
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
              
              const isPersistedRoleValid = persistedRole && user.roles.includes(persistedRole);

              if (isPersistedRoleValid) {
                  setCurrentRole(persistedRole);
              } else {
                  if (user.roles.includes('admin')) setCurrentRole('admin');
                  else if (user.roles.includes('vendor')) setCurrentRole('vendor');
                  else if (user.roles.includes('deliveryPerson')) setCurrentRole('deliveryPerson');
                  else setCurrentRole('buyer');
              }
              return user;
          }
      } catch (e) {
          console.error("Profile fetch error", e);
      }
      return null;
  };

  const fetchData = async () => {
      try {
          // Optimized: Parallel Data Fetching
          const fetchSafely = async (table: string, orderBy?: string) => {
             try {
                let query = supabase.from(table).select('*');
                if (orderBy) query = query.order(orderBy, { ascending: false });
                const { data, error } = await query;
                if (error) return null;
                return data;
             } catch (e) { return null; }
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
              const mapped = oData.map((o: any) => ({
                  ...o,
                  items: typeof o.items === 'string' ? JSON.parse(o.items) : o.items
              }));
              setOrders(mapped as Order[]);
          }

          if (dData) setDeliveryPersons(dData as DeliveryPerson[]);

          // Admin only data - Lazy load
          if (localStorage.getItem('lynqed_role') === 'admin') {
              const uData = await fetchSafely('profiles');
              if (uData) setUsers(uData as any);
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
          // Force fresh fetch on login
          fetchData();
          
          if (user) {
              let targetRole: Role = 'buyer';
              if (user.roles.includes('admin')) targetRole = 'admin';
              else if (user.roles.includes('vendor')) targetRole = 'vendor';
              else if (user.roles.includes('deliveryPerson')) targetRole = 'deliveryPerson';
              
              setCurrentRole(targetRole);
              return { success: true, role: targetRole };
          }
      }
      return { success: false, error: "User profile not found" };
  };

  const signup = async (email: string, password: string, fullName: string, role: Role) => {
      const { data, error } = await supabase.auth.signUp({
          email, password,
          options: { data: { full_name: fullName, roles: [role] } }
      });
      if (error?.message?.includes("already registered")) {
           const loginRes = await supabase.auth.signInWithPassword({ email, password });
           if (loginRes.data.user) {
               // Self-heal profile if missing
               const { data: p } = await supabase.from('profiles').select('id').eq('id', loginRes.data.user.id).single();
               if (!p) {
                   await supabase.from('profiles').insert({
                       id: loginRes.data.user.id,
                       email, name: fullName, roles: [role]
                   });
               }
               await login(email, password);
               return { success: true };
           }
          return { success: false, error: "Email already registered. Please login." };
      }
      if (data.user) {
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
      localStorage.removeItem('lynqed_role'); 
      setCurrentUser(null);
      setCurrentRole('guest');
      setCart([]);
  };

  const switchRole = (role: Role) => {
      if (currentUser?.roles.includes(role)) {
          setCurrentRole(role);
      }
  };

  // --- Admin Logic ---
  const banUser = async (userId: string, status: boolean) => {
      await supabase.from('profiles').update({ isBanned: status }).eq('id', userId);
      showToast(status ? "User Banned" : "User Unbanned", "info");
      fetchData();
  };

  const deleteUser = async (userId: string) => {
      await supabase.from('profiles').delete().eq('id', userId);
      showToast("User deleted", "error");
      fetchData();
  };

  const approveVendor = async (vendorId: string, status: boolean) => {
      await supabase.from('vendors').update({ isApproved: status }).eq('vendorId', vendorId);
      showToast(status ? "Vendor Approved" : "Vendor Suspended", status ? "success" : "error");
      fetchData();
  };

  const approveDeliveryPerson = async (id: string, userId: string, status: 'approved' | 'rejected' | 'suspended') => {
      await supabase.from('delivery_persons').update({ status }).eq('id', id);
      if (status === 'approved') {
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
      if (!currentUser) {
          alert("Session expired. Please log in again.");
          return false;
      }

      try {
          // 1. Force Fetch Vendor ID to ensure accuracy
          const { data: vData, error: vError } = await supabase
              .from('vendors')
              .select('vendorId')
              .eq('userId', currentUser.id)
              .single();

          if (vError || !vData) {
              console.error("Vendor lookup failed:", vError);
              alert("Error: Could not identify your vendor profile. Ensure you have registered as a vendor.");
              return false;
          }

          // Sanitize: Remove UI-only fields
          const { customCategory, ...dbProduct } = prod;

          // 2. Insert
          const { error } = await supabase.from('products').insert({
              ...dbProduct, 
              vendorId: vData.vendorId, 
              status: 'pending'
          });

          if (error) {
              console.error("Product insert error:", error);
              alert(`Database Error: ${error.message} (Code: ${error.code})`);
              return false;
          }
          
          showToast("Product submitted for approval", "success"); 
          fetchData(); 
          return true;
      } catch (e: any) {
          alert(`Unexpected Error: ${e.message}`);
          return false;
      }
  };
  
  const updateProduct = async (id: string, data: any) => {
      const { customCategory, ...dbData } = data;
      const { error } = await supabase.from('products').update(dbData).eq('id', id);
      if (error) {
        showToast(`Update failed: ${error.message}`, "error");
      } else {
        showToast("Product updated", "success");
        fetchData();
      }
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
      const isFav = favorites.includes(pid);
      setFavorites(prev => isFav ? prev.filter(i => i !== pid) : [...prev, pid]);
      showToast(isFav ? "Removed from Wishlist" : "Added to Wishlist", "info");
  };

  const placeOrder = async (option: 'delivery' | 'pickup', fee = 0) => {
      if (cart.length === 0) return;
      
      const session = await supabase.auth.getSession();
      const currentUserId = currentUser ? currentUser.id : session.data.session?.user?.id;
      
      if (!currentUserId) {
          alert("Please login to place an order");
          return;
      }

      const byVendor: Record<string, CartItem[]> = {};
      cart.forEach(i => {
          if (!byVendor[i.product.vendorId]) byVendor[i.product.vendorId] = [];
          byVendor[i.product.vendorId].push(i);
      });

      for (const vid in byVendor) {
          const items = byVendor[vid];
          const subtotal = items.reduce((s, i) => s + (i.product.price * i.quantity), 0);
          
          const { error } = await supabase.from('orders').insert({
              buyerId: currentUserId, 
              vendorId: vid,
              items: items, // Supabase client auto-stringifies JSONB
              total: subtotal + fee,
              deliveryFee: fee,
              status: 'placed',
              deliveryOption: option
          });

          if (error) {
              console.error("Order placement failed:", error);
              alert(`Order failed: ${error.message}`);
              return;
          }
          
          // Stock reduction
          for (const item of items) {
              const newStock = Math.max(0, item.product.stock - item.quantity);
              await supabase.from('products').update({stock: newStock}).eq('id', item.productId);
          }
      }
      showToast("Order Placed Successfully!", "success");
      clearCart();
      fetchData(); // Force refresh to show new orders immediately
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
          isApproved: false,
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
