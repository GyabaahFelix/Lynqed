
import React, { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useApp } from '../context';
import { Toast, Avatar } from './UI';

// --- Bottom Navigation (Mobile First) ---
export const BottomNav: React.FC = () => {
  const { currentRole, cart } = useApp();
  const location = useLocation();
  
  if (currentRole === 'admin') return null;
  // Exclude new auth routes
  if (location.pathname.startsWith('/auth') || location.pathname === '/' || location.pathname === '/forgot-password' || location.pathname === '/update-password') return null;
  
  // Hide global nav on product detail pages to allow specific action bars to be visible
  if (location.pathname.includes('/product/') || location.pathname.includes('/checkout')) return null;

  const isActive = (path: string) => location.pathname === path;

  // Modern Nav Item with CLEAR labels
  const NavItem = ({ to, icon, label, active }: { to: string, icon: string, label: string, active: boolean }) => (
    <Link to={to} className="relative flex-1 flex flex-col items-center justify-center h-full group pt-2 pb-1 active:scale-95 transition-transform">
       <div className={`transition-all duration-300 mb-1 ${active ? 'text-primary transform -translate-y-1' : 'text-gray-400 group-hover:text-gray-600'}`}>
         <i className={`fa-solid fa-${icon} text-xl ${active ? 'drop-shadow-md' : ''}`}></i>
       </div>
       <span className={`text-[10px] font-bold tracking-tight leading-none transition-colors duration-300 ${active ? 'text-primary' : 'text-gray-400 group-hover:text-gray-600'}`}>
         {label}
       </span>
       {active && <span className="absolute top-1 w-1 h-1 bg-primary rounded-full shadow-[0_0_5px_rgba(99,102,241,0.8)]"></span>}
    </Link>
  );

  return (
    <div className="md:hidden fixed bottom-0 left-0 right-0 h-[80px] bg-white/95 backdrop-blur-xl border-t border-gray-200 shadow-[0_-4px_20px_rgba(0,0,0,0.05)] flex justify-around items-end z-40 pb-safe px-2">
      {currentRole === 'buyer' || currentRole === 'guest' ? (
        <>
          <NavItem to="/buyer/dashboard" icon="house" label="Home" active={isActive('/buyer/dashboard')} />
          <NavItem to="/buyer/search" icon="magnifying-glass" label="Search" active={isActive('/buyer/search')} />
          
          <Link to="/buyer/cart" className="relative -top-6 group px-2 flex flex-col items-center justify-center">
             <div className={`w-14 h-14 rounded-full flex items-center justify-center shadow-lg transition-all duration-300 group-active:scale-90 border-4 border-white ${isActive('/buyer/cart') ? 'bg-gray-900 text-white shadow-gray-500/30' : 'bg-gradient-to-br from-primary to-primaryDark text-white shadow-primary/40'}`}>
                <i className="fa-solid fa-cart-shopping text-xl"></i>
                {cart.length > 0 && (
                  <span className="absolute top-0 right-0 bg-accent text-white text-[10px] font-bold w-5 h-5 flex items-center justify-center rounded-full border-2 border-white shadow-sm transform translate-x-1 -translate-y-1">
                    {cart.length}
                  </span>
                )}
             </div>
             <span className="block text-center text-[10px] font-bold text-gray-400 mt-1 group-hover:text-primary transition-colors">Cart</span>
          </Link>
          
          <NavItem to="/buyer/orders" icon="box" label="Orders" active={isActive('/buyer/orders')} />
          <NavItem to="/buyer/profile" icon="user" label="Profile" active={isActive('/buyer/profile')} />
        </>
      ) : currentRole === 'vendor' ? (
        <>
          <NavItem to="/vendor/dashboard" icon="chart-pie" label="Dashboard" active={isActive('/vendor/dashboard')} />
          <NavItem to="/vendor/products" icon="box-open" label="Products" active={isActive('/vendor/products')} />
          <div className="w-6"></div> {/* Spacer for aesthetic balance */}
          <NavItem to="/vendor/orders" icon="receipt" label="Orders" active={isActive('/vendor/orders')} />
          <NavItem to="/vendor/profile" icon="store" label="Profile" active={isActive('/vendor/profile')} />
        </>
      ) : currentRole === 'deliveryPerson' ? (
        <>
           <NavItem to="/delivery/dashboard" icon="motorcycle" label="Jobs" active={isActive('/delivery/dashboard')} />
           <NavItem to="/buyer/profile" icon="user" label="Profile" active={isActive('/buyer/profile')} />
        </>
      ) : null}
    </div>
  );
};

