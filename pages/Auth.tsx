


import React, { useState } from 'react';
import { useApp } from '../context';
import { Button, Input } from '../components/UI';
import { useNavigate, Link, useLocation } from 'react-router-dom';
import { Role } from '../types';

export const Login: React.FC = () => {
    const { login } = useApp();
    const navigate = useNavigate();
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState('');

    const handleLogin = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');
        setIsLoading(true);

        const result = await login(email, password);
        
        setIsLoading(false);
        if (result.success) {
            if (result.role === 'admin') navigate('/admin/dashboard');
            else if (result.role === 'vendor') navigate('/vendor/dashboard');
            else if (result.role === 'deliveryPerson') navigate('/delivery/dashboard');
            else navigate('/buyer/dashboard');
        } else {
            setError(result.error || 'Login failed');
        }
    };

    return (
        <div className="min-h-screen flex flex-col bg-white relative overflow-hidden">
            <div className="absolute top-[-10%] right-[-10%] w-64 h-64 bg-primary/10 rounded-full blur-3xl"></div>
            <div className="absolute bottom-[-10%] left-[-10%] w-80 h-80 bg-secondary/10 rounded-full blur-3xl"></div>

            <div className="flex-1 flex flex-col justify-center px-8 py-12 relative z-10 max-w-md mx-auto w-full animate-fade-in">
                <div className="mb-8 text-center">
                    <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-gradient-to-tr from-primary to-secondary text-white text-2xl shadow-glow mb-4">
                         <i className="fa-solid fa-bolt"></i>
                    </div>
                    <h1 className="text-3xl font-display font-extrabold text-gray-900">Welcome Back</h1>
                    <p className="text-gray-500 mt-2">Sign in to continue to LYNQED</p>
                </div>

                {error && (
                    <div className="bg-red-50 border border-red-100 text-red-600 text-sm p-3 rounded-xl mb-4 flex items-center">
                        <i className="fa-solid fa-circle-exclamation mr-2"></i>
                        {error}
                    </div>
                )}

                <form onSubmit={handleLogin} className="space-y-6">
                    <Input 
                        label="Email Address" 
                        icon="envelope" 
                        type="email"
                        placeholder="you@university.edu" 
                        value={email} 
                        onChange={e => setEmail(e.target.value)} 
                        required
                    />
                    
                    <div>
                        <Input 
                            label="Password" 
                            icon="lock" 
                            type="password"
                            placeholder="••••••••" 
                            value={password}
                            onChange={e => setPassword(e.target.value)}
                            required
                        />
                        <div className="flex justify-end -mt-3 mb-2">
                            <Link 
                                to="/forgot-password"
                                className="text-xs font-bold text-primary hover:text-primaryDark transition-colors"
                            >
                                Forgot Password?
                            </Link>
                        </div>
                    </div>

                    <Button 
                        fullWidth 
                        size="lg" 
                        type="submit"
                        disabled={isLoading}
                        className="shadow-xl shadow-primary/30"
                    >
                        {isLoading ? 'Signing in...' : 'Sign In'}
                    </Button>
                </form>

                <div className="mt-8 text-center text-sm text-gray-500">
                    Don't have an account? <Link to="/register" className="font-bold text-primary hover:text-primaryDark transition-colors">Create Account</Link>
                </div>
            </div>
        </div>
    );
};

export const ForgotPassword: React.FC = () => {
    const { resetPassword, showToast } = useApp();
    const navigate = useNavigate();
    const [email, setEmail] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState('');

    const handleReset = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');
        setIsLoading(true);

        const result = await resetPassword(email);
        setIsLoading(false);

        if (result.success) {
            showToast("Reset link sent! Check your email.", "success");
            navigate('/login');
        } else {
            setError(result.error || 'Failed to send reset email.');
        }
    };

    return (
        <div className="min-h-screen flex flex-col bg-white relative overflow-hidden">
            <div className="absolute top-[-10%] left-[-10%] w-64 h-64 bg-primary/10 rounded-full blur-3xl"></div>
            <div className="flex-1 flex flex-col justify-center px-8 py-12 relative z-10 max-w-md mx-auto w-full animate-slide-up">
                <div className="mb-6 text-center">
                    <h1 className="text-2xl font-display font-extrabold text-gray-900">Reset Password</h1>
                    <p className="text-gray-500 mt-2 text-sm">Enter your email to receive reset instructions</p>
                </div>

                {error && (
                    <div className="bg-red-50 border border-red-100 text-red-600 text-sm p-3 rounded-xl mb-4">
                        {error}
                    </div>
                )}

                <form onSubmit={handleReset} className="space-y-6">
                    <Input 
                        label="Email Address" 
                        icon="envelope" 
                        type="email"
                        placeholder="you@university.edu" 
                        value={email} 
                        onChange={e => setEmail(e.target.value)} 
                        required
                    />
                    <Button 
                        fullWidth 
                        size="lg" 
                        type="submit"
                        disabled={isLoading}
                    >
                        {isLoading ? 'Sending...' : 'Send Reset Link'}
                    </Button>
                </form>

                <div className="mt-6 text-center">
                    <Link to="/login" className="text-sm font-bold text-gray-500 hover:text-gray-900">Back to Login</Link>
                </div>
            </div>
        </div>
    );
};

