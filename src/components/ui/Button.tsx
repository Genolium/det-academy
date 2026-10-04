import React from 'react';

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'dark' | 'outline' | 'ghost' | 'mint';
  size?: 'sm' | 'md' | 'lg';
  children: React.ReactNode;
  icon?: React.ReactNode;
  className?: string;
}

export const Button: React.FC<ButtonProps> = ({
  variant = 'primary',
  size = 'md',
  children,
  icon,
  className = '',
  ...props
}) => {
  const variantStyles = {
    primary: 'bg-[#D2F544] hover:bg-[#C4F22C] text-[#0C2418] font-bold shadow-md hover:shadow-lg',
    dark: 'bg-[#0E1012] hover:bg-[#1a1e22] text-white font-semibold border border-neutral-800',
    outline: 'border-2 border-[#0E1012] hover:bg-[#0E1012] hover:text-white text-[#0E1012] font-semibold',
    ghost: 'hover:bg-slate-100 text-slate-800 font-medium',
    mint: 'bg-[#E2F7EB] hover:bg-[#d0f3dd] text-[#0C2418] font-semibold',
  };

  const sizeStyles = {
    sm: 'px-4 py-2 text-xs rounded-full',
    md: 'px-6 py-3 text-sm rounded-full',
    lg: 'px-8 py-4 text-base rounded-full',
  };

  return (
    <button
      className={`inline-flex items-center justify-center gap-2 cursor-pointer transition-all duration-200 active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed ${variantStyles[variant]} ${sizeStyles[size]} ${className}`}
      {...props}
    >
      {children}
      {icon && <span className="transition-transform group-hover:translate-x-0.5">{icon}</span>}
    </button>
  );
};
