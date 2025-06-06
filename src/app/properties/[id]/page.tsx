"use client";
import React, { useState, useEffect } from 'react';
import { useRouter, useParams, notFound } from 'next/navigation';
import { createBrowserClient } from '@supabase/ssr';

// SVG ICONS
const icons = {
  bed: (
    <svg className="w-5 h-5 inline-block mr-1" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M3 10V6a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2v4M3 10v8m18-8v8M3 18h18"/></svg>
  ),
  bath: (
    <svg className="w-5 h-5 inline-block mr-1" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M7 10V6a5 5 0 0 1 10 0v4M5 19h14a2 2 0 0 0 2-2v-5a2 2 0 0 0-2-2H5a2 2 0 0 0-2 2v5a2 2 0 0 0 2 2z"/></svg>
  ),
  area: (
    <svg className="w-5 h-5 inline-block mr-1" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><rect width="18" height="18" x="3" y="3" rx="2"/><path d="M3 9h18M9 21V3"/></svg>
  ),
  furnished: (
    <svg className="w-5 h-5 inline-block mr-1" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><rect x="2" y="7" width="20" height="7" rx="2"/><path d="M17 7V5a2 2 0 0 0-2-2H9a2 2 0 0 0-2 2v2"/></svg>
  ),
  parking: (
    <svg className="w-5 h-5 inline-block mr-1" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><rect x="3" y="11" width="18" height="7" rx="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></svg>
  ),
  pet: (
    <svg className="w-5 h-5 inline-block mr-1" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><circle cx="12" cy="12" r="4"/><circle cx="4" cy="12" r="2"/><circle cx="20" cy="12" r="2"/><circle cx="8" cy="6" r="2"/><circle cx="16" cy="6" r="2"/></svg>
  ),
  tour: (
    <svg className="w-5 h-5 inline-block mr-1" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><circle cx="12" cy="12" r="10"/><path d="M12 6v6l4 2"/></svg>
  ),
};

