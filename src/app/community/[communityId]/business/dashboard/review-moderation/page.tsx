"use client";

import { useParams } from 'next/navigation';
import Link from 'next/link';
import { ChevronRight, Shield } from 'lucide-react';
import ReviewModerationPanel from '@/components/moderation/ReviewModerationPanel';

export default function ReviewModerationPage() {
  const params = useParams();
  const communityId = params?.communityId as string;

  return (
    <div className="container mx-auto px-4 py-8 max-w-7xl">
      {/* Breadcrumb */}
      <div className="flex items-center text-sm text-gray-500 mb-6">
        <Link href={`/community/${communityId}`} className="hover:text-teal-600">
          Home
        </Link>
        <ChevronRight className="h-4 w-4 mx-2" />
        <Link href={`/community/${communityId}/business/dashboard`} className="hover:text-teal-600">
          Business Dashboard
        </Link>
        <ChevronRight className="h-4 w-4 mx-2" />
        <span className="text-gray-700">Review Moderation</span>
      </div>
      
      <div className="mb-8">
        <div className="flex items-center">
          <Shield className="h-6 w-6 text-teal-600 mr-2" />
          <h1 className="text-2xl font-bold text-gray-900">Review Moderation</h1>
        </div>
        <p className="mt-2 text-gray-600">
          Review and manage reported content to maintain community standards.
          Reported reviews require moderation before they are approved or rejected.
        </p>
      </div>
      
      <ReviewModerationPanel communityId={communityId} />
    </div>
  )
} 