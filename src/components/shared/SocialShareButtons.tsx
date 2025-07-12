'use client';

import React, { useState } from 'react';
import { Facebook, Twitter, Linkedin, Mail, Link, Copy, Check, Share2 } from 'lucide-react';
import { useTranslation } from '@/hooks/useTranslation';

interface SocialShareButtonsProps {
  url: string;
  title: string;
  description?: string;
  imageUrl?: string;
  compact?: boolean;
  className?: string;
  showLabel?: boolean;
}

export default function SocialShareButtons({
  url,
  title,
  description = '',
  imageUrl = '',
  compact = false,
  className = '',
  showLabel = true
}: SocialShareButtonsProps) {
  const [copied, setCopied] = useState(false);
  const [isOpen, setIsOpen] = useState(false);
  const { t } = useTranslation();

  // Ensure we're using the full URL
  const fullUrl = url.startsWith('http') ? url : `${typeof window !== 'undefined' ? window.location.origin : ''}${url}`;
  
  // Encode parameters for sharing
  const encodedUrl = encodeURIComponent(fullUrl);
  const encodedTitle = encodeURIComponent(title);
  const encodedDescription = encodeURIComponent(description);
  const encodedImage = encodeURIComponent(imageUrl);

  const shareLinks = [
    {
      name: 'Facebook',
      icon: Facebook,
      color: 'bg-[#1877F2] hover:bg-[#0E65D9]',
      url: `https://www.facebook.com/sharer/sharer.php?u=${encodedUrl}`,
      label: t('social.shareOnFacebook', 'Share on Facebook')
    },
    {
      name: 'Twitter',
      icon: Twitter,
      color: 'bg-[#1DA1F2] hover:bg-[#0C90E1]',
      url: `https://twitter.com/intent/tweet?url=${encodedUrl}&text=${encodedTitle}`,
      label: t('social.shareOnTwitter', 'Share on Twitter')
    },
    {
      name: 'LinkedIn',
      icon: Linkedin,
      color: 'bg-[#0A66C2] hover:bg-[#0952A0]',
      url: `https://www.linkedin.com/shareArticle?mini=true&url=${encodedUrl}&title=${encodedTitle}&summary=${encodedDescription}`,
      label: t('social.shareOnLinkedIn', 'Share on LinkedIn')
    },
    {
      name: 'Email',
      icon: Mail,
      color: 'bg-gray-600 hover:bg-gray-700',
      url: `mailto:?subject=${encodedTitle}&body=${encodedDescription}%0A%0A${encodedUrl}`,
      label: t('social.shareViaEmail', 'Share via Email')
    }
  ];

  const copyToClipboard = async () => {
    try {
      await navigator.clipboard.writeText(fullUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error('Failed to copy URL: ', err);
    }
  };

  if (compact) {
    return (
      <div className={`relative ${className}`}>
        <button
          onClick={() => setIsOpen(!isOpen)}
          className="p-2 bg-gray-100 hover:bg-gray-200 rounded-full text-gray-600 transition-colors"
          aria-label={t('social.share', 'Share')}
          title={t('social.share', 'Share')}
        >
          <Share2 size={16} />
        </button>
        
        {isOpen && (
          <div className="absolute bottom-full mb-2 right-0 bg-white shadow-lg rounded-lg p-2 z-10 flex flex-col gap-1 min-w-[180px]">
            {shareLinks.map((platform) => (
              <a
                key={platform.name}
                href={platform.url}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-2 p-2 hover:bg-gray-100 rounded transition-colors text-sm"
                onClick={(e) => {
                  e.stopPropagation();
                  window.open(platform.url, '_blank', 'width=600,height=400');
                  setIsOpen(false);
                }}
              >
                <platform.icon size={16} className="text-gray-700" />
                <span>{platform.label}</span>
              </a>
            ))}
            <button
              onClick={(e) => {
                e.stopPropagation();
                copyToClipboard();
              }}
              className="flex items-center gap-2 p-2 hover:bg-gray-100 rounded transition-colors text-sm"
            >
              {copied ? (
                <>
                  <Check size={16} className="text-green-600" />
                  <span className="text-green-600">{t('social.copied', 'Copied!')}</span>
                </>
              ) : (
                <>
                  <Copy size={16} className="text-gray-700" />
                  <span>{t('social.copyLink', 'Copy link')}</span>
                </>
              )}
            </button>
          </div>
        )}
      </div>
    );
  }

  return (
    <div className={`flex flex-wrap gap-2 ${className}`}>
      {showLabel && (
        <span className="text-sm font-medium text-gray-600 flex items-center mr-1">
          {t('social.shareThis', 'Share this:')}
        </span>
      )}
      
      {shareLinks.map((platform) => (
        <a
          key={platform.name}
          href={platform.url}
          target="_blank"
          rel="noopener noreferrer"
          className={`flex items-center justify-center p-2 rounded-full text-white transition-colors ${platform.color}`}
          aria-label={platform.label}
          title={platform.label}
          onClick={(e) => {
            e.preventDefault();
            window.open(platform.url, '_blank', 'width=600,height=400');
          }}
        >
          <platform.icon size={16} />
        </a>
      ))}
      
      <button
        onClick={copyToClipboard}
        className={`flex items-center justify-center p-2 rounded-full text-white transition-colors ${
          copied ? 'bg-green-500 hover:bg-green-600' : 'bg-gray-500 hover:bg-gray-600'
        }`}
        aria-label={copied ? t('social.copied', 'Copied!') : t('social.copyLink', 'Copy link')}
        title={copied ? t('social.copied', 'Copied!') : t('social.copyLink', 'Copy link')}
      >
        {copied ? <Check size={16} /> : <Copy size={16} />}
      </button>
    </div>
  );
} 