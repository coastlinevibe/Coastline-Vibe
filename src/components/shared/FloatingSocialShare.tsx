'use client';

import { useState, useEffect } from 'react';
import { Share2, X } from 'lucide-react';
import SocialShareButtons from './SocialShareButtons';
import { useTranslation } from '@/hooks/useTranslation';

interface FloatingSocialShareProps {
  url: string;
  title: string;
  description?: string;
  imageUrl?: string;
  position?: 'left' | 'right';
}

export default function FloatingSocialShare({
  url,
  title,
  description = '',
  imageUrl = '',
  position = 'right'
}: FloatingSocialShareProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [isVisible, setIsVisible] = useState(false);
  const { t } = useTranslation();

  // Show the floating button after scrolling a bit
  useEffect(() => {
    const handleScroll = () => {
      const scrollY = window.scrollY;
      setIsVisible(scrollY > 300);
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  if (!isVisible) {
    return null;
  }

  return (
    <div 
      className={`fixed bottom-6 z-40 ${position === 'right' ? 'right-4' : 'left-4'} transition-all duration-300`}
    >
      {!isOpen ? (
        <button
          onClick={() => setIsOpen(true)}
          className="bg-primaryTeal text-white p-3 rounded-full shadow-lg hover:bg-teal-600 transition-colors"
          aria-label={t('social.share', 'Share')}
          title={t('social.share', 'Share')}
        >
          <Share2 size={20} />
        </button>
      ) : (
        <div className="bg-white rounded-lg shadow-xl p-4 animate-fade-in">
          <div className="flex justify-between items-center mb-3">
            <h3 className="font-medium text-gray-800">{t('social.shareWithFriends', 'Share with friends')}</h3>
            <button
              onClick={() => setIsOpen(false)}
              className="text-gray-500 hover:text-gray-700"
              aria-label={t('common.close', 'Close')}
            >
              <X size={18} />
            </button>
          </div>
          
          <SocialShareButtons
            url={url}
            title={title}
            description={description}
            imageUrl={imageUrl}
            showLabel={false}
          />
        </div>
      )}
    </div>
  );
} 