export const UpdatePassword: React.FC = () => {
    const { updatePassword, showToast } = useApp();
    const navigate = useNavigate();
    const [password, setPassword] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState('');

    const handleUpdate = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');
        setIsLoading(true);

        const result = await updatePassword(password);
        setIsLoading(false);

        if (result.success) {
            showToast("Password updated successfully!", "success");
            navigate('/login');
        } else {
            setError(result.error || 'Failed to update password.');
        }
    };

    return (
        <div className="min-h-screen flex flex-col bg-white relative overflow-hidden">
            <div className="absolute bottom-[-10%] right-[-10%] w-64 h-64 bg-secondary/10 rounded-full blur-3xl"></div>
            <div className="flex-1 flex flex-col justify-center px-8 py-12 relative z-10 max-w-md mx-auto w-full animate-slide-up">
                <div className="mb-6 text-center">
                    <h1 className="text-2xl font-display font-extrabold text-gray-900">Set New Password</h1>
                    <p className="text-gray-500 mt-2 text-sm">Create a strong, secure password</p>
                </div>

                {error && (
                    <div className="bg-red-50 border border-red-100 text-red-600 text-sm p-3 rounded-xl mb-4">
                        {error}
                    </div>
                )}

                <form onSubmit={handleUpdate} className="space-y-6">
                    <Input 
                        label="New Password" 
                        icon="lock" 
                        type="password"
                        placeholder="New secure password" 
                        value={password}
                        onChange={e => setPassword(e.target.value)} 
                        required
                        minLength={6}
                    />
                    <Button 
                        fullWidth 
                        size="lg" 
                        type="submit"
                        disabled={isLoading}
                    >
                        {isLoading ? 'Updating...' : 'Update Password'}
                    </Button>
                </form>
            </div>
        </div>
    );
};

