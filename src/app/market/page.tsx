"use client";
import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { createBrowserClient } from '@supabase/ssr';
import FilterSidebar from '@/components/shared/FilterSidebar';
import { marketFilters } from '@/constants/filters';
import SearchFilter from '@/components/shared/filter-panels/SearchFilter';
import CategoryFilter from '@/components/shared/filter-panels/CategoryFilter';
import PriceFilter from '@/components/shared/filter-panels/PriceFilter';
import ConditionFilter from '@/components/shared/filter-panels/ConditionFilter';
import LocationFilter from '@/components/shared/filter-panels/LocationFilter';

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

const supabase = createBrowserClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

export default function MarketListPage() {
  const [items, setItems] = useState<Item[]>([]);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  
  // Filter sidebar state
  const [selectedFilters, setSelectedFilters] = useState<Record<string, any>>({});
  const [openKey, setOpenKey] = useState<string | null>(null);
  const [collapsed, setCollapsed] = useState<boolean>(false);

  // Initialize collapsed state based on screen width
  useEffect(() => {
    setCollapsed(window.innerWidth < 768);
    
    const handleResize = () => {
      setCollapsed(window.innerWidth < 768);
    };
    
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);
  
  const handleFilterChange = (key: string, value: any) => {
    setSelectedFilters(prev => ({ ...prev, [key]: value }));
    setOpenKey(null); // close panel
  };
  
  const clearAllFilters = () => {
    setSelectedFilters({});
  };

  // Load items from Supabase on mount
  useEffect(() => {
    fetchItems();
  }, [selectedFilters]);

  const fetchItems = async () => {
    try {
      let query = supabase.from('market_items').select('*').eq('approval_status', 'approved');
      
      // Apply search filter
      if (selectedFilters.search?.term) {
        query = query.ilike('title', `%${selectedFilters.search.term}%`);
      }
      
      // Apply category filter
      if (selectedFilters.category && selectedFilters.category !== 'All') {
        query = query.eq('category', selectedFilters.category);
      }
      
      // Apply price range filter
      if (selectedFilters.price?.min) {
        query = query.gte('price', selectedFilters.price.min);
      }
      if (selectedFilters.price?.max) {
        query = query.lte('price', selectedFilters.price.max);
      }
      
      // Apply condition filter
      if (selectedFilters.condition && selectedFilters.condition !== 'All') {
        query = query.eq('condition', selectedFilters.condition);
      }
      
      // Apply location filter
      if (selectedFilters.location?.city) {
        query = query.ilike('location', `%${selectedFilters.location.city}%`);
      }
      
      // Apply tag filters
      if (selectedFilters.search?.tags && selectedFilters.search.tags.length > 0) {
        // Use overlaps for array comparison if your DB supports it
        // This assumes tags are stored as an array in Supabase
        query = query.overlaps('tags', selectedFilters.search.tags);
      }
      
      // Sorting - default to newest
      query = query.order('created_at', { ascending: false });
      
      const { data, error } = await query;
      
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
    } catch (err) {
      console.error('Error in fetchItems:', err);
      setItems([]);
    }
  };

  const handleDelete = async (id: string) => {
    // Delete from Supabase
    const { error } = await supabase.from('market_items').delete().eq('id', id);
    if (error) {
      alert('Failed to delete item: ' + error.message);
      return;
    }
    
    // Refresh items
    fetchItems();
    setDeleteId(null);
  };

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-7xl mx-auto px-4 flex gap-6">
        {/* Filter Sidebar */}
        <div className={`${collapsed ? 'w-16' : 'w-64'} transition-all duration-300 flex-shrink-0`}>
          <FilterSidebar
            filters={marketFilters}
            selectedFilters={selectedFilters}
            openKey={openKey}
            collapsed={collapsed}
            onToggleCollapse={() => setCollapsed(!collapsed)}
            onOpenKeyChange={setOpenKey}
            onFilterChange={handleFilterChange}
            onClearAll={clearAllFilters}
          >
            <SearchFilter 
              filterKey="search" 
              value={selectedFilters.search} 
              onChange={(value) => handleFilterChange('search', value)}
            />
            <CategoryFilter 
              filterKey="category" 
              value={selectedFilters.category} 
              onChange={(value) => handleFilterChange('category', value)}
            />
            <PriceFilter 
              filterKey="price" 
              value={selectedFilters.price} 
              onChange={(value) => handleFilterChange('price', value)}
            />
            <ConditionFilter 
              filterKey="condition" 
              value={selectedFilters.condition} 
              onChange={(value) => handleFilterChange('condition', value)}
            />
            <LocationFilter 
              filterKey="location" 
              value={selectedFilters.location} 
              onChange={(value) => handleFilterChange('location', value)}
            />
          </FilterSidebar>
        </div>

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
          
          {/* Active Filters Summary */}
          {Object.keys(selectedFilters).length > 0 && (
            <div className="flex flex-wrap gap-2 mb-4">
              {selectedFilters.search?.term && (
                <div className="bg-cyan-50 text-cyan-800 px-3 py-1 rounded-full text-xs font-medium">
                  Search: {selectedFilters.search.term}
                </div>
              )}
              {selectedFilters.search?.tags && selectedFilters.search.tags.length > 0 && (
                <div className="bg-cyan-50 text-cyan-800 px-3 py-1 rounded-full text-xs font-medium">
                  Tags: {selectedFilters.search.tags.join(', ')}
                </div>
              )}
              {selectedFilters.category && selectedFilters.category !== 'All' && (
                <div className="bg-cyan-50 text-cyan-800 px-3 py-1 rounded-full text-xs font-medium">
                  Category: {selectedFilters.category}
                </div>
              )}
              {selectedFilters.price && (
                <div className="bg-cyan-50 text-cyan-800 px-3 py-1 rounded-full text-xs font-medium">
                  Price: 
                  {selectedFilters.price.min ? ` $${selectedFilters.price.min}` : ' $0'} 
                  {' - '}
                  {selectedFilters.price.max ? `$${selectedFilters.price.max}` : 'Any'}
                </div>
              )}
              {selectedFilters.condition && selectedFilters.condition !== 'All' && (
                <div className="bg-cyan-50 text-cyan-800 px-3 py-1 rounded-full text-xs font-medium">
                  Condition: {selectedFilters.condition}
                </div>
              )}
              {selectedFilters.location && (
                <div className="bg-cyan-50 text-cyan-800 px-3 py-1 rounded-full text-xs font-medium">
                  Location: {selectedFilters.location.city}
                </div>
              )}
            </div>
          )}
          
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {items.map((item) => (
              <div
                key={item.id}
                className="bg-gradient-to-br from-sky-50 to-cyan-50 rounded-2xl shadow-lg p-5 flex flex-col relative border border-cyan-100 w-full"
              >
                <div className="relative group">
                  <img
                    src={item.image || 'https://via.placeholder.com/400x200?text=No+Image'}
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
          
          {/* Empty State */}
          {items.length === 0 && (
            <div className="text-center py-12">
              <p className="text-gray-500 mb-4">No items found</p>
              <Link href="/market/create" className="text-teal-500 hover:text-teal-600">
                Create your first item listing
              </Link>
            </div>
          )}
          
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