'use client';

import React from 'react';
import { CheckCircle, XCircle } from 'lucide-react';
import { useTranslation } from '@/hooks/useTranslation';

interface VerificationBadgeProps {
  isVerified: boolean;
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

export default function VerificationBadge({ 
  isVerified, 
  size = 'md',
  className = ''
}: VerificationBadgeProps) {
  const { t } = useTranslation();
  
  // Determine size classes
  const sizeClasses = {
    sm: 'w-4 h-4',
    md: 'w-5 h-5',
    lg: 'w-6 h-6'
  };
  
  return (
    <div className={`inline-flex items-center ${className}`} title={isVerified ? t('directory.verified', 'Verified Business') : t('directory.unverified', 'Unverified Business')}>
      {isVerified ? (
        <CheckCircle className={`${sizeClasses[size]} text-green-500`} />
      ) : (
        <XCircle className={`${sizeClasses[size]} text-gray-400`} />
      )}
    </div>
  );
} 