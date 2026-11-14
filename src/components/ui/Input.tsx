import {
  forwardRef,
  useId,
  type InputHTMLAttributes,
  type ReactNode,
  type TextareaHTMLAttributes,
} from 'react';
import {cn} from '@/lib/cn';

const BASE_INPUT_CLASSES =
  'w-full min-h-[44px] rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950 text-sm text-slate-900 dark:text-slate-100 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-600 focus:border-transparent';

export interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: ReactNode;
  labelRight?: ReactNode;
  optionalLabel?: string;
  leftIcon?: ReactNode;
  rightSlot?: ReactNode;
  error?: string;
  hint?: string;
  wrapperClassName?: string;
}

export const Input = forwardRef<HTMLInputElement, InputProps>(
  (
    {
      label,
      labelRight,
      optionalLabel,
      leftIcon,
      rightSlot,
      error,
      hint,
      id,
      className,
      wrapperClassName,
      ...rest
    },
    ref,
  ) => {
    const generatedId = useId();
    const inputId = id ?? generatedId;

    return (
      <div className={cn('space-y-1.5', wrapperClassName)}>
        {(label || labelRight) && (
          <div className="flex items-center justify-between gap-2">
            {label ? (
              <label
                htmlFor={inputId}
                className="block text-sm font-medium text-slate-700 dark:text-slate-300"
              >
                {label}
                {optionalLabel && (
                  <span className="ml-1 text-slate-400 font-normal">{optionalLabel}</span>
                )}
              </label>
            ) : (
              <span />
            )}
            {labelRight}
          </div>
        )}

        <div className="relative">
          {leftIcon && (
            <span className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400">
              {leftIcon}
            </span>
          )}
          <input
            ref={ref}
            id={inputId}
            aria-invalid={error ? 'true' : undefined}
            className={cn(
              BASE_INPUT_CLASSES,
              'py-2.5',
              leftIcon ? 'pl-10' : 'px-3.5',
              rightSlot ? 'pr-11' : 'pr-3.5',
              error && 'border-red-400 dark:border-red-700 focus:ring-red-500',
              className,
            )}
            {...rest}
          />
          {rightSlot && (
            <span className="absolute right-1.5 top-1/2 -translate-y-1/2 flex items-center">
              {rightSlot}
            </span>
          )}
        </div>

        {error && <p className="text-xs text-red-600 dark:text-red-400">{error}</p>}
        {!error && hint && <p className="text-xs text-slate-500 dark:text-slate-400">{hint}</p>}
      </div>
    );
  },
);

Input.displayName = 'Input';

export interface TextareaProps extends TextareaHTMLAttributes<HTMLTextAreaElement> {
  label?: ReactNode;
  optionalLabel?: string;
  error?: string;
  hint?: string;
  wrapperClassName?: string;
}

export const Textarea = forwardRef<HTMLTextAreaElement, TextareaProps>(
  ({label, optionalLabel, error, hint, id, className, wrapperClassName, ...rest}, ref) => {
    const generatedId = useId();
    const textareaId = id ?? generatedId;

    return (
      <div className={cn('space-y-1.5', wrapperClassName)}>
        {label && (
          <label
            htmlFor={textareaId}
            className="block text-sm font-medium text-slate-700 dark:text-slate-300"
          >
            {label}
            {optionalLabel && (
              <span className="ml-1 text-slate-400 font-normal">{optionalLabel}</span>
            )}
          </label>
        )}
        <textarea
          ref={ref}
          id={textareaId}
          aria-invalid={error ? 'true' : undefined}
          className={cn(
            'w-full rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950 px-3.5 py-2.5 text-sm text-slate-900 dark:text-slate-100 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-600 focus:border-transparent resize-y',
            error && 'border-red-400 dark:border-red-700 focus:ring-red-500',
            className,
          )}
          {...rest}
        />
        {error && <p className="text-xs text-red-600 dark:text-red-400">{error}</p>}
        {!error && hint && <p className="text-xs text-slate-500 dark:text-slate-400">{hint}</p>}
      </div>
    );
  },
);

Textarea.displayName = 'Textarea';