export default function PropertyViewPage({ params }: { params: { id: string } }) {
  const [property, setProperty] = useState<any>(null);
  const [mainImgIdx, setMainImgIdx] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [similar, setSimilar] = useState<any[]>([]);
  const [reviewText, setReviewText] = useState('');
  const [reviewSubmitted, setReviewSubmitted] = useState(false);
  const [thumbPage, setThumbPage] = useState(0);
  const thumbsPerPage = 4;
  const supabase = createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );
  const [activeTab, setActiveTab] = useState('Overview');
  const [sellerProfile, setSellerProfile] = useState<any>(null);

  useEffect(() => {
    const fetchProperty = async () => {
      setLoading(true);
      setError(null);
      const { data, error } = await supabase
        .from('properties')
        .select('*')
        .eq('id', params.id)
        .single();
      if (error || !data) {
        setError('Property not found');
        setLoading(false);
        return;
      }
      setProperty(data);
      setMainImgIdx(0);
      setLoading(false);
      // Fetch seller profile
      if (data.user_id) {
        const { data: seller, error: sellerError } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', data.user_id)
          .single();
        if (seller && !sellerError) setSellerProfile(seller);
      }
    };
    fetchProperty();
    // eslint-disable-next-line
  }, [params.id]);

  useEffect(() => {
    const fetchSimilar = async () => {
      if (!property) return;
      const { data } = await supabase
        .from('properties')
        .select('*')
        .neq('id', params.id)
        .eq('listingType', property.listingType)
        .limit(3);
      setSimilar(data || []);
    };
    fetchSimilar();
    // eslint-disable-next-line
  }, [property]);

  if (loading) return <div className="min-h-screen flex items-center justify-center text-cyan-700">Loading...</div>;
  if (error || !property) return notFound();

  // Placeholder agent info (replace with real data if available)
  const agent = {
    name: property.agentName || 'Property Lister',
    photo: property.agentPhoto || 'https://randomuser.me/api/portraits/men/32.jpg',
    phone: property.agentPhone || '(555) 123-4567',
    email: property.agentEmail || 'agent@coastlinevibe.com',
  };
  // Placeholder reviews (replace with real data if available)
  const reviews = [
    { name: 'Alex M.', rating: 5, comment: 'Absolutely loved living here! The ocean view is unbeatable.' },
    { name: 'Jamie L.', rating: 4, comment: 'Spacious and modern, great for families.' },
    { name: 'Taylor S.', rating: 5, comment: 'The best property I have ever rented. Highly recommend!' },
  ];

  // In PropertyViewPage, after fetching property, build a gallery array:
  const galleryItems = [];
  if (property?.videoUrl) galleryItems.push({ type: 'video', url: property.videoUrl });
  if (property?.imageFiles?.length) galleryItems.push(...property.imageFiles.map((url: string) => ({ type: 'image', url })));

  // Use galleryItems for main display and thumbnails:
  const mainItem = galleryItems[mainImgIdx] || null;
  const totalPages = Math.max(1, galleryItems.length - thumbsPerPage + 1);
  const startIdx = thumbPage;
  const endIdx = startIdx + thumbsPerPage;
  const visibleThumbs = galleryItems.slice(startIdx, endIdx);

  return (
    <div className="min-h-screen bg-gradient-to-br from-sky-50 to-cyan-50 py-10">
      <div className="max-w-5xl mx-auto bg-white/80 rounded-2xl shadow-lg p-8 border border-cyan-100">
        {/* Top: Gallery and Main Info */}
        <div className="flex flex-col md:flex-row gap-8">
          {/* Gallery */}
          <div className="md:w-2/5 w-full flex flex-col items-center">
            {mainItem && mainItem.type === 'image' && (
              <img
                src={mainItem.url}
                alt={property.title}
                className="w-full h-72 object-cover rounded-xl border-2 border-sky-100 shadow mb-3"
              />
            )}
            {mainItem && mainItem.type === 'video' && (
              <video src={mainItem.url} controls className="w-full rounded-xl border-2 border-sky-100 shadow mb-3 h-72" />
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
                    onClick={() => setMainImgIdx(globalIdx)}
                    className={`w-20 h-20 object-cover rounded cursor-pointer ${mainImgIdx === globalIdx ? 'border-2 border-sky-600' : 'border border-gray-300'}`}
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
          {/* Main Info & Agent Card */}
          <div className="flex-1 flex flex-col gap-6">
            <div>
              <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-2 mb-2">
                <div>
                  <h1 className="text-2xl font-bold text-cyan-900 mb-1">{property.title}</h1>
                  <div className="text-cyan-700 text-sm mb-1">{property.city}, {property.location}</div>
                </div>
                <div className="font-bold text-3xl text-sky-700">
                  {property.listingType === 'Sale' ? '$' + property.price.toLocaleString() : '$' + property.price + ' /mo'}
                </div>
              </div>
              {/* Feature Grid */}
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 mb-4">
                <div className="flex items-center text-cyan-800 text-sm">{icons.bed}{property.bedrooms} bed</div>
                <div className="flex items-center text-cyan-800 text-sm">{icons.bath}{property.bathrooms} bath</div>
                <div className="flex items-center text-cyan-800 text-sm">{icons.area}{property.squarefeet || property.squareFeet || '—'} sq ft</div>
                {property.isFurnished && <div className="flex items-center text-cyan-800 text-sm">{icons.furnished}Furnished</div>}
                {property.hasParking && <div className="flex items-center text-cyan-800 text-sm">{icons.parking}Parking</div>}
                {property.isPetFriendly && <div className="flex items-center text-cyan-800 text-sm">{icons.pet}Pet Friendly</div>}
                {property.hasVirtualTour && <div className="flex items-center text-cyan-800 text-sm">{icons.tour}Virtual Tour</div>}
              </div>
              {/* Amenities & Lifestyle Tags */}
              <div className="mb-4">
                <div className="font-semibold text-cyan-900 mb-1">Amenities</div>
                <div className="flex flex-wrap gap-2">
                  {(property.amenities || ['WiFi', 'Pool', 'Gym', 'Balcony']).map((a: string, i: number) => (
                    <span key={i} className="bg-cyan-100 text-cyan-800 px-2 py-1 rounded text-xs font-medium">{a}</span>
                  ))}
                </div>
              </div>
              <div className="mb-4">
                <div className="font-semibold text-cyan-900 mb-1">Lifestyle</div>
                <div className="flex flex-wrap gap-2">
                  {(property.lifestyleTags || ['Family', 'Urban', 'Pet Owners']).map((t: string, i: number) => (
                    <span key={i} className="bg-sky-100 text-sky-800 px-2 py-1 rounded text-xs font-medium">{t}</span>
                  ))}
                </div>
              </div>
            </div>
            {/* Sticky Agent Card & Actions */}
            <div className="md:sticky md:top-24">
              <div className="flex flex-col gap-3 bg-cyan-50 rounded-lg p-4 border border-cyan-100 shadow">
                <div className="flex items-center gap-4">
                  <img src={sellerProfile?.avatar_url || 'https://randomuser.me/api/portraits/men/32.jpg'} alt={sellerProfile?.name || 'Seller'} className="w-14 h-14 rounded-full border-2 border-cyan-200" />
                  <div>
                    <div className="font-semibold text-cyan-900">{sellerProfile?.name || 'Property Lister'}</div>
                    {sellerProfile?.email && <div className="text-xs text-cyan-700">{sellerProfile.email}</div>}
                    {sellerProfile?.phone && <div className="text-xs text-cyan-700">{sellerProfile.phone}</div>}
                    {sellerProfile?.bio && <div className="text-xs text-cyan-700 italic">{sellerProfile.bio}</div>}
                  </div>
                </div>
                <button className="w-full px-4 py-2 rounded bg-teal-500 text-white font-semibold hover:bg-teal-600 transition">Contact Seller</button>
              </div>
            </div>
          </div>
        </div>
        {/* Description Section */}
        <div className="my-8">
          <div className="font-semibold text-cyan-900 mb-1 text-lg">Description</div>
          <div className="text-cyan-900 text-base font-medium">{property.description}</div>
        </div>
        {/* Tabs below description */}
        <div className="mb-8">
          <div className="flex border-b-4 border-sky-600">
            {['Property Features', 'Send to a Friend', 'Map View'].map(tab => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`px-8 py-4 text-lg font-medium border-t border-l border-r first:rounded-tl-lg last:rounded-tr-lg focus:outline-none transition-colors ${activeTab === tab ? 'bg-sky-600 text-white' : 'bg-gray-100 text-slate-800'} ${activeTab !== tab ? 'hover:bg-gray-200' : ''}`}
                style={{ marginRight: '-1px' }}
              >
                {tab}
              </button>
            ))}
          </div>
          {/* Tab Content */}
          {activeTab === 'Property Features' && (
            <div className="p-6 bg-gray-50 rounded-b-lg border border-t-0 border-gray-200">
              <h2 className="text-xl font-bold text-cyan-900 mb-4">Property Features</h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div><span className="font-semibold">Bedrooms:</span> {property.bedrooms}</div>
                <div><span className="font-semibold">Bathrooms:</span> {property.bathrooms}</div>
                <div><span className="font-semibold">Area:</span> {property.squarefeet || property.squareFeet || '—'} sq ft</div>
                <div><span className="font-semibold">Furnished:</span> {property.isFurnished ? 'Yes' : 'No'}</div>
                <div><span className="font-semibold">Parking:</span> {property.hasParking ? 'Yes' : 'No'}</div>
                <div><span className="font-semibold">Pet Friendly:</span> {property.isPetFriendly ? 'Yes' : 'No'}</div>
                <div><span className="font-semibold">Virtual Tour:</span> {property.hasVirtualTour ? 'Yes' : 'No'}</div>
                <div><span className="font-semibold">Amenities:</span> {(property.amenities || ['WiFi', 'Pool', 'Gym', 'Balcony']).join(', ')}</div>
                <div><span className="font-semibold">Lifestyle:</span> {(property.lifestyleTags || ['Family', 'Urban', 'Pet Owners']).join(', ')}</div>
              </div>
            </div>
          )}
          {activeTab === 'Send to a Friend' && (
            <div className="p-6 bg-gray-50 rounded-b-lg border border-t-0 border-gray-200 max-w-md mx-auto">
              <h2 className="text-xl font-bold text-cyan-900 mb-4">Send to a Friend</h2>
              <form className="space-y-4">
                <div>
                  <label className="block font-medium mb-1">Your Name</label>
                  <input className="w-full border rounded px-2 py-1" placeholder="Your name" />
                </div>
                <div>
                  <label className="block font-medium mb-1">Friend's Email</label>
                  <input className="w-full border rounded px-2 py-1" placeholder="friend@email.com" />
                </div>
                <div>
                  <label className="block font-medium mb-1">Message</label>
                  <textarea className="w-full border rounded px-2 py-1" placeholder="Add a message (optional)" />
                </div>
                <button className="w-full px-4 py-2 rounded bg-teal-500 text-white font-semibold hover:bg-teal-600 transition">Send</button>
              </form>
            </div>
          )}
          {activeTab === 'Map View' && (
            <div className="flex flex-col items-center justify-center min-h-[200px] p-6 bg-gray-50 rounded-b-lg border border-t-0 border-gray-200">
              <div className="w-full h-64 bg-gray-200 rounded flex items-center justify-center text-gray-500 font-bold text-xl">Map coming soon</div>
            </div>
          )}
        </div>
        {/* Reviews Section */}
        <div className="mt-10">
          <h2 className="text-lg font-bold text-cyan-900 mb-3">Reviews</h2>
          <div className="space-y-3">
            {reviews.map((r, i) => (
              <div key={i} className="bg-cyan-50 rounded-lg p-3 border border-cyan-100 flex items-center gap-3">
                <div className="flex gap-0.5">
                  {Array.from({ length: 5 }).map((_, idx) => (
                    <span key={idx}>{idx < r.rating ? '⭐' : '☆'}</span>
                  ))}
                </div>
                <div className="text-cyan-900 text-sm font-medium">{r.name}</div>
                <div className="text-cyan-700 text-xs">{r.comment}</div>
              </div>
            ))}
          </div>
        </div>
        {/* Similar Properties Section */}
        {similar.length > 0 && (
          <div className="mt-10">
            <h2 className="text-lg font-bold text-cyan-900 mb-3">Similar Properties</h2>
            <div className="flex gap-4 overflow-x-auto pb-2">
              {similar.map((sp) => (
                <div key={sp.id} className="min-w-[220px] bg-white rounded-xl shadow p-3 border border-cyan-100">
                  <img src={sp.imageFiles?.[0] || '/placeholder-property.jpg'} alt={sp.title} className="w-full h-28 object-cover rounded mb-2" />
                  <div className="font-semibold text-cyan-900 text-sm mb-1">{sp.title}</div>
                  <div className="text-xs text-cyan-700 mb-1">{sp.city}, {sp.location}</div>
                  <div className="font-bold text-sky-700 text-sm mb-1">{sp.listingType === 'Sale' ? '$' + sp.price.toLocaleString() : '$' + sp.price + ' /mo'}</div>
                  <button className="w-full px-2 py-1 rounded bg-teal-100 text-teal-700 text-xs font-medium hover:bg-teal-200 transition">View</button>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
} 