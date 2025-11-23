
import React, { useEffect, useState } from 'react';

// --- Avatar (New Component) ---
interface AvatarProps {
  src?: string | null;
  name: string;
  size?: 'sm' | 'md' | 'lg' | 'xl' | '2xl';
  className?: string;
  onClick?: () => void;
}

export const Avatar: React.FC<AvatarProps> = ({ src, name, size = 'md', className = '', onClick }) => {
  const [imgError, setImgError] = useState(false);

  // Reset error state if src changes
  useEffect(() => {
    setImgError(false);
  }, [src]);

  const initials = name
    ? name.split(' ').slice(0, 2).map(n => n[0]).join('').toUpperCase()
    : '?';

  // Size mappings
  const sizeClasses = {
    sm: "w-8 h-8 text-[10px]",
    md: "w-10 h-10 text-xs",
    lg: "w-14 h-14 text-sm",
    xl: "w-24 h-24 text-xl",
    '2xl': "w-32 h-32 text-3xl"
  };

  // Deterministic color based on name length (simple consistent coloring)
  const colors = [
    'bg-blue-100 text-blue-600',
    'bg-green-100 text-green-600',
    'bg-yellow-100 text-yellow-600',
    'bg-purple-100 text-purple-600',
    'bg-pink-100 text-pink-600',
    'bg-indigo-100 text-indigo-600',
  ];
  const colorIndex = name.length % colors.length;
  const colorClass = colors[colorIndex];

  const baseClasses = `rounded-full flex items-center justify-center font-bold object-cover shadow-sm border border-white flex-shrink-0 ${sizeClasses[size]} ${className}`;

  if (src && !imgError) {
    return (
      <img 
        src={src} 
        alt={name} 
        className={`${baseClasses} bg-gray-100`}
        onError={() => setImgError(true)}
        onClick={onClick}
      />
    );
  }

  return (
    <div className={`${baseClasses} ${colorClass}`} onClick={onClick} title={name}>
      {initials}
    </div>
  );
};

// --- Button ---
interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'outline' | 'ghost' | 'danger' | 'success';
  fullWidth?: boolean;
  size?: 'sm' | 'md' | 'lg';
  icon?: string;
}

export const Button: React.FC<ButtonProps> = ({ 
  children, variant = 'primary', fullWidth, size = 'md', icon, className = '', ...props 
}) => {
  const base = "inline-flex items-center justify-center rounded-2xl font-semibold transition-all duration-300 active:scale-[0.96] disabled:opacity-50 disabled:active:scale-100 tracking-tight";
  
  const variants = {
    primary: "bg-gradient-to-r from-primary to-primaryDark text-white hover:shadow-glow shadow-lg shadow-primary/30 border border-transparent",
    secondary: "bg-white text-gray-800 border border-gray-100 hover:bg-gray-50 shadow-sm",
    outline: "border-2 border-primary/20 text-primary bg-transparent hover:bg-primary/5",
    ghost: "bg-transparent text-gray-500 hover:bg-gray-100/50 hover:text-gray-900 shadow-none",
    danger: "bg-red-50 text-red-600 hover:bg-red-100 border border-red-100",
    success: "bg-green-500 text-white hover:bg-green-600 shadow-lg shadow-green-500/30 border border-transparent"
  };

  const sizes = {
    sm: "px-3 py-1.5 text-xs",
    md: "px-5 py-3 text-sm",
    lg: "px-8 py-4 text-base"
  };

  return (
    <button 
      className={`${base} ${variants[variant]} ${sizes[size]} ${fullWidth ? 'w-full' : ''} ${className}`}
      {...props}
    >
      {icon && <i className={`fa-solid fa-${icon} mr-2.5 ${size === 'sm' ? 'text-xs' : 'text-sm'}`}></i>}
      {children}
    </button>
  );
};

// --- Input ---
interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  icon?: string;
}

