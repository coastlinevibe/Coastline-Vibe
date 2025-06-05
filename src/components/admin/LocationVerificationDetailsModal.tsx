'use client';

import type { LocationVerificationRequest } from '@/types/admin'; // Updated import path
import { XMarkIcon } from '@heroicons/react/24/outline'; // Corrected from XIcon to XMarkIcon

interface LocationVerificationDetailsModalProps {
  request: LocationVerificationRequest | null;
  onClose: () => void;
}

export default function LocationVerificationDetailsModal({ request, onClose }: LocationVerificationDetailsModalProps) {
  if (!request) {
    return null;
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 p-4">
      <div className="bg-white rounded-lg shadow-xl p-6 w-full max-w-lg relative">
        <button
          onClick={onClose}
          className="absolute top-3 right-3 text-gray-400 hover:text-gray-600"
          aria-label="Close modal"
        >
          <XMarkIcon className="h-6 w-6" />
        </button>
        <h2 className="text-xl font-semibold text-gray-900 mb-4">
          Location Verification Details
        </h2>
        
        <div className="space-y-3 text-sm">
          <div>
            <span className="font-semibold text-gray-700">User:</span>
            <p className="text-gray-600">{request.username || 'N/A'} ({request.email || 'N/A'})</p>
            <p className="text-xs text-gray-500">User ID: {request.user_id}</p>
          </div>
          
          <div>
            <span className="font-semibold text-gray-700">Submitted Address:</span>
            <p className="text-gray-600">{request.address_line1}</p>
            <p className="text-gray-600">{request.city}, {request.postal_code}</p>
            <p className="text-gray-600">{request.country}</p>
          </div>

          <div>
            <span className="font-semibold text-gray-700">Status:</span>
            <p className="text-gray-600 capitalize">{request.status}</p>
          </div>

          <div>
            <span className="font-semibold text-gray-700">Submitted On:</span>
            <p className="text-gray-600">{new Date(request.created_at).toLocaleString()}</p>
          </div>
        </div>

        <div className="mt-6 flex justify-end">
          <button
            onClick={onClose}
            className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-md"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
} 