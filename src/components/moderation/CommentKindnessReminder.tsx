import React from 'react';
import { AlertCircle } from 'lucide-react';

interface CommentKindnessReminderProps {
  isVisible: boolean;
  message: string;
  onEdit: () => void;
  onIgnore: () => void;
}

const CommentKindnessReminder: React.FC<CommentKindnessReminderProps> = ({
  isVisible,
  message,
  onEdit,
  onIgnore
}) => {
  if (!isVisible) return null;

  return (
    <div className="bg-amber-50 border border-amber-200 rounded-md p-3 mb-3">
      <div className="flex items-start">
        <AlertCircle className="text-amber-500 mr-2 flex-shrink-0 mt-0.5" size={18} />
        <div className="flex-1">
          <p className="text-sm text-amber-800 mb-2">{message}</p>
          <div className="flex space-x-3">
            <button
              onClick={onEdit}
              className="text-xs font-medium text-amber-700 hover:text-amber-900"
            >
              Edit Comment
            </button>
            <button
              onClick={onIgnore}
              className="text-xs font-medium text-gray-500 hover:text-gray-700"
            >
              Post Anyway
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CommentKindnessReminder; 