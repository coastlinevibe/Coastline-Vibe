"use client";
import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { createBrowserClient } from '@supabase/ssr';

type Item = {
  id: string;
  title: string;
  price: number;
  category: string;
  condition: string;
  location: string;
  image: string;
  tags: string[];
  description?: string;
};

const categories = ['All', 'Electronics', 'Sports', 'Furniture', 'Fashion'];
const conditions = ['All', 'New', 'Like New', 'Good', 'Used'];
const locations = ['All', 'Miami', 'Miami Beach', 'Coral Gables', 'Downtown'];
const sortOptions = ['Newest', 'Price: Low to High', 'Price: High to Low'];

const supabase = createBrowserClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

export default function MarketListPage() {
  const [items, setItems] = useState<Item[]>([]);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  // Filter state (placeholders)
  const [search, setSearch] = useState('');
  const [category, setCategory] = useState('All');
  const [condition, setCondition] = useState('All');
  const [location, setLocation] = useState('All');
  const [minPrice, setMinPrice] = useState('');
  const [maxPrice, setMaxPrice] = useState('');
  const [sortBy, setSortBy] = useState('Newest');
  const [tags, setTags] = useState('');
  const [onlyWithImages, setOnlyWithImages] = useState(false);

  // Load items from Supabase on mount
  useEffect(() => {
    const fetchItems = async () => {
      const { data, error } = await supabase.from('market_items').select('*').eq('approval_status', 'approved');
      if (error) {
        console.error('Error fetching market items:', error);
        setItems([]);
        return;
      }
      setItems(
        (data || []).map(item => ({
          id: item.id,
          title: item.title,
          price: item.price,
          category: item.category,
          condition: item.condition,
          location: item.location,
          image: item.imagefiles && item.imagefiles.length > 0 ? item.imagefiles[0] : '',
          tags: Array.isArray(item.tags) ? item.tags : [],
          description: item.description,
        }))
      );
    };
    fetchItems();
  }, []);

  // Filtering logic
  const filteredItems = items.filter(item => {
    if (search && !item.title.toLowerCase().includes(search.toLowerCase())) return false;
    if (category !== 'All' && item.category !== category) return false;
    if (condition !== 'All' && item.condition !== condition) return false;
    if (location !== 'All' && item.location !== location) return false;
    if (minPrice && item.price < parseInt(minPrice)) return false;
    if (maxPrice && item.price > parseInt(maxPrice)) return false;
    if (tags) {
      const searchTags = tags.toLowerCase().split(',').map(t => t.trim());
      if (!searchTags.every(tag => item.tags.some(itemTag => itemTag.toLowerCase().includes(tag)))) return false;
    }
    if (onlyWithImages && !item.image) return false;
    return true;
  }).sort((a, b) => {
    switch (sortBy) {
      case 'Price: Low to High':
        return a.price - b.price;
      case 'Price: High to Low':
        return b.price - a.price;
      case 'Newest':
      default:
        return parseInt(b.id) - parseInt(a.id);
    }
  });

  const hasActiveFilters = () => {
    return (
      search ||
      category !== 'All' ||
      condition !== 'All' ||
      location !== 'All' ||
      minPrice ||
      maxPrice ||
      sortBy !== 'Newest' ||
      tags ||
      onlyWithImages
    );
  };

  const clearFilters = () => {
    setSearch('');
    setCategory('All');
    setCondition('All');
    setLocation('All');
    setMinPrice('');
    setMaxPrice('');
    setSortBy('Newest');
    setTags('');
    setOnlyWithImages(false);
  };

  const handleDelete = async (id: string) => {
    // Delete from Supabase
    const { error } = await supabase.from('market_items').delete().eq('id', id);
    if (error) {
      alert('Failed to delete item: ' + error.message);
      return;
    }
    // Refresh list
    const { data, error: fetchError } = await supabase.from('market_items').select('*').eq('approval_status', 'approved');
    if (fetchError) {
      setItems([]);
      return;
    }
    setItems(
      (data || []).map(item => ({
        id: item.id,
        title: item.title,
        price: item.price,
        category: item.category,
        condition: item.condition,
        location: item.location,
        image: item.imagefiles && item.imagefiles.length > 0 ? item.imagefiles[0] : '',
        tags: Array.isArray(item.tags) ? item.tags : [],
        description: item.description,
      }))
    );
    setDeleteId(null);
  };

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-7xl mx-auto px-4 flex gap-8">
        {/* Filter Sidebar */}
        <aside className="w-64 bg-white rounded-lg shadow p-6 hidden md:block">
          <h2 className="font-bold text-lg mb-4">Filters</h2>
          <form className="space-y-4 text-sm">
            <div>
              <label className="block font-medium mb-1">Search</label>
              <input className="w-full border rounded px-2 py-1" placeholder="Search items" value={search} onChange={e => setSearch(e.target.value)} />
            </div>
            <div>
              <label className="block font-medium mb-1">Category</label>
              <select className="w-full border rounded px-2 py-1" value={category} onChange={e => setCategory(e.target.value)}>
                {categories.map(c => <option key={c}>{c}</option>)}
              </select>
            </div>
            <div>
              <label className="block font-medium mb-1">Condition</label>
              <select className="w-full border rounded px-2 py-1" value={condition} onChange={e => setCondition(e.target.value)}>
                {conditions.map(c => <option key={c}>{c}</option>)}
              </select>
            </div>
            <div>
              <label className="block font-medium mb-1">Location</label>
              <select className="w-full border rounded px-2 py-1" value={location} onChange={e => setLocation(e.target.value)}>
                {locations.map(l => <option key={l}>{l}</option>)}
              </select>
            </div>
            <div>
              <label className="block font-medium mb-1">Price Range</label>
              <div className="flex gap-2">
                <input className="w-1/2 border rounded px-2 py-1" placeholder="Min" value={minPrice} onChange={e => setMinPrice(e.target.value)} />
                <input className="w-1/2 border rounded px-2 py-1" placeholder="Max" value={maxPrice} onChange={e => setMaxPrice(e.target.value)} />
              </div>
            </div>
            <div>
              <label className="block font-medium mb-1">Sort By</label>
              <select className="w-full border rounded px-2 py-1" value={sortBy} onChange={e => setSortBy(e.target.value)}>
                {sortOptions.map(opt => <option key={opt}>{opt}</option>)}
              </select>
            </div>
            <div>
              <label className="block font-medium mb-1">Tags <span className="text-xs text-gray-500">(comma separated)</span></label>
              <input className="w-full border rounded px-2 py-1" placeholder="e.g. bike, phone" value={tags} onChange={e => setTags(e.target.value)} />
            </div>
            <div className="flex items-center gap-2">
              <input type="checkbox" checked={onlyWithImages} onChange={e => setOnlyWithImages(e.target.checked)} id="with-images" />
              <label htmlFor="with-images">Only show items with images</label>
            </div>
            {hasActiveFilters() && (
              <button type="button" className="w-full py-2 bg-teal-500 text-white rounded hover:bg-teal-600 transition" onClick={clearFilters}>
                Clear Filters
              </button>
            )}
          </form>
        </aside>
        {/* Main Content */}
        <main className="flex-1">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h1 className="text-2xl font-bold">Coastline Market</h1>
            </div>
            <Link href="/market/create" className="px-4 py-2 rounded bg-teal-500 text-white font-semibold hover:bg-teal-600 transition">
              + Create Item
            </Link>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
            {filteredItems.map((item) => (
              <div
                key={item.id}
                className="bg-gradient-to-br from-sky-50 to-cyan-50 rounded-2xl shadow-lg p-5 flex flex-col relative border border-cyan-100 w-full"
              >
                <div className="relative group">
                  <img
                    src={item.image}
                    alt={item.title}
                    className="w-full h-40 object-cover rounded-xl mb-3 border-2 border-sky-100 shadow-sm"
                  />
                </div>
                <h3 className="font-semibold text-lg mb-1 text-cyan-900">{item.title}</h3>
                <div className="font-bold text-xl mb-2 text-sky-700">${item.price.toLocaleString()}</div>
                <div className="text-xs text-cyan-700 mb-1">{item.category} &bull; {item.condition}</div>
                <div className="text-cyan-700 text-sm mb-2">{item.location}</div>
                <div className="text-cyan-600 text-xs mb-2 line-clamp-3 whitespace-pre-line">
                  {item.description && item.description.length > 0 ? (
                    <>
                      {item.description}
                      {item.description.length > 120 && (
                        <Link href={`/market/${item.id}`} className="text-blue-600 hover:underline ml-1">Read more...</Link>
                      )}
                    </>
                  ) : null}
                </div>
                {item.tags && item.tags.length > 0 && (
                  <div className="flex flex-wrap gap-2 mb-2">
                    {item.tags.map((tag) => (
                      <span key={tag} className="bg-cyan-100 text-cyan-800 px-2 py-1 rounded text-xs font-medium">{tag}</span>
                    ))}
                  </div>
                )}
                <div className="flex gap-2 mt-auto">
                  <Link href={`/market/${item.id}/edit`} className="px-3.5 py-1.5 rounded bg-sky-100 text-sky-700 text-xs font-medium hover:bg-sky-200 transition text-sm">
                    Edit
                  </Link>
                  <button
                    className="px-3.5 py-1.5 rounded bg-red-100 text-red-700 text-xs font-medium hover:bg-red-200 transition text-sm"
                    onClick={() => setDeleteId(item.id)}
                  >
                    Delete
                  </button>
                  <Link href={`/market/${item.id}`} className="px-3.5 py-1.5 rounded bg-teal-100 text-teal-700 text-xs font-medium hover:bg-teal-200 transition text-sm">
                    View
                  </Link>
                </div>
              </div>
            ))}
          </div>
          {/* Delete Confirmation Modal */}
          {deleteId && (
            <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-30">
              <div className="bg-white rounded-xl shadow-lg p-6 w-full max-w-xs flex flex-col items-center border border-cyan-200">
                <div className="mb-3">
                  <svg className="w-10 h-10 text-red-400 mx-auto" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01M21 12c0 4.97-4.03 9-9 9s-9-4.03-9-9 4.03-9 9-9 9 4.03 9 9z" />
                  </svg>
                </div>
                <div className="text-lg font-bold text-cyan-900 mb-2">ARE YOU SURE?</div>
                <div className="text-sm text-cyan-800 mb-1 text-center">You are about to delete <span className="font-semibold">{items.find(i => i.id === deleteId)?.title}</span>.</div>
                <div className="text-xs text-red-500 mb-4 text-center">This action cannot be undone.</div>
                <div className="flex gap-4">
                  <button
                    className="px-4 py-2 rounded bg-gray-100 text-cyan-900 font-semibold hover:bg-gray-200 transition"
                    onClick={() => setDeleteId(null)}
                  >
                    Cancel
                  </button>
                  <button
                    className="px-4 py-2 rounded bg-red-500 text-white font-semibold hover:bg-red-600 transition"
                    onClick={() => handleDelete(deleteId)}
                  >
                    Delete
                  </button>
                </div>
              </div>
            </div>
          )}
        </main>
      </div>
    </div>
  );
} 