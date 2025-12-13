import type { ReactNode } from 'react';
import { cn } from '../../../lib/utils';

interface SectionCardProps {
  title: string;
  icon?: ReactNode;
  children: ReactNode;
  headerRight?: ReactNode;
  className?: string;
  variant?: 'default' | 'danger' | 'warning';
}

export function SectionCard({
  title,
  icon,
  children,
  headerRight,
  className,
  variant = 'default',
}: SectionCardProps) {
  const variantStyles = {
    default: 'border-slate-200',
    danger: 'border-red-200',
    warning: 'border-amber-200',
  };

  const headerStyles = {
    default: 'bg-slate-50 border-slate-100',
    danger: 'bg-red-50 border-red-100',
    warning: 'bg-amber-50 border-amber-100',
  };

  const titleStyles = {
    default: 'text-slate-700',
    danger: 'text-red-700',
    warning: 'text-amber-700',
  };

  return (
    <div
      className={cn(
        'bg-white rounded-xl shadow-sm border overflow-hidden',
        variantStyles[variant],
        className
      )}
    >
      <div
        className={cn(
          'border-b px-4 py-3 flex items-center justify-between',
          headerStyles[variant]
        )}
      >
        <div className={cn('flex items-center gap-2 font-medium', titleStyles[variant])}>
          {icon}
          <span>{title}</span>
        </div>
        {headerRight}
      </div>
      <div className="p-4">{children}</div>
    </div>
  );
}
