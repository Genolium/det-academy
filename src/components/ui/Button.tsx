import React from 'react';
import Link from 'next/link';

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'dark' | 'outline' | 'ghost' | 'mint';
  size?: 'sm' | 'md' | 'lg';
  children: React.ReactNode;
  icon?: React.ReactNode;
  className?: string;
  href?: string;
}

const variantStyles = {
  primary: 'bg-brand-lime hover:bg-brand-lime-hover text-brand-forest font-bold shadow-md hover:shadow-lg',
  dark: 'bg-brand-obsidian hover:bg-[#1a1e22] text-white font-semibold border border-neutral-800',
  outline: 'border-2 border-brand-obsidian hover:bg-brand-obsidian hover:text-white text-brand-obsidian font-semibold',
  ghost: 'hover:bg-slate-100 text-slate-800 font-medium',
  mint: 'bg-brand-mint hover:bg-[#d0f3dd] text-brand-forest font-semibold',
};

const sizeStyles = {
  sm: 'px-4 py-2 text-xs rounded-full',
  md: 'px-6 py-3 text-sm rounded-full',
  lg: 'px-8 py-4 text-base rounded-full',
};

function buttonClass(variant: keyof typeof variantStyles, size: keyof typeof sizeStyles, className: string) {
  return `inline-flex items-center justify-center gap-2 cursor-pointer transition-all duration-200 active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed ${variantStyles[variant]} ${sizeStyles[size]} ${className}`;
}

export const Button: React.FC<ButtonProps> = ({
  variant = 'primary',
  size = 'md',
  children,
  icon,
  className = '',
  href,
  ...props
}) => {
  const classes = buttonClass(variant, size, className);
  const content = (
    <>
      {children}
      {icon && <span className="transition-transform group-hover:translate-x-0.5">{icon}</span>}
    </>
  );

  if (href) {
    return (
      <Link href={href} className={classes}>
        {content}
      </Link>
    );
  }

  return (
    <button className={classes} {...props}>
      {content}
    </button>
  );
};