export const Register: React.FC = () => {
    const { signup } = useApp();
    const navigate = useNavigate();
    const location = useLocation();
    
    // Check if a role was passed in state (e.g., from "Start Selling" button)
    const preSelectedRole = location.state?.role as Role | undefined;

    const [fullName, setFullName] = useState('');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    // Default to 'buyer', or the pre-selected role if available
    const [role, setRole] = useState<Role>(preSelectedRole || 'buyer');
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState('');

    const handleSignup = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');
        setIsLoading(true);

        const result = await signup(email, password, fullName, role);
        
        setIsLoading(false);
        if (result.success) {
            if (role === 'vendor') {
                 navigate('/vendor/onboarding');
            } else {
                 navigate('/buyer/dashboard');
            }
        } else {
            setError(result.error || 'Registration failed. Email might be taken.');
        }
    };

    return (
        <div className="min-h-screen flex flex-col bg-white relative overflow-hidden">
             <div className="absolute top-[-10%] left-[-10%] w-64 h-64 bg-primary/10 rounded-full blur-3xl"></div>

             <div className="flex-1 flex flex-col justify-center px-8 py-12 relative z-10 max-w-md mx-auto w-full animate-slide-up">
                <div className="mb-6 text-center">
                    <h1 className="text-3xl font-display font-extrabold text-gray-900">Create Account</h1>
                    <p className="text-gray-500 mt-2">Join the campus marketplace</p>
                </div>

                {error && (
                    <div className="bg-red-50 border border-red-100 text-red-600 text-sm p-3 rounded-xl mb-4">
                        {error}
                    </div>
                )}

                <form onSubmit={handleSignup} className="space-y-5">
                    <Input 
                        label="Full Name" 
                        icon="user" 
                        placeholder="John Doe" 
                        value={fullName} 
                        onChange={e => setFullName(e.target.value)} 
                        required
                    />

                    <Input 
                        label="Email Address" 
                        icon="envelope" 
                        type="email" 
                        placeholder="you@university.edu" 
                        value={email} 
                        onChange={e => setEmail(e.target.value)} 
                        required
                    />

                    <Input 
                        label="Password" 
                        icon="lock" 
                        type="password"
                        placeholder="Create a password" 
                        value={password}
                        onChange={e => setPassword(e.target.value)}
                        required
                        minLength={6}
                    />

                    {/* Only show role selection if NOT pre-selected */}
                    {!preSelectedRole ? (
                        <div>
                            <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-2 ml-1">I want to...</label>
                            <div className="grid grid-cols-2 gap-4">
                                <div 
                                    onClick={() => setRole('buyer')}
                                    className={`cursor-pointer rounded-2xl p-3 border-2 text-center transition-all ${role === 'buyer' ? 'border-primary bg-primary/5 text-primary font-bold' : 'border-gray-100 text-gray-500'}`}
                                >
                                    Buy Products
                                </div>
                                <div 
                                    onClick={() => setRole('vendor')}
                                    className={`cursor-pointer rounded-2xl p-3 border-2 text-center transition-all ${role === 'vendor' ? 'border-secondary bg-secondary/5 text-secondary font-bold' : 'border-gray-100 text-gray-500'}`}
                                >
                                    Sell Items
                                </div>
                            </div>
                        </div>
                    ) : (
                        // Show badge indicating pre-selected role
                        <div className="bg-secondary/10 border border-secondary/20 p-3 rounded-xl flex items-center justify-center text-secondary text-sm font-bold">
                            <i className="fa-solid fa-store mr-2"></i> Registering as a Vendor
                        </div>
                    )}

                    <Button 
                        fullWidth 
                        size="lg" 
                        type="submit"
                        disabled={isLoading}
                        className="shadow-xl shadow-primary/30 mt-2"
                    >
                        {isLoading ? 'Creating Account...' : 'Sign Up'}
                    </Button>
                </form>

                <div className="mt-8 text-center text-sm text-gray-500">
                    Already have an account? <Link to="/login" className="font-bold text-primary hover:text-primaryDark transition-colors">Log In</Link>
                </div>
             </div>
        </div>
    );
}

// --- SPECIAL HIDDEN ADMIN LOGIN ---
export const AdminLogin: React.FC = () => {
    const { login } = useApp();
    const navigate = useNavigate();
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');

    const handleAdminLogin = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');
        
        // Log in normally first to authenticate credentials
        const result = await login(email, password);
        
        if (result.success) {
            // Then check if the authenticated user is actually an admin
            if (result.role === 'admin') {
                navigate('/admin/dashboard');
            } else {
                setError("Access Denied: Insufficient Privileges");
            }
        } else {
            setError('Invalid Credentials');
        }
    };

    return (
        <div className="min-h-screen bg-gray-900 text-white flex items-center justify-center p-6">
            <div className="w-full max-w-sm">
                <div className="flex items-center justify-center mb-8 gap-3 opacity-50">
                     <i className="fa-solid fa-shield-halved text-2xl"></i>
                     <span className="font-mono tracking-widest text-sm uppercase">System Access</span>
                </div>

                {error && <div className="text-red-500 text-center text-xs font-mono mb-4">{error}</div>}

                <form onSubmit={handleAdminLogin} className="space-y-4">
                    <div>
                        <label className="text-[10px] font-mono text-gray-500 uppercase">ID</label>
                        <input 
                            className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-3 text-sm focus:outline-none focus:border-white transition-colors font-mono"
                            value={email}
                            onChange={e => setEmail(e.target.value)}
                            autoComplete="off"
                        />
                    </div>
                    <div>
                        <label className="text-[10px] font-mono text-gray-500 uppercase">Key</label>
                        <input 
                            type="password"
                            className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-3 text-sm focus:outline-none focus:border-white transition-colors font-mono"
                            value={password}
                            onChange={e => setPassword(e.target.value)}
                        />
                    </div>
                    <button className="w-full bg-white text-black py-3 rounded-lg font-bold text-xs uppercase tracking-wider hover:bg-gray-200 transition-colors mt-4">
                        Authenticate
                    </button>
                </form>
                <div className="mt-8 text-center">
                    <button onClick={() => navigate('/')} className="text-gray-600 text-[10px] hover:text-gray-400">Exit to Surface</button>
                </div>
            </div>
        </div>
    );
};
