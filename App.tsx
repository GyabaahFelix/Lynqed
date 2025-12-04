
import React, { useEffect } from 'react';
import { HashRouter as Router, Routes, Route, Navigate, useNavigate } from 'react-router-dom';
import { AppProvider, useApp } from './context';
import { Layout } from './components/Layout';
import { Welcome, BuyerDashboard } from './pages/Home';
import { SearchPage } from './pages/Search';
import { ProductDetail, Cart, Checkout, StorePage } from './pages/Product';
import { VendorDashboard, VendorProducts, AddProduct, EditProduct, VendorOrders, VendorOnboarding } from './pages/Vendor';
import { AdminDashboard } from './pages/Admin';
import { UserProfile, OrdersPage, WishlistPage } from './pages/Profile';
import { Login, Register, AdminLogin, ForgotPassword, UpdatePassword } from './pages/Auth';
import { DeliveryDashboard } from './pages/Delivery';
import { supabase } from './supabaseClient';

const ProtectedRoute: React.FC<{ children: React.ReactNode; role?: string }> = ({ children, role }) => {
    const { currentUser, currentRole, isLoading } = useApp();
    
    if (isLoading) return <div className="min-h-screen flex items-center justify-center"><div className="animate-spin rounded-full h-8 w-8 border-2 border-primary border-b-transparent"></div></div>;
    
    if (!currentUser) return <Navigate to="/login" />;
    if (role && currentRole !== role && currentRole !== 'admin') return <Navigate to="/" />; 
    return <>{children}</>;
};

// Component to handle global auth events like password recovery
const AuthEventHandler = () => {
    const navigate = useNavigate();
    
    useEffect(() => {
        const { data: authListener } = supabase.auth.onAuthStateChange((event, session) => {
            if (event === 'PASSWORD_RECOVERY') {
                navigate('/update-password');
            }
        });
        return () => {
            authListener.subscription.unsubscribe();
        };
    }, [navigate]);

    return null;
}

const AppContent = () => {
  return (
    <Layout>
      <AuthEventHandler />
      <Routes>
        {/* Public / Entry */}
        <Route path="/" element={<Welcome />} />
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        <Route path="/forgot-password" element={<ForgotPassword />} />
        <Route path="/update-password" element={<UpdatePassword />} />
        
        {/* Public Store Page */}
        <Route path="/store/:vendorId" element={<StorePage />} />

        {/* Secret Admin Route */}
        <Route path="/secret-access" element={<AdminLogin />} />

        {/* Buyer Routes */}
        <Route path="/buyer/dashboard" element={<BuyerDashboard />} />
        <Route path="/buyer/search" element={<SearchPage />} />
        <Route path="/buyer/product/:id" element={<ProductDetail />} />
        <Route path="/buyer/cart" element={<Cart />} />
        <Route path="/buyer/checkout" element={<Checkout />} />
        <Route path="/buyer/orders" element={<ProtectedRoute role="buyer"><OrdersPage /></ProtectedRoute>} />
        <Route path="/buyer/wishlist" element={<ProtectedRoute role="buyer"><WishlistPage /></ProtectedRoute>} />
        <Route path="/buyer/profile" element={<ProtectedRoute><UserProfile /></ProtectedRoute>} />

        {/* Vendor Routes */}
        <Route path="/vendor/onboarding" element={<ProtectedRoute><VendorOnboarding /></ProtectedRoute>} />
        <Route path="/vendor/dashboard" element={<ProtectedRoute role="vendor"><VendorDashboard /></ProtectedRoute>} />
        <Route path="/vendor/products" element={<ProtectedRoute role="vendor"><VendorProducts /></ProtectedRoute>} />
        <Route path="/vendor/products/new" element={<ProtectedRoute role="vendor"><AddProduct /></ProtectedRoute>} />
        <Route path="/vendor/products/:id/edit" element={<ProtectedRoute role="vendor"><EditProduct /></ProtectedRoute>} />
        <Route path="/vendor/orders" element={<ProtectedRoute role="vendor"><VendorOrders /></ProtectedRoute>} />
        <Route path="/vendor/profile" element={<ProtectedRoute role="vendor"><UserProfile /></ProtectedRoute>} />
        
        {/* Delivery Routes */}
        <Route path="/delivery/dashboard" element={<ProtectedRoute role="deliveryPerson"><DeliveryDashboard /></ProtectedRoute>} />

        {/* Admin Routes */}
        <Route path="/admin/dashboard" element={<ProtectedRoute role="admin"><AdminDashboard /></ProtectedRoute>} />
      </Routes>
    </Layout>
  );
}

const App: React.FC = () => {
  return (
    <AppProvider>
      <Router>
         <AppContent />
      </Router>
    </AppProvider>
  );
};

export default App;