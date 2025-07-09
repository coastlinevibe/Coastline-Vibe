// Simple toast hook for notifications
import { useState } from 'react';

type ToastVariant = 'default' | 'destructive' | 'success';

interface ToastProps {
  title: string;
  description?: string;
  variant?: ToastVariant;
  duration?: number;
}

interface Toast extends ToastProps {
  id: string;
}

export function useToast() {
  const [toasts, setToasts] = useState<Toast[]>([]);

  const toast = ({ title, description, variant = 'default', duration = 5000 }: ToastProps) => {
    const id = Math.random().toString(36).substr(2, 9);
    const newToast: Toast = { id, title, description, variant, duration };
    
    setToasts((current) => [...current, newToast]);
    
    // Auto dismiss
    setTimeout(() => {
      setToasts((current) => current.filter((t) => t.id !== id));
    }, duration);
    
    return id;
  };

  const dismiss = (id: string) => {
    setToasts((current) => current.filter((t) => t.id !== id));
  };

  return {
    toast,
    dismiss,
    toasts,
  };
} 