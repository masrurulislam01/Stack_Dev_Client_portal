import {createContext, useContext} from 'react';

export type ToastVariant = 'error' | 'success' | 'info';

export interface ToastItem {
  id: string;
  variant: ToastVariant;
  title: string;
  description?: string;
}

export interface ToastApi {
  show: (variant: ToastVariant, title: string, description?: string) => string;
  error: (title: string, description?: string) => string;
  success: (title: string, description?: string) => string;
  info: (title: string, description?: string) => string;
  dismiss: (id: string) => void;
}

export const ToastContext = createContext<ToastApi | undefined>(undefined);

export function useToast(): ToastApi {
  const ctx = useContext(ToastContext);
  if (!ctx) {
    throw new Error('useToast must be used within a ToastProvider');
  }
  return ctx;
}
