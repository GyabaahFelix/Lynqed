
import React, { createContext, useContext, useState, useEffect } from 'react';
import { User, Product, Vendor, Order, CartItem, DeliveryPerson, Role, OrderStatus } from './types';
import { supabase } from './supabaseClient';

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
  
  // Auth Actions
  login: (email: string, password: string) => Promise<{success: boolean, role?: Role, error?: string}>;
  signup: (email: string, password: string, fullName: string, role: Role) => Promise<{success: boolean, error?: string}>;
  logout: () => void;
  switchRole: (role: Role) => void;
  registerDeliveryPerson: (data: Partial<DeliveryPerson>) => void;
  registerVendor: (data: { storeName: string; storeDescription: string; location: string }) => Promise<void>;
  
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
  
  // Vendor/Admin Actions
  approveDeliveryPerson: (id: string) => void;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

export const AppProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  // -- State --
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [currentRole, setCurrentRole] = useState<Role>('guest');
  const [isLoading, setIsLoading] = useState<boolean>(true);
  
  const [products, setProducts] = useState<Product[]>([]);
  const [vendors, setVendors] = useState<Vendor[]>([]);
  const [orders, setOrders] = useState<Order[]>([]);
  const [deliveryPersons, setDeliveryPersons] = useState<DeliveryPerson[]>([]);
  
  const [cart, setCart] = useState<CartItem[]>(() => {
      const saved = localStorage.getItem('lynqed_cart');
      return saved ? JSON.parse(saved) : [];
  });
  const [favorites, setFavorites] = useState<string[]>(() => {
      const saved = localStorage.getItem('lynqed_favs');
      return saved ? JSON.parse(saved) : [];
  });

  // --- 1. INITIAL LOAD (SUPABASE) ---
  useEffect(() => {
    checkSession();
    fetchData();

    // Optional: Realtime subscriptions could go here
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

  const fetchUserProfile = async (userId: string) => {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .single();
      
      if (data && !error) {
          const user: User = {
              id: data.id,
              email: data.email,
              name: data.name,
              avatarUrl: data.avatarUrl,
              roles: data.roles as Role[]
          };
          setCurrentUser(user);
          // Determine default role
          const defaultRole = user.roles.includes('vendor') ? 'vendor' : user.roles.includes('admin') ? 'admin' : 'buyer';
          setCurrentRole(defaultRole);
      }
      setIsLoading(false);
  };

  const fetchData = async () => {
      // Fetch Products
      const { data: prodData } = await supabase.from('products').select('*').order('created_at', { ascending: false });
      if (prodData) setProducts(prodData as Product[]);

      // Fetch Vendors
      const { data: vendData } = await supabase.from('vendors').select('*');
      if (vendData) setVendors(vendData as Vendor[]);

      // Fetch Orders
      const { data: ordData } = await supabase.from('orders').select('*').order('created_at', { ascending: false });
      if (ordData) {
          // Map jsonb items back to CartItem[] structure if needed
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

  // --- Auth Actions ---

  const signup = async (email: string, password: string, fullName: string, role: Role) => {
      const { data, error } = await supabase.auth.signUp({
          email,
          password,
      });

      if (error) return { success: false, error: error.message };

      if (data.user) {
          // Create Profile
          const { error: profileError } = await supabase.from('profiles').insert({
              id: data.user.id,
              email: email,
              name: fullName,
              avatarUrl: `https://ui-avatars.com/api/?name=${encodeURIComponent(fullName)}&background=random`,
              roles: [role]
          });

          if (profileError) return { success: false, error: profileError.message };

          // Auto Login state
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
        await fetchUserProfile(data.user.id);
        // We need to wait for fetchUserProfile to update currentUser state, 
        // but for return value we need to fetch role manually to be fast
        const { data: profile } = await supabase.from('profiles').select('roles').eq('id', data.user.id).single();
        const userRole: Role = profile?.roles?.includes('admin') ? 'admin' : profile?.roles?.includes('vendor') ? 'vendor' : 'buyer';
        
        return { success: true, role: userRole };
    }
    
    return { success: false, error: 'Login failed' };
  };

  const logout = async () => {
    await supabase.auth.signOut();
    setCurrentUser(null);
    setCurrentRole('guest');
    setCart([]);
  };

  const switchRole = (role: Role) => {
    if(currentUser?.roles.includes(role) || role === 'guest') {
      setCurrentRole(role);
    }
  };

  // --- Store Actions ---

  const registerVendor = async (data: { storeName: string; storeDescription: string; location: string }) => {
    if (!currentUser) return;

    const vendorId = `vendor-${Date.now()}`;
    const { error } = await supabase.from('vendors').insert({
        vendorId: vendorId,
        userId: currentUser.id,
        storeName: data.storeName,
        storeDescription: data.storeDescription,
        location: data.location,
        storeAvatarUrl: currentUser.avatarUrl,
        isApproved: true,
        rating: 5.0
    });

    if (!error) {
        // Update User Role
        const newRoles = [...currentUser.roles, 'vendor'];
        await supabase.from('profiles').update({ roles: newRoles }).eq('id', currentUser.id);
        
        // Refresh Local State
        await fetchUserProfile(currentUser.id);
        fetchData(); // Reload vendors
    }
  };

  const addProduct = async (data: Omit<Product, 'id' | 'status' | 'images'> & { images: string[] }) => {
     const vendor = vendors.find(v => v.userId === currentUser?.id);
     if (!vendor) return false;

     const { error } = await supabase.from('products').insert({
        vendorId: vendor.vendorId,
        title: data.title,
        description: data.description,
        price: data.price,
        currency: data.currency,
        category: data.category,
        stock: data.stock,
        images: data.images, // Base64 strings array
        contactPhone: data.contactPhone,
        status: 'pending',
        location: data.location || vendor.location,
        rating: 0
     });

     if (!error) {
         fetchData(); // Refresh products list
         return true;
     }
     console.error(error);
     return false;
  };

  const updateProduct = async (id: string, data: Partial<Product>) => {
      const { error } = await supabase.from('products').update(data).eq('id', id);
      if (!error) fetchData();
  };

  const updateProductStatus = async (id: string, status: Product['status']) => {
    const { error } = await supabase.from('products').update({ status }).eq('id', id);
    if (!error) fetchData();
  };

  const deleteProduct = async (id: string) => {
    const { error } = await supabase.from('products').delete().eq('id', id);
    if (!error) fetchData();
  };

  // --- Order Actions ---

  const placeOrder = async (deliveryOption: 'delivery' | 'pickup') => {
    if (!currentUser || cart.length === 0) return;
    
    const vendorId = cart[0].product.vendorId;
    const total = cart.reduce((sum, item) => sum + (item.product.price * item.quantity), 0);

    const { error } = await supabase.from('orders').insert({
        buyerId: currentUser.id,
        vendorId: vendorId,
        items: cart, // Supabase handles JSONB automatically
        total: total,
        status: 'placed',
        deliveryOption: deliveryOption
    });

    if (!error) {
        fetchData();
        clearCart();
    } else {
        console.error("Order failed", error);
    }
  };

  const updateOrderStatus = async (orderId: string, status: OrderStatus) => {
      const { error } = await supabase.from('orders').update({ status }).eq('id', orderId);
      if (!error) fetchData();
  };

  // --- Other Actions ---
  
  const addToCart = (product: Product, quantity = 1) => {
    setCart(prev => {
      const existing = prev.find(item => item.productId === product.id);
      if (existing) {
        return prev.map(item => item.productId === product.id ? { ...item, quantity: item.quantity + quantity } : item);
      }
      return [...prev, { productId: product.id, quantity, product }];
    });
  };

  const removeFromCart = (productId: string) => {
    setCart(prev => prev.filter(item => item.productId !== productId));
  };

  const clearCart = () => setCart([]);

  const toggleFavorite = (productId: string) => {
      setFavorites(prev => prev.includes(productId) ? prev.filter(id => id !== productId) : [...prev, productId]);
  };

  const registerDeliveryPerson = async (data: Partial<DeliveryPerson>) => {
    if (!currentUser) return;
    const { error } = await supabase.from('delivery_persons').insert({
      userId: currentUser.id,
      fullName: data.fullName || currentUser.name,
      vehicleType: data.vehicleType || 'bicycle',
      status: 'pending'
    });
    if (!error) fetchData();
  };
  
  const approveDeliveryPerson = async (id: string) => {
      const { error } = await supabase.from('delivery_persons').update({ status: 'approved' }).eq('id', id);
      if (!error) fetchData();
  }

  return (
    <AppContext.Provider value={{
      currentUser, currentRole, products, vendors, orders, cart, deliveryPersons, isLoading, favorites,
      login, signup, logout, switchRole, registerDeliveryPerson, registerVendor,
      addProduct, updateProduct, updateProductStatus, deleteProduct, approveDeliveryPerson,
      addToCart, removeFromCart, clearCart, placeOrder, updateOrderStatus, toggleFavorite
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
