import { forwardRef, type InputHTMLAttributes } from 'react';
import { Check } from 'lucide-react';
import { cn } from '@/lib/utils';

interface CheckboxProps extends Omit<InputHTMLAttributes<HTMLInputElement>, 'type'> {
  checked?: boolean;
  indeterminate?: boolean;
}

export const Checkbox = forwardRef<HTMLInputElement, CheckboxProps>(
  ({ className, checked, indeterminate, ...props }, ref) => {
    return (
      <label className={cn('relative inline-flex h-4 w-4 cursor-pointer items-center justify-center', className)}>
        <input
          ref={ref}
          type="checkbox"
          checked={checked}
          className="peer sr-only"
          {...props}
        />
        <span
          className={cn(
            'flex h-4 w-4 items-center justify-center rounded border transition-colors',
            checked || indeterminate
              ? 'border-primary bg-primary text-primary-foreground'
              : 'border-border bg-background',
          )}
        >
          {checked && <Check className="h-3 w-3" strokeWidth={3} />}
          {indeterminate && !checked && (
            <div className="h-0.5 w-2 bg-primary-foreground" />
          )}
        </span>
      </label>
    );
  },
);
Checkbox.displayName = 'Checkbox';
