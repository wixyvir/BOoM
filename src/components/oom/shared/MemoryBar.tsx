import { cn } from '../../../lib/utils';
import { formatBytes } from '../../../lib/format';

interface MemoryBarProps {
  used: number;
  total: number;
  label?: string;
  showValues?: boolean;
  variant?: 'default' | 'danger' | 'warning';
  className?: string;
  thresholds?: {
    warning?: number; // percentage
    danger?: number; // percentage
  };
}

export function MemoryBar({
  used,
  total,
  label,
  showValues = true,
  variant,
  className,
  thresholds = { warning: 80, danger: 95 },
}: MemoryBarProps) {
  const percentage = total > 0 ? Math.min((used / total) * 100, 100) : 0;

  // Auto-determine variant based on thresholds if not explicitly set
  let computedVariant: 'default' | 'danger' | 'warning' = variant || 'default';
  if (!variant) {
    if (percentage >= (thresholds.danger || 95)) {
      computedVariant = 'danger';
    } else if (percentage >= (thresholds.warning || 80)) {
      computedVariant = 'warning';
    } else {
      computedVariant = 'default';
    }
  }

  const barStyles = {
    default: 'bg-primary-500',
    warning: 'bg-amber-500',
    danger: 'bg-red-500',
  };

  const bgStyles = {
    default: 'bg-slate-200',
    warning: 'bg-amber-100',
    danger: 'bg-red-100',
  };

  return (
    <div className={cn('space-y-1', className)}>
      {(label || showValues) && (
        <div className="flex justify-between items-center text-sm">
          {label && <span className="text-slate-600">{label}</span>}
          {showValues && (
            <span className="text-slate-500 font-mono text-xs">
              {formatBytes(used)} / {formatBytes(total)} ({percentage.toFixed(1)}%)
            </span>
          )}
        </div>
      )}
      <div className={cn('h-2 rounded-full overflow-hidden', bgStyles[computedVariant])}>
        <div
          className={cn('h-full rounded-full transition-all duration-300', barStyles[computedVariant])}
          style={{ width: `${percentage}%` }}
        />
      </div>
    </div>
  );
}

