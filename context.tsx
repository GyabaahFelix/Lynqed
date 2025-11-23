
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
  refreshData: () => Promise<void>;
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
  assignDelivery: (orderId: string) => Promise<void>; // New
  toggleFavorite: (productId: string) => void;
  
  // UI Actions
  showToast: (message: string, type: 'success' | 'error' | 'info') => void;
  hideToast: () => void;
  requestNotificationPermission: () => Promise<boolean>;

  // Vendor/Admin Actions
  approveDeliveryPerson: (id: string, userId: string) => void; // Updated signature
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
          fetchData(); 
      })
      .subscribe();
      
    // Subscribe to Realtime changes for New Orders
    const orderSubscription = supabase
      .channel('public:orders')
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'orders' }, async (payload) => {
          const newOrder = payload.new as any;
          
          if (userRef.current) {
              const { data: vendorData } = await supabase
                  .from('vendors')
                  .select('*')
                  .eq('vendorId', newOrder.vendorId)
                  .single();
              
              const vUserId = vendorData?.userId;

              if (vUserId && vUserId === userRef.current.id) {
                  playNotificationSound();
                  showToast(`New Order! ₵${newOrder.total}`, 'info');
                  sendBrowserNotification(newOrder);
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
          console.error("Session check failed", e);
          setIsLoading(false);
      }
  };

  const fetchUserProfile = async (userId: string): Promise<User | null> => {
      try {
          let { data, error } = await supabase
            .from('profiles')
            .select('*')
            .eq('id', userId)
            .single();
          
          if (!data) {
              const { data: { user } } = await supabase.auth.getUser();
              if (user && user.user_metadata) {
                  const meta = user.user_metadata;
                  const avatar = meta.avatar_url || null;
                  const userRoles = meta.roles || ['buyer'];
                  
                  const { error: insertError } = await supabase.from('profiles').insert({
                      id: user.id,
                      email: user.email,
                      name: meta.full_name || 'User',
                      avatarUrl: avatar,
                      roles: userRoles
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
                  avatarUrl: data.avatarUrl,
                  roles: data.roles as Role[]
              };
              setCurrentUser(user);
              
              const hasAdmin = user.roles.includes('admin');
              const hasVendor = user.roles.includes('vendor');
              const hasDelivery = user.roles.includes('deliveryPerson');
              
              if(hasAdmin && currentRole === 'admin') {
                  // Keep admin
              } else if (hasVendor && currentRole === 'vendor') {
                  // Keep vendor
              } else if (hasDelivery && currentRole === 'deliveryPerson') {
                  // Keep delivery
              } else {
                   const defaultRole = hasVendor ? 'vendor' : hasAdmin ? 'admin' : 'buyer';
                   setCurrentRole(defaultRole);
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
          const { data: prodData } = await supabase.from('products').select('*').order('created_at', { ascending: false });
          if (prodData) setProducts(prodData as Product[]);

          const { data: vendData } = await supabase.from('vendors').select('*');
          if (vendData) setVendors(vendData as Vendor[]);

          const { data: ordData } = await supabase.from('orders').select('*').order('created_at', { ascending: false });
          if (ordData) {
             const mappedOrders = ordData.map((o: any) => ({
                 ...o,
                 items: typeof o.items === 'string' ? JSON.parse(o.items) : o.items
             }));
             setOrders(mappedOrders as Order[]);
          }

          const { data: delData } = await supabase.from('delivery_persons').select('*');
          if (delData) setDeliveryPersons(delData as DeliveryPerson[]);
      } catch (e) {
          console.error("Data fetch error", e);
      }
  };

  // --- Auth Actions ---
  const login = async (email: string, pass: string): Promise<{success: boolean, role?: Role, error?: string}> => {
      try {
          const { data, error } = await supabase.auth.signInWithPassword({ email, password: pass });
          if (error) throw error;
          
          if (data.user) {
              const user = await fetchUserProfile(data.user.id);
              await fetchData();

              if (user) {
                   if (user.roles.includes('admin')) return { success: true, role: 'admin' };
                   if (user.roles.includes('vendor')) return { success: true, role: 'vendor' };
                   if (user.roles.includes('deliveryPerson')) return { success: true, role: 'deliveryPerson' };
                   return { success: true, role: 'buyer' };
              }
          }
          return { success: false, error: "Profile not found" };
      } catch (e: any) {
          return { success: false, error: e.message || "Login failed" };
      }
  };

  const signup = async (email: string, password: string, fullName: string, role: Role) => {
      try {
          const { data, error } = await supabase.auth.signUp({
              email, 
              password,
              options: {
                  data: {
                      full_name: fullName,
                      roles: [role]
                  }
              }
          });

          if (error?.message === "User already registered" || error?.toString().includes("already registered")) {
              const { data: loginData, error: loginError } = await supabase.auth.signInWithPassword({ email, password });
              if (!loginError && loginData.user) {
                  const { data: existingProfile } = await supabase.from('profiles').select('id').eq('id', loginData.user.id).single();
                  if (!existingProfile) {
                       await supabase.from('profiles').insert({
                          id: loginData.user.id,
                          email: email,
                          name: fullName,
                          avatarUrl: null,
                          roles: [role]
                      });
                      await supabase.auth.updateUser({ data: { full_name: fullName, roles: [role] } });
                      await login(email, password);
                      showToast('Account recovered successfully!', 'success');
                      return { success: true };
                  } else {
                      return { success: false, error: "Account already exists. Please log in." };
                  }
              }
              return { success: false, error: "Email is registered. Please log in." };
          }

          if (error) throw error;
          
          if (data.user) {
               await supabase.from('profiles').insert({
                  id: data.user.id,
                  email: email,
                  name: fullName,
                  avatarUrl: null,
                  roles: [role]
              });
              await login(email, password);
              return { success: true };
          }
          return { success: false, error: "Signup failed" };
      } catch (e: any) {
          return { success: false, error: e.message };
      }
  };

  const logout = async () => {
      await supabase.auth.signOut();
      setCurrentUser(null);
      setCurrentRole('guest');
      setCart([]);
      setIsLoading(false);
      fetchData(); 
  };

  const switchRole = (role: Role) => {
      if (currentUser?.roles.includes(role)) {
          setCurrentRole(role);
      }
  };

  // --- Store Actions ---
  const registerVendor = async (data: any) => {
      if (!currentUser) return;
      const newVendor = {
          vendorId: `vendor-${Date.now()}`,
          userId: currentUser.id,
          storeName: data.storeName,
          storeDescription: data.storeDescription,
          location: data.location,
          storeAvatarUrl: null,
          contactPhone: data.contactPhone,
          isApproved: true,
          rating: 5.0
      };
      const { error } = await supabase.from('vendors').insert({
          vendorId: newVendor.vendorId,
          userId: newVendor.userId,
          storeName: newVendor.storeName,
          storeDescription: newVendor.storeDescription,
          storeAvatarUrl: newVendor.storeAvatarUrl,
          location: newVendor.location,
          contactPhone: newVendor.contactPhone,
          isApproved: true,
          rating: 5.0
      });
      if (!error) {
          if (!currentUser.roles.includes('vendor')) {
              const newRoles = [...currentUser.roles, 'vendor'];
              await supabase.from('profiles').update({ roles: newRoles }).eq('id', currentUser.id);
              setCurrentUser({ ...currentUser, roles: newRoles as Role[] });
          }
          setCurrentRole('vendor');
          showToast('Store created successfully!', 'success');
          fetchData();
      } else {
          showToast('Failed to create store.', 'error');
      }
  };

  const addProduct = async (productData: any) => {
      if (!currentUser) return false;
      const myVendor = vendors.find(v => v.userId === currentUser.id);
      if (!myVendor) { alert("Vendor profile not found"); return false; }

      const { error } = await supabase.from('products').insert({
          vendorId: myVendor.vendorId, 
          title: productData.title,
          description: productData.description,
          price: productData.price,
          currency: productData.currency,
          category: productData.category,
          images: productData.images,
          stock: productData.stock,
          status: 'pending',
          location: productData.location,
          contactPhone: productData.contactPhone,
          rating: 0
      });

      if (!error) {
          showToast('Product submitted for approval!', 'success');
          fetchData();
          return true;
      } else {
          showToast('Failed to add product', 'error');
          return false;
      }
  };

  const updateProduct = async (id: string, data: Partial<Product>) => {
      const { error } = await supabase.from('products').update(data).eq('id', id);
      if (!error) { showToast('Product updated', 'success'); fetchData(); }
  };

  const deleteProduct = async (id: string) => {
      const { error } = await supabase.from('products').delete().eq('id', id);
      if (!error) { showToast('Product deleted', 'success'); fetchData(); }
  };

  const updateProductStatus = async (id: string, status: Product['status']) => {
      const { error } = await supabase.from('products').update({ status }).eq('id', id);
      if (!error) { showToast(`Product ${status}`, 'success'); fetchData(); }
  };

  // --- Cart/Order Actions ---
  const addToCart = (product: Product, quantity = 1) => {
      setCart(prev => {
          const existing = prev.find(item => item.productId === product.id);
          if (existing) {
              return prev.map(item => item.productId === product.id ? { ...item, quantity: item.quantity + quantity } : item);
          }
          return [...prev, { productId: product.id, quantity, product }];
      });
      showToast('Added to Cart', 'success');
  };

  const removeFromCart = (productId: string) => {
      setCart(prev => prev.filter(item => item.productId !== productId));
  };

  const clearCart = () => setCart([]);

  const placeOrder = async (deliveryOption: 'delivery' | 'pickup') => {
      if (cart.length === 0) return;
      const itemsByVendor: Record<string, CartItem[]> = {};
      cart.forEach(item => {
          if (!itemsByVendor[item.product.vendorId]) itemsByVendor[item.product.vendorId] = [];
          itemsByVendor[item.product.vendorId].push(item);
      });

      for (const vendorId in itemsByVendor) {
          const items = itemsByVendor[vendorId];
          const total = items.reduce((sum, i) => sum + (i.product.price * i.quantity), 0);
          
          await supabase.from('orders').insert({
              buyerId: currentUser ? currentUser.id : 'guest',
              vendorId: vendorId,
              items: items,
              total: total + (deliveryOption === 'delivery' ? 10 : 0),
              status: 'placed',
              deliveryOption: deliveryOption
          });

          for (const item of items) {
              const newStock = Math.max(0, item.product.stock - item.quantity);
              await supabase.from('products').update({ stock: newStock }).eq('id', item.productId);
          }
      }

      showToast('Order Placed Successfully!', 'success');
      clearCart();
      fetchData();
  };

  const updateOrderStatus = async (orderId: string, status: OrderStatus) => {
      const { error } = await supabase.from('orders').update({ status }).eq('id', orderId);
      if (!error) { showToast(`Order updated to ${status}`, 'success'); fetchData(); }
  };

  const assignDelivery = async (orderId: string) => {
      if (!currentUser) return;
      const { error } = await supabase.from('orders').update({ 
          deliveryPersonId: currentUser.id,
          status: 'in_route' 
      }).eq('id', orderId);
      
      if (!error) {
          showToast('Delivery Assigned to You!', 'success');
          fetchData();
      }
  };

  const toggleFavorite = (productId: string) => {
      setFavorites(prev => {
          const exists = prev.includes(productId);
          const newFavs = exists ? prev.filter(id => id !== productId) : [...prev, productId];
          showToast(exists ? 'Removed from Wishlist' : 'Added to Wishlist', 'info');
          return newFavs;
      });
  };

  // --- Delivery Staff Actions ---
  const registerDeliveryPerson = async (data: any) => {
      if (!currentUser) return;
      await supabase.from('delivery_persons').insert({
          userId: currentUser.id,
          fullName: data.fullName,
          vehicleType: data.vehicleType,
          status: 'pending'
      });
      fetchData();
  };

  const approveDeliveryPerson = async (id: string, userId: string) => {
      // 1. Mark as approved in delivery_persons table
      await supabase.from('delivery_persons').update({ status: 'approved' }).eq('id', id);
      
      // 2. Add 'deliveryPerson' role to profiles table
      const { data: profile } = await supabase.from('profiles').select('roles').eq('id', userId).single();
      if (profile) {
          const currentRoles = profile.roles || [];
          if (!currentRoles.includes('deliveryPerson')) {
              await supabase.from('profiles').update({ 
                  roles: [...currentRoles, 'deliveryPerson'] 
              }).eq('id', userId);
          }
      }

      showToast('Staff approved & Role Granted', 'success');
      fetchData();
  };

  const showToast = (message: string, type: 'success' | 'error' | 'info') => {
      setToast({ message, type });
  };

  const hideToast = () => setToast(null);

  const requestNotificationPermission = async () => {
      if (!("Notification" in window)) return false;
      const permission = await Notification.requestPermission();
      return permission === 'granted';
  };

  const playNotificationSound = () => {
      const audio = new Audio('https://assets.mixkit.co/active_storage/sfx/2869/2869-preview.mp3');
      audio.play().catch(e => console.log("Audio play failed", e));
  };

  const sendBrowserNotification = (order: any) => {
      if (Notification.permission === 'granted') {
          new Notification("New Order Received!", {
              body: `Total: ₵${order.total} - ${order.deliveryOption}`,
              icon: '/vite.svg'
          });
      }
  };

  return (
    <AppContext.Provider value={{
      currentUser, currentRole, products, vendors, orders, deliveryPersons,
      isLoading, cart, favorites, toast,
      login, signup, logout, switchRole,
      registerVendor, addProduct, updateProduct, deleteProduct, updateProductStatus,
      addToCart, removeFromCart, clearCart, placeOrder, updateOrderStatus,
      registerDeliveryPerson, approveDeliveryPerson, toggleFavorite,
      showToast, hideToast, requestNotificationPermission,
      assignDelivery, refreshData: fetchData
    }}>
      {children}
    </AppContext.Provider>
  );
};

export const useApp = () => {
  const context = useContext(AppContext);
  if (!context) throw new Error('useApp must be used within AppProvider');
  return context;
};
