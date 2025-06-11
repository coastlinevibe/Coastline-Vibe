import React from 'react';
import { X } from 'lucide-react';

interface KindnessReminderProps {
  isOpen: boolean;
  onClose: () => void;
  onContinue: () => void;
  onEdit: () => void;
  message: string;
  flaggedContent?: string;
}

const KindnessReminder: React.FC<KindnessReminderProps> = ({
  isOpen,
  onClose,
  onContinue,
  onEdit,
  message,
  flaggedContent
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-md w-full p-6 relative">
        <button 
          onClick={onClose}
          className="absolute top-4 right-4 text-gray-400 hover:text-gray-600"
          aria-label="Close"
        >
          <X size={20} />
        </button>
        
        <div className="text-center mb-6">
          <div className="mx-auto bg-blue-100 rounded-full w-16 h-16 flex items-center justify-center mb-4">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 text-blue-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <h3 className="text-lg font-medium text-gray-900 mb-2">Kindness Reminder</h3>
          <p className="text-gray-600">{message}</p>
        </div>
        
        {flaggedContent && (
          <div className="bg-gray-50 p-3 rounded-md mb-6 border border-gray-200">
            <p className="text-sm text-gray-500 mb-1">Flagged content:</p>
            <p className="text-gray-700 text-sm">{flaggedContent}</p>
          </div>
        )}
        
        <div className="flex justify-between gap-4">
          <button
            onClick={onEdit}
            className="flex-1 px-4 py-2 bg-white border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
          >
            Edit Post
          </button>
          <button
            onClick={onContinue}
            className="flex-1 px-4 py-2 bg-blue-600 border border-transparent rounded-md shadow-sm text-sm font-medium text-white hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
          >
            Continue Anyway
          </button>
        </div>
      </div>
    </div>
  );
};

export default KindnessReminder; 