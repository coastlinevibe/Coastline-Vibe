/**
 * DEPRECATED: This is an older version of the filter panel.
 * The community business directory has integrated filtering directly in:
 * src/app/community/[communityId]/business/directory/page.tsx
 * 
 * This file is kept for reference only and should not be used for new development.
 */

"use client";

import { useState, useEffect } from "react";

export interface Filters {
  search: string;
  category: string;
  subcategory: string;
  community: string;
  minRating: number;
  radius: number;        // in km
  coords: { lat: number; lng: number } | null;
}

interface FilterPanelProps {
  categories: { id: string; name: string }[];
  communities: { id: string; name: string }[];
  subcategories: { id: string; name: string; category_id: string }[];
  onChange: (filters: Filters) => void;
}

export function FilterPanel({
  categories,
  communities,
  subcategories,
  onChange,
}: FilterPanelProps) {
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState("");
  const [subcategory, setSubcategory] = useState("");
  const [community, setCommunity] = useState("");
  const [minRating, setMinRating] = useState(0);
  const [radius, setRadius] = useState(5);
  const [coords, setCoords] = useState<{ lat: number; lng: number } | null>(null);

  // get user location once
  useEffect(() => {
    if (!coords && navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(pos =>
        setCoords({ lat: pos.coords.latitude, lng: pos.coords.longitude })
      );
    }
  }, [coords]);

  // reset subcategory when category changes
  useEffect(() => {
    setSubcategory("");
  }, [category]);

  // bubble up every time filters change
  useEffect(() => {
    onChange({ search, category, subcategory, community, minRating, radius, coords });
  }, [search, category, subcategory, community, minRating, radius, coords]);

  // only show subcats of the selected category
  const availableSubs = subcategories.filter(sc => sc.category_id === category);

  return (
    <div className="bg-white p-4 rounded-lg shadow space-y-4">
      <input
        type="text"
        placeholder="Search businesses..."
        value={search}
        onChange={e => setSearch(e.target.value)}
        className="w-full border rounded px-3 py-2"
      />

      <div>
        <label className="block text-sm font-medium">Category</label>
        <select
          value={category}
          onChange={e => setCategory(e.target.value)}
          className="w-full border rounded px-3 py-2"
        >
          <option value="">All categories</option>
          {categories.map(c => (
            <option key={c.id} value={c.id}>{c.name}</option>
          ))}
        </select>
      </div>

      <div>
        <label className="block text-sm font-medium">Subcategory</label>
        <select
          value={subcategory}
          onChange={e => setSubcategory(e.target.value)}
          disabled={!category}
          className="w-full border rounded px-3 py-2"
        >
          <option value="">All subcategories</option>
          {availableSubs.map(sc => (
            <option key={sc.id} value={sc.id}>{sc.name}</option>
          ))}
        </select>
      </div>

      <div>
        <label className="block text-sm font-medium">Community</label>
        <select
          value={community}
          onChange={e => setCommunity(e.target.value)}
          className="w-full border rounded px-3 py-2"
        >
          <option value="">All communities</option>
          {communities.map(c => (
            <option key={c.id} value={c.id}>{c.name}</option>
          ))}
        </select>
      </div>

      <div>
        <label className="block text-sm font-medium">
          Minimum Rating: {minRating}★
        </label>
        <input
          type="range"
          min={0}
          max={5}
          step={0.5}
          value={minRating}
          onChange={e => setMinRating(Number(e.target.value))}
          className="w-full"
        />
      </div>

      <div>
        <label className="block text-sm font-medium">
          Radius: {radius} km
        </label>
        <input
          type="range"
          min={1}
          max={50}
          step={1}
          value={radius}
          onChange={e => setRadius(Number(e.target.value))}
          className="w-full"
        />
      </div>
    </div>
  );
}
