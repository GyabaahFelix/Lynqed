
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
  toggleFavorite: (productId: string) => void;
  
  // UI Actions
  showToast: (message: string, type: 'success' | 'error' | 'info') => void;
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
          fetchData(); // Refresh data on any product change
      })
      .subscribe();
      
    // Subscribe to Realtime changes for New Orders (Notifications)
    const orderSubscription = supabase
      .channel('public:orders')
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'orders' }, async (payload) => {
          const newOrder = payload.new as any;
          
          // Check if the new order belongs to the currently logged in vendor
          if (userRef.current) {
              // Fetch the vendor details for this order to see if it matches current user
              const { data: vendorData } = await supabase
                  .from('vendors')
                  .select('*')
                  .eq('vendorId', newOrder.vendorId)
                  .single();
              
              // Map properly regardless of column case
              const vUserId = vendorData?.userId;

              if (vUserId && vUserId === userRef.current.id) {
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
          
          // SELF-HEALING Logic: If profile missing but auth exists
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
                  avatarUrl: data.avatarUrl,
                  roles: data.roles as Role[]
              };
              setCurrentUser(user);
              
              // FORCE ROLE UPDATE from live data
              // If user is currently in a role that they still have, keep it. 
              // Otherwise, reset to default safe role.
              const hasAdmin = user.roles.includes('admin');
              const hasVendor = user.roles.includes('vendor');
              
              if(hasAdmin && currentRole === 'admin') {
                  // Keep admin
              } else if (hasVendor && currentRole === 'vendor') {
                  // Keep vendor
              } else {
                   // Default fallback
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
          // Fetch Products
          const { data: prodData } = await supabase.from('products').select('*').order('created_at', { ascending: false });
          if (prodData) {
              setProducts(prodData as Product[]);
          }

          // Fetch Vendors
          const { data: vendData } = await supabase.from('vendors').select('*');
          if (vendData) {
              setVendors(vendData as Vendor[]);
          }

          // Fetch Orders
          const { data: ordData } = await supabase.from('orders').select('*').order('created_at', { ascending: false });
          if (ordData) {
             const mappedOrders = ordData.map((o: any) => ({
                 ...o,
                 // Ensure items is parsed if string
                 items: typeof o.items === 'string' ? JSON.parse(o.items) : o.items
             }));
             setOrders(mappedOrders as Order[]);
          }

          // Fetch Delivery Persons
          const { data: delData } = await supabase.from('delivery_persons').select('*');
          if (delData) {
              setDeliveryPersons(delData as DeliveryPerson[]);
          }
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
              // 1. Fetch Profile to get LIVE roles
              const user = await fetchUserProfile(data.user.id);
              
              // 2. Refresh Data
              await fetchData();

              if (user) {
                   if (user.roles.includes('admin')) return { success: true, role: 'admin' };
                   if (user.roles.includes('vendor')) return { success: true, role: 'vendor' };
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
          if (error) throw error;
          
          // Try to create profile immediately
          if (data.user) {
               await supabase.from('profiles').insert({
                  id: data.user.id,
                  email: email,
                  name: fullName,
                  avatarUrl: `https://ui-avatars.com/api/?name=${fullName}&background=random`,
                  roles: [role]
              });
              
              await login(email, password); // Auto login
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
      // Optional: Refresh data to clear personal views, though redirect usually handles this
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
          storeAvatarUrl: `https://ui-avatars.com/api/?name=${data.storeName}`,
          contactPhone: data.contactPhone,
          isApproved: true,
          rating: 5.0
      };
      
      // Save to Supabase using EXACT column names
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
           // Update User Roles locally and in DB
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
          console.error(error);
      }
  };

  const addProduct = async (productData: any) => {
      if (!currentUser) return false;
      const myVendor = vendors.find(v => v.userId === currentUser.id);
      if (!myVendor) {
          alert("Vendor profile not found");
          return false;
      }

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
          console.error(error);
          showToast('Failed to add product', 'error');
          return false;
      }
  };

  const updateProduct = async (id: string, data: Partial<Product>) => {
      const { error } = await supabase.from('products').update(data).eq('id', id);
      if (!error) {
          showToast('Product updated', 'success');
          fetchData();
      }
  };

  const deleteProduct = async (id: string) => {
      const { error } = await supabase.from('products').delete().eq('id', id);
      if (!error) {
          showToast('Product deleted', 'success');
          fetchData();
      }
  };

  const updateProductStatus = async (id: string, status: Product['status']) => {
      const { error } = await supabase.from('products').update({ status }).eq('id', id);
      if (!error) {
          showToast(`Product ${status}`, 'success');
          fetchData();
      }
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
      
      // Group items by vendor
      const itemsByVendor: Record<string, CartItem[]> = {};
      cart.forEach(item => {
          if (!itemsByVendor[item.product.vendorId]) itemsByVendor[item.product.vendorId] = [];
          itemsByVendor[item.product.vendorId].push(item);
      });

      // Create an order for each vendor
      for (const vendorId in itemsByVendor) {
          const items = itemsByVendor[vendorId];
          const total = items.reduce((sum, i) => sum + (i.product.price * i.quantity), 0);
          
          await supabase.from('orders').insert({
              buyerId: currentUser ? currentUser.id : 'guest', // Will fail if UUID constraint exists and this isn't UUID
              vendorId: vendorId,
              items: items, // JSONB
              total: total + (deliveryOption === 'delivery' ? 10 : 0),
              status: 'placed',
              deliveryOption: deliveryOption
          });

          // Decrement Stock
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
      if (!error) {
          showToast(`Order updated to ${status}`, 'success');
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

  // --- Other Actions ---
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

  const approveDeliveryPerson = async (id: string) => {
      await supabase.from('delivery_persons').update({ status: 'approved' }).eq('id', id);
      showToast('Staff approved', 'success');
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
      refreshData: fetchData
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
