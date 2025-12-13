import { cn } from '../../../lib/utils';

interface MetricDisplayProps {
  label: string;
  value: string | number;
  unit?: string;
  variant?: 'default' | 'success' | 'warning' | 'danger';
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

export function MetricDisplay({
  label,
  value,
  unit,
  variant = 'default',
  size = 'md',
  className,
}: MetricDisplayProps) {
  const variantStyles = {
    default: 'text-slate-900',
    success: 'text-green-600',
    warning: 'text-amber-600',
    danger: 'text-red-600',
  };

  const sizeStyles = {
    sm: 'text-sm',
    md: 'text-base',
    lg: 'text-lg',
  };

  return (
    <div className={cn('flex flex-col', className)}>
      <span className="text-xs text-slate-500 uppercase tracking-wide">{label}</span>
      <span className={cn('font-semibold', variantStyles[variant], sizeStyles[size])}>
        {value}
        {unit && <span className="text-slate-400 font-normal ml-1">{unit}</span>}
      </span>
    </div>
  );
}

interface MetricGridProps {
  children: React.ReactNode;
  columns?: 2 | 3 | 4 | 5 | 6;
  className?: string;
}

export function MetricGrid({ children, columns = 4, className }: MetricGridProps) {
  const colStyles = {
    2: 'grid-cols-2',
    3: 'grid-cols-3',
    4: 'grid-cols-2 md:grid-cols-4',
    5: 'grid-cols-2 md:grid-cols-5',
    6: 'grid-cols-2 md:grid-cols-3 lg:grid-cols-6',
  };

  return <div className={cn('grid gap-4', colStyles[columns], className)}>{children}</div>;
}
