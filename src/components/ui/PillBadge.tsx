import React from 'react';

interface PillBadgeProps {
  children: React.ReactNode;
  variant?: 'lime' | 'dark' | 'mint' | 'outline' | 'slate';
  prefixHash?: boolean;
  className?: string;
}

export const PillBadge: React.FC<PillBadgeProps> = ({
  children,
  variant = 'lime',
  prefixHash = false,
  className = '',
}) => {
  const variantStyles = {
    lime: 'bg-[#D2F544] text-[#0C2418] font-semibold',
    dark: 'bg-[#0E1012] text-white font-medium border border-neutral-800',
    mint: 'bg-[#E2F7EB] text-[#0C2418] font-medium border border-[#C5ECD6]',
    outline: 'border border-[#0E1012] text-[#0E1012] font-semibold bg-transparent',
    slate: 'bg-slate-100 text-slate-700 font-medium border border-slate-200',
  };

  // Avoid duplicated hash when the label already starts with "#"
  const content =
    prefixHash && typeof children === 'string' ? children.replace(/^\s*#+\s*/, '') : children;

  return (
    <span
      className={`inline-flex items-center gap-1 px-3.5 py-1 rounded-full text-xs tracking-wider uppercase ${variantStyles[variant]} ${className}`}
    >
      {prefixHash && <span className="opacity-60">#</span>}
      {content}
    </span>
  );
};
