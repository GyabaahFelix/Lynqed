
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
  
  uploadFile: (file: File, folder: string) => Promise<string | null>;
  registerDeliveryPerson: (data: Partial<DeliveryPerson>) => Promise<{ success: boolean }>;
  registerVendor: (data: { storeName: string; storeDescription: string; location: string; contactPhone: string; storeAvatarUrl?: string }) => Promise<{ success: boolean }>;
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
      } catch(e) {
          console.error("Cleanup failed", e);
      }
  }, []);

  // Refs to hold latest state for event listeners to avoid dependency loops
  const vendorsRef = useRef(vendors);
  const currentUserRef = useRef(currentUser);
  const currentRoleRef = useRef(currentRole);

  useEffect(() => { vendorsRef.current = vendors; }, [vendors]);
  useEffect(() => { currentUserRef.current = currentUser; }, [currentUser]);
  useEffect(() => { currentRoleRef.current = currentRole; }, [currentRole]);

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

  // Init App Effect
  useEffect(() => {
    initApp();
    
    // Realtime subscriptions
    const productSub = supabase.channel('public:products').on('postgres_changes', { event: '*', schema: 'public', table: 'products' }, () => fetchData()).subscribe();
    
    const orderSub = supabase.channel('public:orders').on('postgres_changes', { event: '*', schema: 'public', table: 'orders' }, (payload) => {
          fetchData();
          
          // Enhanced Notification for Vendors using Refs to avoid closure staleness
          if (payload.eventType === 'INSERT' && currentRoleRef.current === 'vendor') {
              const newOrder = payload.new as Order;
              const myVendorId = vendorsRef.current.find(v => v.userId === currentUserRef.current?.id)?.vendorId;
              
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
  }, []); 

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
          // Persisted role from storage for quick check
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
              
              // FORCE ADMIN ROLE if user is admin, ignoring local storage drift
              if (user.roles.includes('admin')) {
                  setCurrentRole('admin');
                  safeSetItem('lynqed_role', 'admin');
              } 
              // Otherwise try to respect last used role if valid
              else if (persistedRole && user.roles.includes(persistedRole)) {
                  setCurrentRole(persistedRole);
              } 
              // Fallback based on available roles
              else {
                  if (user.roles.includes('vendor')) setCurrentRole('vendor');
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

          if (pData) setProducts(pData.map((p: any) => ({
              ...p,
              vendorId: p.vendorId || p.vendor_id || p.vendorid, 
              contactPhone: p.contactPhone || p.contact_phone,
              // Other fields are usually snake_case matching simple keys or are handled automatically
          })) as Product[]);

          if (vData) {
              setVendors(vData.map((v: any) => ({
                  ...v,
                  id: v.id, // Capture Database PK
                  vendorId: v.vendorId || v.vendor_id || v.vendorid, 
                  storeName: v.storeName || v.store_name,
                  storeDescription: v.storeDescription || v.store_description,
                  storeAvatarUrl: v.storeAvatarUrl || v.store_avatar_url,
                  userId: v.userId || v.user_id,
                  isApproved: v.isApproved ?? v.is_approved ?? v.isapproved
              })) as Vendor[]);
          }

          if (oData) {
              setOrders(oData.map((o: any) => ({
                  ...o, 
                  vendorId: o.vendorId || o.vendor_id,
                  buyerId: o.buyerId || o.buyer_id,
                  deliveryPersonId: o.deliveryPersonId || o.delivery_person_id,
                  deliveryFee: o.deliveryFee || o.delivery_fee,
                  deliveryOption: o.deliveryOption || o.delivery_option,
                  createdAt: o.createdAt || o.created_at,
                  items: typeof o.items === 'string' ? JSON.parse(o.items) : o.items
              })) as Order[]);
          }
          if (dData) setDeliveryPersons(dData.map((d: any) => ({
             ...d,
             userId: d.userId || d.user_id,
             fullName: d.fullName || d.full_name,
             vehicleType: d.vehicleType || d.vehicle_type,
          })) as DeliveryPerson[]);

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

  // --- STORAGE UPLOAD HELPER ---
  const uploadFile = async (file: File, folder: string): Promise<string | null> => {
      try {
          const fileExt = file.name.split('.').pop();
          const fileName = `${Math.random().toString(36).substring(2, 15)}_${Date.now()}.${fileExt}`;
          const filePath = `${folder}/${fileName}`;

          const { error: uploadError } = await supabase.storage
              .from('lynqed-assets')
              .upload(filePath, file);

          if (uploadError) {
              console.error('Upload error:', uploadError);
              showToast(`Upload failed: ${uploadError.message}`, 'error');
              return null;
          }

          const { data } = supabase.storage.from('lynqed-assets').getPublicUrl(filePath);
          return data.publicUrl;
      } catch (error: any) {
          console.error('Storage error:', error);
          showToast('Image upload failed', 'error');
          return null;
      }
  };

  // Specific Actions
  const registerVendor = async (data: any): Promise<{ success: boolean }> => {
      if(!currentUser) return { success: false };
      
      try {
          // Check for existing vendor profile for this user
          const { data: existing } = await supabase.from('vendors').select('id').eq('user_id', currentUser.id).maybeSingle();

          let error;
          
          if (existing) {
               console.log("Updating existing vendor profile");
               const { error: upError } = await supabase.from('vendors').update({
                   store_name: data.storeName,
                   store_description: data.storeDescription,
                   location: data.location,
                   contact_phone: data.contactPhone,
                   store_avatar_url: data.storeAvatarUrl
               }).eq('user_id', currentUser.id);
               error = upError;
          } else {
               console.log("Creating new vendor profile");
               const { error: inError } = await supabase.from('vendors').insert({ 
                   vendor_id: `v-${Date.now()}`, 
                   user_id: currentUser.id, 
                   store_name: data.storeName,
                   store_description: data.storeDescription,
                   location: data.location,
                   contact_phone: data.contactPhone,
                   store_avatar_url: data.storeAvatarUrl,
                   is_approved: false, 
                   rating: 5.0 
               });
               error = inError;
          }

          if (error) {
              console.error("Vendor Registration Error:", error);
              showToast(`Registration failed: ${error.message || 'Database error'}`, "error");
              return { success: false };
          } 
          
          showToast("Store profile saved successfully", "success"); 
          await fetchData();
          return { success: true };

      } catch (e: any) {
          console.error("Vendor Registration Exception:", e);
          showToast(`Unexpected error: ${e.message || e}`, "error");
          return { success: false };
      }
  };
  
  const registerDeliveryPerson = async (data: any): Promise<{ success: boolean }> => {
      if(!currentUser) return { success: false };
      
      const { error } = await supabase.from('delivery_persons').insert({ 
          user_id: currentUser.id, 
          full_name: data.fullName,
          vehicle_type: data.vehicleType,
          status: 'pending' 
      });
      
      if (error) {
          console.error("Delivery Registration Error:", error);
          showToast(`Application failed: ${error.message}`, "error");
          return { success: false };
      }
      
      showToast("Rider application submitted", "success"); 
      fetchData();
      return { success: true };
  };
  
  const addProduct = async (prod: any) => {
      if(!currentUser) {
          showToast("You must be logged in.", "error");
          return false;
      }

      // Try finding vendor in state first
      let v = vendors.find(v => v.userId === currentUser.id);
      
      // Fallback: Fetch directly from DB if missing in state (Sync issues)
      if (!v) {
          try {
             // Use maybeSingle to avoid throwing if not found
             const { data } = await supabase.from('vendors').select('*').eq('user_id', currentUser.id).maybeSingle();
             if(data) {
                 v = {
                     ...data,
                     vendorId: data.vendor_id,
                     userId: data.user_id,
                     // Minimal fields needed for FK constraint and logic
                     storeName: data.store_name || 'My Store',
                     storeDescription: '',
                     location: '',
                     isApproved: data.is_approved,
                     rating: 5
                 };
             }
          } catch(e) {
              console.error("Vendor fetch fallback failed", e);
          }
      }
      
      if(!v) {
          showToast("Vendor profile not found. Please set up your store.", "error");
          return false;
      }
      
      const { customCategory, vendorId, ...dbProduct } = prod;
      
      // Explicit snake_case mapping for DB insert
      const productPayload = {
          vendor_id: v.vendorId, // Use the resolved vendor ID
          title: dbProduct.title,
          description: dbProduct.description,
          price: dbProduct.price,
          currency: 'GHS', // Default to GHS
          category: dbProduct.category,
          images: dbProduct.images,
          stock: dbProduct.stock,
          status: 'pending',
          location: dbProduct.location,
          contact_phone: dbProduct.contactPhone
      };

      const { error } = await supabase.from('products').insert(productPayload);
      
      if (error) {
          console.error("Supabase Insert Error:", error);
          showToast(`Failed to add product: ${error.message}`, "error");
          return false;
      }
      
      showToast("Product submitted for approval", "success"); 
      fetchData(); 
      return true;
  };
  
  const updateProduct = async (id: string, data: any) => {
      const { customCategory, vendorId, contactPhone, ...rest } = data;
      
      // Map to snake_case for update
      const updatePayload = {
          ...rest,
          contact_phone: contactPhone
      };

      const { error } = await supabase.from('products').update(updatePayload).eq('id', id);
      
      if (error) {
          showToast("Update failed", "error");
          console.error(error);
      } else {
          showToast("Product updated", "success");
          fetchData();
      }
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
                  buyer_id: currentUser.id, 
                  vendor_id: vid, 
                  items, 
                  total: subtotal+fee, 
                  delivery_fee: fee, 
                  status: 'placed', 
                  delivery_option: option 
              });

              if (error) {
                 throw error;
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
  const assignDelivery = async (oid: string) => { if(currentUser) await supabase.from('orders').update({delivery_person_id: currentUser.id, status: 'assigned'}).eq('id', oid); fetchData(); };
  
  // Admin
  const banUser = async (uid: string, s: boolean) => { await supabase.from('profiles').update({isBanned: s}).eq('id', uid); fetchData(); };
  const deleteUser = async (uid: string) => { await supabase.from('profiles').delete().eq('id', uid); fetchData(); };
  
  // ROBUST VENDOR APPROVAL - ID Based
  const approveVendor = async (vid: string, s: boolean) => { 
      // vid corresponds to the custom 'vendorId' string (e.g. v-123)
      // We first find the full vendor object to get its Database PK (id)
      const vendor = vendors.find(v => v.vendorId === vid);
      
      if (!vendor) {
          showToast("Error: Vendor not found in state", "error");
          return;
      }
      
      showToast("Updating vendor...", "info");
      
      try {
          let query;
          // Strategy 1: Use Database Primary Key (safest)
          if (vendor.id) {
               console.log(`Updating via DB PK: ${vendor.id}`);
               query = supabase.from('vendors').update({ is_approved: s }).eq('id', vendor.id);
          } else {
               // Strategy 2: Fallback to custom vendor_id column
               console.log(`Updating via vendor_id column: ${vid}`);
               query = supabase.from('vendors').update({ is_approved: s }).eq('vendor_id', vid);
          }

          const { error } = await query;
          
          if (error) {
             // Retry with camelCase if snake_case failed (unlikely but possible if manually created)
             console.warn("Snake_case update failed, trying camelCase...", error);
             const { error: retryError } = await supabase.from('vendors').update({ isApproved: s }).eq(vendor.id ? 'id' : 'vendorId', vendor.id || vid);
             
             if (retryError) throw error; // Throw original error to see actual DB issue
          }
          
          await fetchData();
          showToast(s ? "Vendor Approved" : "Vendor Suspended", "success");
      } catch (err: any) {
          console.error("Approval Error Details:", err);
          showToast(`Failed: ${err.message || 'Check Console'}`, "error");
      }
  };
  
  const approveDeliveryPerson = async (id: string, uid: string, status: 'approved' | 'rejected' | 'suspended') => { 
      try {
          // 1. Update status in delivery_persons table
          const { error: updateError } = await supabase
              .from('delivery_persons')
              .update({ status })
              .eq('id', id);

          if (updateError) throw updateError;

          // 2. Sync Role in Profiles
          const { data: profile } = await supabase.from('profiles').select('roles').eq('id', uid).single();
          
          if (profile) {
               let roles = profile.roles || [];
               let changed = false;

               if (status === 'approved') {
                   if (!roles.includes('deliveryPerson')) {
                       roles.push('deliveryPerson');
                       changed = true;
                   }
               } else {
                   // For rejected or suspended, remove the role
                   if (roles.includes('deliveryPerson')) {
                       roles = roles.filter((r: string) => r !== 'deliveryPerson');
                       changed = true;
                   }
               }

               if (changed) {
                   await supabase.from('profiles').update({ roles }).eq('id', uid);
               }
          }
          
          showToast(`Rider application ${status}`, "success");
          await fetchData(); 
      } catch (e: any) {
          console.error("Approval error", e);
          showToast(`Failed: ${e.message}`, "error");
      }
  };

  return (
    <AppContext.Provider value={{
        currentUser, currentRole, products, vendors, orders, deliveryPersons, users, isLoading, isDataLoading, cart, favorites, toast,
        login, signup, logout, resetPassword, updatePassword, switchRole,
        uploadFile, registerVendor, registerDeliveryPerson, refreshData: fetchData,
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
