
import React, { useState } from 'react';
import { useApp } from '../context';
import { Button, Input } from '../components/UI';
import { useNavigate, Link } from 'react-router-dom';
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

        // For this local DB version, password validation is mocked (any password works if email exists)
        const result = await login(email, password);
        
        setIsLoading(false);
        if (result.success) {
            // Intelligent Routing based on Role
            if (result.role === 'admin') {
                navigate('/admin/dashboard');
            } else if (result.role === 'vendor') {
                navigate('/vendor/dashboard');
            } else {
                navigate('/buyer/dashboard');
            }
        } else {
            setError(result.error || 'Login failed');
        }
    };

    return (
        <div className="min-h-screen flex flex-col bg-white relative overflow-hidden">
            {/* Decorations */}
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
                    
                    <Input 
                        label="Password" 
                        icon="lock" 
                        type="password"
                        placeholder="••••••••" 
                        value={password}
                        onChange={e => setPassword(e.target.value)}
                        required
                    />

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

export const Register: React.FC = () => {
    const { signup } = useApp();
    const navigate = useNavigate();
    const [fullName, setFullName] = useState('');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [role, setRole] = useState<Role>('buyer');
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
        // Force check if the email matches expected admin
        if (email !== 'admin@lynqed.com') {
            setError("Unauthorized Access");
            return;
        }
        
        const result = await login(email, password);
        if (result.success && result.role === 'admin') {
            navigate('/admin/dashboard');
        } else {
            setError('Invalid Admin Credentials');
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