// --- Top Navbar (Desktop/Global) ---
export const Navbar: React.FC = () => {
  const { currentUser, currentRole, logout, cart } = useApp();
  const navigate = useNavigate();
  const location = useLocation();
  const [showDropdown, setShowDropdown] = useState(false);

  // Hide on auth pages
  const isAuthPage = location.pathname === '/' || location.pathname.startsWith('/auth') || location.pathname === '/forgot-password' || location.pathname === '/update-password';
  if (isAuthPage) return null;

  const mainRoutes = ['/', '/login', '/buyer/dashboard', '/vendor/dashboard', '/admin/dashboard', '/delivery/dashboard'];
  const showBackButton = !mainRoutes.includes(location.pathname);

  // Desktop Nav Links Helper - Clean Text Style
  const NavLink = ({ to, label }: { to: string, label: string }) => (
      <Link to={to} className={`text-sm font-semibold transition-all px-4 py-2 rounded-lg hover:bg-gray-50 ${location.pathname === to ? 'text-primary' : 'text-gray-600 hover:text-gray-900'}`}>
          {label}
      </Link>
  );

  return (
    <nav className="sticky top-0 z-40 w-full glass border-b border-white/20">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16 items-center relative">
          
          {/* Left: Logo & Back Button */}
          <div className="flex items-center gap-4 flex-shrink-0">
             {showBackButton && (
                 <button 
                    onClick={() => navigate(-1)} 
                    className="md:hidden w-10 h-10 flex items-center justify-center rounded-full bg-white/80 hover:bg-white border border-gray-100 text-gray-700 transition-all shadow-sm active:scale-95"
                 >
                     <i className="fa-solid fa-arrow-left text-sm"></i>
                 </button>
             )}
             
             {/* Logo */}
             <div className="flex items-center gap-2 cursor-pointer" onClick={() => navigate('/')}>
                <div className="w-9 h-9 bg-gradient-to-tr from-primary to-secondary rounded-xl flex items-center justify-center shadow-lg shadow-primary/20 text-white">
                  <i className="fa-solid fa-bolt"></i>
                </div>
                <span className="text-xl font-display font-extrabold text-gray-900 tracking-tight">LYNQED</span>
             </div>
          </div>

          {/* Center: Desktop Navigation Links (Text Only) */}
          {currentUser && (
             <div className="hidden md:flex absolute left-1/2 transform -translate-x-1/2 items-center gap-6">
                 {currentRole === 'buyer' && (
                     <>
                        <NavLink to="/buyer/dashboard" label="Home" />
                        <NavLink to="/buyer/search" label="Search" />
                        <NavLink to="/buyer/orders" label="Orders" />
                     </>
                 )}
                 {currentRole === 'vendor' && (
                     <>
                        <NavLink to="/vendor/dashboard" label="Dashboard" />
                        <NavLink to="/vendor/products" label="Products" />
                        <NavLink to="/vendor/orders" label="Orders" />
                     </>
                 )}
             </div>
          )}
          
          {/* Right: Cart & Profile */}
          <div className="flex items-center space-x-4 flex-shrink-0">
             {/* Desktop Cart */}
             {currentRole === 'buyer' && (
                 <Link to="/buyer/cart" className="hidden md:flex relative w-10 h-10 items-center justify-center rounded-full hover:bg-gray-100 transition-colors">
                     <i className="fa-solid fa-cart-shopping text-gray-600"></i>
                     {cart.length > 0 && (
                        <span className="absolute top-0 right-0 bg-accent text-white text-[10px] font-bold w-4 h-4 flex items-center justify-center rounded-full border border-white">
                            {cart.length}
                        </span>
                     )}
                 </Link>
             )}

             {currentUser ? (
               <div className="relative">
                  <button 
                    onClick={() => setShowDropdown(!showDropdown)}
                    className="flex items-center gap-2 focus:outline-none p-1 pr-3 rounded-full hover:bg-gray-50 border border-transparent hover:border-gray-100 transition-all"
                  >
                    <Avatar 
                        src={currentUser.avatarUrl} 
                        name={currentUser.name}
                        size="sm"
                        className="border-2 border-white shadow-sm bg-white"
                    />
                    <span className="hidden md:block text-sm font-bold text-gray-700">{currentUser.name.split(' ')[0]}</span>
                    <i className={`fa-solid fa-chevron-down text-[10px] text-gray-400 transition-transform duration-300 ${showDropdown ? 'rotate-180' : ''}`}></i>
                  </button>

                  {/* Profile Dropdown */}
                  {showDropdown && (
                      <>
                          <div className="fixed inset-0 z-40" onClick={() => setShowDropdown(false)}></div>
                          <div className="absolute right-0 mt-3 w-60 bg-white/95 backdrop-blur-xl rounded-3xl shadow-soft ring-1 ring-black ring-opacity-5 z-50 overflow-hidden animate-fade-in transform origin-top-right border border-white/50">
                              <div className="px-6 py-5 bg-gradient-to-r from-gray-50 to-white border-b border-gray-100">
                                  <p className="text-sm font-bold text-gray-900 truncate font-display">{currentUser.name}</p>
                                  <p className="text-xs text-gray-500 truncate">{currentUser.email}</p>
                                  <div className="mt-2 inline-flex px-2 py-0.5 rounded-md bg-primary/10 text-primary text-[10px] font-bold uppercase">{currentRole}</div>
                              </div>
                              
                              <div className="py-2">
                                <Link 
                                  to={currentRole === 'vendor' ? "/vendor/profile" : "/buyer/profile"}
                                  className="flex items-center px-6 py-3 text-sm text-gray-600 hover:bg-indigo-50 hover:text-primary transition-colors group"
                                  onClick={() => setShowDropdown(false)}
                                >
                                    <div className="w-8 h-8 rounded-lg bg-gray-50 flex items-center justify-center mr-3 group-hover:bg-white text-gray-400 group-hover:text-primary transition-colors shadow-sm">
                                        <i className="fa-solid fa-user-gear"></i>
                                    </div>
                                    Settings
                                </Link>
                                
                                {currentRole === 'buyer' && (
                                    <Link 
                                    to="/buyer/wishlist" 
                                    className="flex items-center px-6 py-3 text-sm text-gray-600 hover:bg-indigo-50 hover:text-primary transition-colors group"
                                    onClick={() => setShowDropdown(false)}
                                    >
                                        <div className="w-8 h-8 rounded-lg bg-gray-50 flex items-center justify-center mr-3 group-hover:bg-white text-gray-400 group-hover:text-primary transition-colors shadow-sm">
                                            <i className="fa-solid fa-heart"></i>
                                        </div>
                                        Wishlist
                                    </Link>
                                )}
                              </div>
                              
                              <div className="border-t border-gray-100 py-2">
                                <button 
                                  onClick={async () => { 
                                      await logout(); 
                                      setShowDropdown(false); 
                                      navigate('/'); 
                                  }}
                                  className="flex w-full items-center px-6 py-3 text-sm text-red-500 hover:bg-red-50 transition-colors"
                                >
                                    <i className="fa-solid fa-arrow-right-from-bracket w-8 mr-3"></i> Sign Out
                                </button>
                              </div>
                          </div>
                      </>
                  )}
               </div>
             ) : (
               <Link to="/login">
                 <button className="bg-gray-900 text-white text-sm font-bold px-6 py-2.5 rounded-full shadow-lg hover:bg-gray-800 transition-all active:scale-95">
                    Login
                 </button>
               </Link>
             )}
          </div>
        </div>
      </div>
    </nav>
  );
};

export const Layout: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { currentRole, toast, hideToast } = useApp();
  const location = useLocation();
  const isSearchPage = location.pathname === '/buyer/search';
  const isWelcome = location.pathname === '/';
  const isProductDetail = location.pathname.includes('/product/');
  const isCheckout = location.pathname.includes('/checkout');

  // Add padding only if global bottom nav is visible (MOBILE ONLY)
  const isBottomNavVisible = !(currentRole === 'admin' || isSearchPage || isWelcome || isProductDetail || isCheckout);

  return (
    <div className="min-h-screen bg-background flex flex-col font-sans text-slate-800 relative">
      <Toast toast={toast} onClose={hideToast} />

      {!isSearchPage && !isWelcome && <Navbar />}
      
      <main className={`flex-grow flex flex-col ${isBottomNavVisible ? 'pb-[90px] md:pb-0' : ''}`}>
        {children}
      </main>
      
      <BottomNav />
    </div>
  );
};
