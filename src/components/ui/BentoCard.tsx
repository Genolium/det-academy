import React from 'react';

interface BentoCardProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?: 'dark' | 'lime' | 'light' | 'mint' | 'sage';
  children: React.ReactNode;
  className?: string;
}

export const BentoCard: React.FC<BentoCardProps> = ({
  variant = 'light',
  children,
  className = '',
  ...props
}) => {
  const variantStyles = {
    dark: 'bg-[#111315] text-white border border-[#23272B] shadow-xl',
    lime: 'bg-[#D2F544] text-[#0C2418] border border-[#BCE828] shadow-lg',
    light: 'bg-white text-[#0E1012] border border-[#E5E7EB] shadow-sm',
    mint: 'bg-[#E2F7EB] text-[#0C2418] border border-[#C5ECD6]',
    sage: 'bg-[#EEF5EE] text-[#0C2418] border border-[#DEEADE]',
  };

  return (
    <div
      className={`rounded-3xl p-6 md:p-8 transition-all duration-300 hover:shadow-md ${variantStyles[variant]} ${className}`}
      {...props}
    >
      {children}
    </div>
  );
};
