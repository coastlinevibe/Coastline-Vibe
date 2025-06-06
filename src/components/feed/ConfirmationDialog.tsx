'use client';

import React from 'react';
import { X } from 'lucide-react';

interface ConfirmationDialogProps {
  isOpen: boolean;
  title: string;
  message: string;
  confirmText?: string;
  cancelText?: string;
  onConfirm: () => void;
  onCancel: () => void;
  variant?: 'danger' | 'warning' | 'info';
}

const ConfirmationDialog: React.FC<ConfirmationDialogProps> = ({
  isOpen,
  title,
  message,
  confirmText = 'Confirm',
  cancelText = 'Cancel',
  onConfirm,
  onCancel,
  variant = 'info'
}) => {
  if (!isOpen) return null;

  const getVariantStyles = () => {
    switch (variant) {
      case 'danger':
        return {
          button: 'bg-red-500 hover:bg-red-600',
          header: 'bg-red-100 text-red-800'
        };
      case 'warning':
        return {
          button: 'bg-amber-500 hover:bg-amber-600',
          header: 'bg-amber-100 text-amber-800'
        };
      case 'info':
      default:
        return {
          button: 'bg-blue-500 hover:bg-blue-600',
          header: 'bg-blue-100 text-blue-800'
        };
    }
  };

  const styles = getVariantStyles();

  return (
    <div className="fixed inset-0 flex items-center justify-center z-50">
      {/* Backdrop */}
      <div 
        className="fixed inset-0 bg-black bg-opacity-50" 
        onClick={onCancel}
      ></div>
      
      {/* Dialog */}
      <div className="bg-white rounded-lg shadow-lg w-full max-w-md mx-4 z-10">
        {/* Header */}
        <div className={`${styles.header} px-4 py-3 rounded-t-lg flex justify-between items-center`}>
          <h3 className="font-medium">{title}</h3>
          <button 
            onClick={onCancel}
            className="p-1 rounded-full hover:bg-white hover:bg-opacity-20"
          >
            <X size={18} />
          </button>
        </div>
        
        {/* Content */}
        <div className="p-4">
          <p className="text-gray-700">{message}</p>
        </div>
        
        {/* Actions */}
        <div className="px-4 py-3 bg-gray-50 rounded-b-lg flex justify-end space-x-2">
          <button
            onClick={onCancel}
            className="px-4 py-2 bg-gray-200 text-gray-700 rounded hover:bg-gray-300"
          >
            {cancelText}
          </button>
          <button
            onClick={onConfirm}
            className={`px-4 py-2 text-white rounded ${styles.button}`}
          >
            {confirmText}
          </button>
        </div>
      </div>
    </div>
  );
};

export default ConfirmationDialog; 