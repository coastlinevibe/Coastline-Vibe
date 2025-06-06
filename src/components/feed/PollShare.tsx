'use client';

import React, { useState } from 'react';
import { Share2, Check, Copy, Twitter, Facebook, Linkedin, Mail, X } from 'lucide-react';

interface PollShareProps {
  pollId: string;
  postId: string;
  communityId: string;
  question: string;
}

const PollShare: React.FC<PollShareProps> = ({ pollId, postId, communityId, question }) => {
  const [showShareOptions, setShowShareOptions] = useState(false);
  const [copied, setCopied] = useState(false);

  // Create the share URL for the poll
  const pollUrl = typeof window !== 'undefined' 
    ? `${window.location.origin}/community/${communityId}/feed?postId=${postId}`
    : '';

  const handleCopyLink = () => {
    navigator.clipboard.writeText(pollUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleShare = (platform: string) => {
    let shareUrl = '';
    const encodedQuestion = encodeURIComponent(`Poll: ${question}`);
    const encodedUrl = encodeURIComponent(pollUrl);

    switch (platform) {
      case 'twitter':
        shareUrl = `https://twitter.com/intent/tweet?text=${encodedQuestion}&url=${encodedUrl}`;
        break;
      case 'facebook':
        shareUrl = `https://www.facebook.com/sharer/sharer.php?u=${encodedUrl}`;
        break;
      case 'linkedin':
        shareUrl = `https://www.linkedin.com/sharing/share-offsite/?url=${encodedUrl}`;
        break;
      case 'email':
        shareUrl = `mailto:?subject=${encodedQuestion}&body=${encodedUrl}`;
        break;
      default:
        return;
    }

    window.open(shareUrl, '_blank');
  };

  return (
    <div className="relative">
      <button
        onClick={() => setShowShareOptions(!showShareOptions)}
        className="flex items-center text-sm text-blue-600 hover:text-blue-800"
      >
        <Share2 size={16} className="mr-1" />
        <span>Share Poll</span>
      </button>

      {showShareOptions && (
        <div className="absolute z-10 mt-2 bg-white border border-gray-200 rounded-md shadow-lg p-3 w-64">
          <div className="flex justify-between items-center mb-3">
            <h4 className="font-medium text-sm">Share this poll</h4>
            <button onClick={() => setShowShareOptions(false)} className="text-gray-500 hover:text-gray-700">
              <X size={16} />
            </button>
          </div>

          <div className="mb-3">
            <div className="relative">
              <input
                type="text"
                value={pollUrl}
                readOnly
                className="w-full pr-10 pl-3 py-2 text-sm border border-gray-300 rounded-md bg-gray-50"
              />
              <button
                onClick={handleCopyLink}
                className="absolute right-2 top-1/2 transform -translate-y-1/2 text-gray-500 hover:text-gray-700"
                title="Copy link"
              >
                {copied ? <Check size={16} className="text-green-500" /> : <Copy size={16} />}
              </button>
            </div>
          </div>

          <div className="flex justify-around">
            <button
              onClick={() => handleShare('twitter')}
              className="p-2 rounded-full hover:bg-blue-50"
              title="Share on Twitter"
            >
              <Twitter size={20} className="text-[#1DA1F2]" />
            </button>
            <button
              onClick={() => handleShare('facebook')}
              className="p-2 rounded-full hover:bg-blue-50"
              title="Share on Facebook"
            >
              <Facebook size={20} className="text-[#4267B2]" />
            </button>
            <button
              onClick={() => handleShare('linkedin')}
              className="p-2 rounded-full hover:bg-blue-50"
              title="Share on LinkedIn"
            >
              <Linkedin size={20} className="text-[#0077B5]" />
            </button>
            <button
              onClick={() => handleShare('email')}
              className="p-2 rounded-full hover:bg-blue-50"
              title="Share via Email"
            >
              <Mail size={20} className="text-gray-600" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default PollShare; 