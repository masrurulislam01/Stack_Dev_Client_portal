import {AlertCircle} from 'lucide-react';
import {forwardRef, type SelectHTMLAttributes} from 'react';

export interface SelectProps extends SelectHTMLAttributes<HTMLSelectElement> {
  label?: string;
  error?: string;
}

export const Select = forwardRef<HTMLSelectElement, SelectProps>(function Select(
  {label, error, id, className = '', children, ...props},
  ref,
) {
  return (
    <div>
      {label && (
        <label
          htmlFor={id}
          className="block text-[13px] font-semibold text-foreground mb-1.5"
        >
          {label}
        </label>
      )}
      <select
        ref={ref}
        id={id}
        aria-invalid={error ? true : undefined}
        className={`w-full min-h-[44px] px-3.5 py-2.5 rounded-xl border bg-surface text-sm text-foreground transition-colors duration-150 focus:outline-none focus:ring-[3px] focus:ring-ring ${
          error
            ? 'border-danger focus:border-danger'
            : 'border-border hover:border-border-strong focus:border-primary-600'
        } ${className}`}
        {...props}
      >
        {children}
      </select>
      {error && (
        <p role="alert" className="mt-1.5 flex items-center gap-1.5 text-xs font-medium text-danger-text">
          <AlertCircle className="w-3.5 h-3.5 shrink-0" aria-hidden="true" />
          <span>{error}</span>
        </p>
      )}
    </div>
  );
});
