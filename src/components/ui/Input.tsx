import {AlertCircle} from 'lucide-react';
import {forwardRef, type InputHTMLAttributes, type TextareaHTMLAttributes} from 'react';

export interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  hint?: string;
}

export const Input = forwardRef<HTMLInputElement, InputProps>(function Input(
  {label, error, hint, id, className = '', ...props},
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
      <input
        ref={ref}
        id={id}
        aria-invalid={error ? true : undefined}
        className={`w-full min-h-[44px] px-3.5 py-2.5 rounded-xl border bg-surface text-sm text-foreground placeholder:text-subtle transition-colors duration-150 focus:outline-none focus:ring-[3px] focus:ring-ring ${
          error
            ? 'border-danger focus:border-danger'
            : 'border-border hover:border-border-strong focus:border-primary-600'
        } ${className}`}
        {...props}
      />
      {error && (
        <p role="alert" className="mt-1.5 flex items-center gap-1.5 text-xs font-medium text-danger-text">
          <AlertCircle className="w-3.5 h-3.5 shrink-0" aria-hidden="true" />
          <span>{error}</span>
        </p>
      )}
      {!error && hint && <p className="mt-1.5 text-xs text-muted">{hint}</p>}
    </div>
  );
});

export interface TextareaProps extends TextareaHTMLAttributes<HTMLTextAreaElement> {
  label?: string;
  error?: string;
}

export const Textarea = forwardRef<HTMLTextAreaElement, TextareaProps>(function Textarea(
  {label, error, id, className = '', ...props},
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
      <textarea
        ref={ref}
        id={id}
        aria-invalid={error ? true : undefined}
        className={`w-full px-3.5 py-2.5 rounded-xl border bg-surface text-sm text-foreground placeholder:text-subtle transition-colors duration-150 focus:outline-none focus:ring-[3px] focus:ring-ring resize-y ${
          error
            ? 'border-danger focus:border-danger'
            : 'border-border hover:border-border-strong focus:border-primary-600'
        } ${className}`}
        {...props}
      />
      {error && (
        <p role="alert" className="mt-1.5 flex items-center gap-1.5 text-xs font-medium text-danger-text">
          <AlertCircle className="w-3.5 h-3.5 shrink-0" aria-hidden="true" />
          <span>{error}</span>
        </p>
      )}
    </div>
  );
});