export const Input: React.FC<InputProps> = ({ label, icon, className = '', ...props }) => (
  <div className={`mb-5 ${className}`}>
    {label && <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-2 ml-1">{label}</label>}
    <div className="relative group">
      {icon && (
        <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
          <i className={`fa-solid fa-${icon} text-gray-400 group-focus-within:text-primary transition-colors duration-300`}></i>
        </div>
      )}
      <input 
        className={`block w-full rounded-2xl border-transparent bg-white shadow-sm ring-1 ring-gray-100 py-3.5 ${icon ? 'pl-11' : 'pl-5'} pr-4 text-gray-900 placeholder-gray-400 focus:border-primary focus:bg-white focus:ring-2 focus:ring-primary/20 transition-all duration-300 ease-out sm:text-sm`}
        {...props}
      />
    </div>
  </div>
);

// --- Badge ---
export const Badge: React.FC<{ children: React.ReactNode; color?: string; className?: string }> = ({ children, color = 'violet', className = '' }) => {
    const colors: Record<string, string> = {
        violet: 'bg-indigo-50 text-indigo-700 border-indigo-100',
        blue: 'bg-blue-50 text-blue-700 border-blue-100',
        green: 'bg-emerald-50 text-emerald-700 border-emerald-100',
        red: 'bg-rose-50 text-rose-700 border-rose-100',
        yellow: 'bg-amber-50 text-amber-700 border-amber-100',
        gray: 'bg-gray-100 text-gray-600 border-gray-200'
    };
    
    return (
        <span className={`inline-flex items-center px-3 py-1 rounded-lg text-[10px] font-bold uppercase tracking-wide border ${colors[color] || colors.violet} ${className}`}>
            {children}
        </span>
    )
}

// --- Card ---
export const Card: React.FC<{ children: React.ReactNode; className?: string; onClick?: () => void }> = ({ children, className = '', onClick }) => (
  <div 
    onClick={onClick} 
    className={`bg-white rounded-3xl shadow-card border border-gray-50 overflow-hidden transition-all duration-300 hover:shadow-float ${onClick ? 'cursor-pointer hover:-translate-y-1 active:scale-[0.98]' : ''} ${className}`}
  >
    {children}
  </div>
);

// --- Spinner ---
export const Spinner: React.FC = () => (
    <div className="animate-spin rounded-full h-6 w-6 border-2 border-gray-200 border-b-primary"></div>
);

// --- Toast Notification ---
export interface ToastMessage {
    message: string;
    type: 'success' | 'error' | 'info';
}

export const Toast: React.FC<{ toast: ToastMessage | null; onClose: () => void }> = ({ toast, onClose }) => {
    const [visible, setVisible] = useState(false);

    useEffect(() => {
        if (toast) {
            setVisible(true);
            const timer = setTimeout(() => {
                setVisible(false);
                setTimeout(onClose, 300); // Wait for animation
            }, 3000);
            return () => clearTimeout(timer);
        }
    }, [toast, onClose]);

    if (!toast) return null;

    const icons = {
        success: 'circle-check',
        error: 'circle-exclamation',
        info: 'circle-info'
    };

    const colors = {
        success: 'bg-gray-900 text-white',
        error: 'bg-red-500 text-white',
        info: 'bg-blue-500 text-white'
    };

    return (
        <div className={`fixed top-6 left-1/2 transform -translate-x-1/2 z-[100] transition-all duration-500 ease-in-out ${visible ? 'translate-y-0 opacity-100' : '-translate-y-8 opacity-0'}`}>
            <div className={`flex items-center gap-3 px-6 py-3 rounded-full shadow-2xl ${colors[toast.type]} min-w-[200px] max-w-xs`}>
                <i className={`fa-solid fa-${icons[toast.type]}`}></i>
                <span className="text-sm font-bold tracking-wide">{toast.message}</span>
            </div>
        </div>
    );
};
