import React from 'react';

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