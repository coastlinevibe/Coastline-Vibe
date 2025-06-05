"use client";

import { useParams } from "next/navigation";

interface BusinessCardProps {
  business: {
    id: string;
    name: string;
    image_url?: string;
    is_featured?: boolean;
    category?: string;
    category_name?: string;
    subcategory_name?: string;
    rating?: number;
    description?: string;
  };
}

export function BusinessCard({ business }: BusinessCardProps) {
  // Get communityId from URL params
  const params = useParams();
  const communityId = params.communityId as string;

  return (
    <div className="bg-gradient-to-br from-sky-50 to-cyan-50 rounded-2xl shadow-lg p-5 flex flex-col border border-cyan-100">
      <div className="relative mb-3">
        <img
          src={business.image_url || '/placeholder-business.jpg'}
          alt={business.name}
          className="w-full h-36 object-cover rounded-xl border-2 border-sky-100 shadow-sm bg-white"
        />
        {business.is_featured && (
          <span className="absolute top-2 left-2 px-3 py-1 rounded-full text-xs font-semibold text-white shadow-md bg-teal-500">Featured</span>
        )}
      </div>
      <h3 className="font-semibold text-lg mb-1 text-cyan-900">{business.name || 'Unnamed Business'}</h3>
      <div className="text-cyan-700 text-sm mb-1">
        {business.category_name || business.category}
        {business.subcategory_name && (
          <span className="ml-2 text-cyan-500">/ {business.subcategory_name}</span>
        )}
      </div>
      <div className="flex items-center gap-1 mb-2">
        {Array.from({ length: 5 }).map((_, i) => (
          <svg key={i} className={`w-4 h-4 ${i < (business.rating || 0) ? 'text-yellow-400' : 'text-slate-300'}`} fill="currentColor" viewBox="0 0 20 20"><path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.286 3.967a1 1 0 00.95.69h4.178c.969 0 1.371 1.24.588 1.81l-3.385 2.46a1 1 0 00-.364 1.118l1.287 3.966c.3.922-.755 1.688-1.54 1.118l-3.385-2.46a1 1 0 00-1.175 0l-3.385 2.46c-.784.57-1.838-.196-1.54-1.118l1.287-3.966a1 1 0 00-.364-1.118l-3.385-2.46c-.783-.57-.38-1.81.588-1.81h4.178a1 1 0 00.95-.69l1.286-3.967z" /></svg>
        ))}
        <span className="ml-1 text-xs text-slate-500">{business.rating?.toFixed(1) || '0.0'}</span>
      </div>
      <div className="text-cyan-600 text-xs mb-2 line-clamp-3 whitespace-pre-line">
        {business.description && business.description.length > 0 ? (
          <>{business.description.length > 120 ? business.description.slice(0, 120) + '...' : business.description}</>
        ) : null}
      </div>
      <div className="flex gap-2 mt-4">
        <a href={`/community/${communityId}/business/${business.id}`} className="px-3.5 py-1.5 rounded bg-teal-100 text-teal-700 text-xs font-medium hover:bg-teal-200 transition text-sm text-center w-full">View</a>
      </div>
    </div>
  );
} 