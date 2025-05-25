"use client";
import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import { createBrowserClient } from '@supabase/ssr';

const supabase = createBrowserClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

export default function MarketItemDetailPage() {
  const params = useParams();
  const { id } = params;
  const [item, setItem] = useState<any>(null);
  const [sellerProfile, setSellerProfile] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [fetchError, setFetchError] = useState<string | null>(null);
  useEffect(() => {
    const fetchItem = async () => {
      setLoading(true);
      setFetchError(null);
      const { data, error } = await supabase
        .from('market_items')
        .select('*')
        .eq('id', id)
        .single();
      if (error || !data) {
        setFetchError('Item not found.');
        setLoading(false);
        return;
      }
      setItem(data);
      // Fetch seller profile if user_id exists
      if (data.user_id) {
        const { data: seller, error: sellerError } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', data.user_id)
          .single();
        if (seller && !sellerError) setSellerProfile(seller);
      }
      setLoading(false);
    };
    fetchItem();
  }, [id]);
  const [mainIdx, setMainIdx] = useState(0);
  const thumbsPerPage = 4;
  const [thumbPage, setThumbPage] = useState(0);
  if (loading) return <div className="text-center py-12 text-cyan-700">Loading...</div>;
  if (fetchError || !item) return <div className="text-center py-12 text-red-500">{fetchError || 'Item not found.'}</div>;
  const gallery = [
    ...(item.videourl ? [{ type: 'video', url: item.videourl }] : []),
    ...(item.imagefiles ? item.imagefiles.map((url: string) => ({ type: 'image', url })) : []),
  ];
  const main = gallery[mainIdx];
  const totalPages = Math.max(1, gallery.length - thumbsPerPage + 1);
  const startIdx = thumbPage;
  const endIdx = startIdx + thumbsPerPage;
  const visibleThumbs = gallery.slice(startIdx, endIdx);

  return (
    <div className="min-h-screen bg-gradient-to-br from-sky-50 to-cyan-50 py-10">
      <div className="max-w-3xl mx-auto bg-white/80 rounded-2xl shadow-lg p-8 border border-cyan-100">
        <div className="flex flex-col md:flex-row gap-8">
          {/* Gallery */}
          <div className="md:w-2/5 w-full flex flex-col items-center">
            {main && main.type === 'image' && (
              <img src={main.url} alt={item.title} className="w-full h-64 object-cover rounded-xl border-2 border-sky-100 shadow mb-3" />
            )}
            {main && main.type === 'video' && (
              <video src={main.url} controls className="w-full rounded-xl border-2 border-sky-100 shadow mb-3 h-64" />
            )}
            <div className="flex gap-2 mt-2 items-center">
              {thumbPage > 0 && (
                <button
                  onClick={() => setThumbPage(thumbPage - 1)}
                  className="w-8 h-16 flex items-center justify-center bg-cyan-100 rounded hover:bg-cyan-200 transition"
                  type="button"
                >
                  <svg width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7"/></svg>
                </button>
              )}
              {visibleThumbs.map((item, i) => {
                const globalIdx = startIdx + i;
                return (
                  <button
                    key={item.url}
                    onClick={() => { setMainIdx(globalIdx); }}
                    className={`w-16 h-16 object-cover rounded cursor-pointer ${mainIdx === globalIdx ? 'border-2 border-sky-600' : 'border border-gray-300'}`}
                    type="button"
                  >
                    {item.type === 'image' ? (
                      <img src={item.url} alt="thumb" className="w-full h-full object-cover" />
                    ) : (
                      <video src={item.url} className="w-full h-full object-cover" />
                    )}
                  </button>
                );
              })}
              {thumbPage < totalPages - 1 && (
                <button
                  onClick={() => setThumbPage(thumbPage + 1)}
                  className="w-8 h-16 flex items-center justify-center bg-cyan-100 rounded hover:bg-cyan-200 transition"
                  type="button"
                >
                  <svg width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7"/></svg>
                </button>
              )}
            </div>
          </div>
          {/* Main Info */}
          <div className="flex-1 flex flex-col gap-4">
            <h1 className="text-2xl font-bold text-cyan-900 mb-1">{item.title}</h1>
            <div className="text-sky-700 font-bold text-2xl mb-1">${item.price}</div>
            <div className="flex gap-3 text-cyan-700 text-sm mb-1">
              <span>{item.category}</span>
              <span>&bull;</span>
              <span>{item.condition}</span>
              <span>&bull;</span>
              <span>{item.location}</span>
            </div>
            <div className="flex flex-wrap gap-2 mb-2">
              {(Array.isArray(item.tags) ? item.tags : []).map((tag: string) => (
                <span key={tag} className="bg-cyan-100 text-cyan-800 px-2 py-1 rounded text-xs font-medium">{tag}</span>
              ))}
            </div>
            <div className="mb-4">
              <div className="font-semibold text-cyan-900 mb-1">Description</div>
              <div className="text-cyan-900 text-base font-medium">{item.description}</div>
            </div>
            {/* Seller Info */}
            <div className="flex items-center gap-4 bg-cyan-50 rounded-lg p-3 border border-cyan-100">
              <img src={sellerProfile?.avatar || 'https://randomuser.me/api/portraits/men/32.jpg'} alt={sellerProfile?.name || 'Seller'} className="w-12 h-12 rounded-full border-2 border-cyan-200" />
              <div>
                <div className="font-semibold text-cyan-900">{sellerProfile?.name || 'Seller'}</div>
                {sellerProfile?.email && <div className="text-xs text-cyan-700">{sellerProfile.email}</div>}
                {sellerProfile?.phone && <div className="text-xs text-cyan-700">{sellerProfile.phone}</div>}
                {sellerProfile?.bio && <div className="text-xs text-cyan-700 italic">{sellerProfile.bio}</div>}
              </div>
              <button className="ml-auto px-3 py-1 rounded bg-teal-500 text-white text-xs font-semibold hover:bg-teal-600 transition">Contact Seller</button>
            </div>
            <div className="flex gap-2 mt-4">
              <Link href={`/market/${item.id}/edit`} className="flex-1 px-4 py-2 rounded bg-cyan-100 text-cyan-700 font-semibold hover:bg-cyan-200 transition text-center">
                Edit Item
              </Link>
              <button className="flex-1 px-4 py-2 rounded bg-sky-100 text-sky-700 font-semibold hover:bg-sky-200 transition">
                Add to Wishlist
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
} 