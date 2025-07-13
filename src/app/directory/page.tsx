/**
 * DEPRECATED: This is an older version of the business directory.
 * Please use the community-specific version at:
 * src/app/community/[communityId]/business/directory/page.tsx
 * 
 * This file is kept for reference only and should not be used for new development.
 */

"use client";

import { useState, useEffect } from "react";
import { createBrowserClient } from "@supabase/ssr";
import { FilterPanel, Filters } from "@/components/FilterPanel";
import { BusinessCard } from "@/components/BusinessCard";
import { useRouter } from "next/navigation";

const supabase = createBrowserClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

// Define a minimal type for businesses
interface Business {
  id: string;
  user_id: string;
  name: string;
  [key: string]: unknown;
}

interface Profile {
  id: string;
  is_approved?: boolean;
}

export default function DirectoryPage() {
  const [categories, setCategories] = useState<{ id: string; name: string }[]>([]);
  const [communities, setCommunities] = useState<{ id: string; name: string }[]>([]);
  const [subcategories, setSubcategories] = useState<
    { id: string; name: string; category_id: string }[]
  >([]);
  const [filters, setFilters] = useState<Filters>({
    search: "",
    category: "",
    subcategory: "",
    community: "",
    minRating: 0,
    radius: 5,
    coords: null,
  });
  const [businesses, setBusinesses] = useState<Business[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    // 1) main categories
    supabase.from("categories").select("id, name").then(res => {
      if (!res.error) setCategories(res.data!);
    });
    // 2) communities
    supabase.from("communities").select("id, name").then(res => {
      if (!res.error) setCommunities(res.data!);
    });
    // 3) actual subcategories table
    supabase
      .from("subcategories")
      .select("id, name, category_id")
      .then(res => {
        if (!res.error) setSubcategories(res.data!);
      });
  }, []);

  // refetch businesses on filters change
  useEffect(() => {
    // wait for geolocation if needed
    if (!filters.coords && filters.radius) return;

    setLoading(true);
    let query = supabase
      .from("businesses")
      .select("*, user_id")
      .ilike("name", `%${filters.search}%`);

    if (filters.category) {
      query = query.eq("category", filters.category);
    }
    if (filters.subcategory) {
      query = query.overlaps("subcategory", [filters.subcategory]);
    }
    if (filters.community) {
      query = query.eq("community_id", filters.community);
    }
    if (filters.minRating) {
      query = query.gte("rating", filters.minRating);
    }
    if (filters.coords) {
      const { lat, lng } = filters.coords;
      query = query.filter(
        "location",
        "st_d_within",
        `SRID=4326;POINT(${lng} ${lat}),${filters.radius * 1000}`
      );
    }

    query
      .order("is_featured", { ascending: false })
      .order("rating", { ascending: false })
      .then(async res => {
        setLoading(false);
        if (!res.error && res.data) {
          // Fetch owner profiles for all businesses
          const userIds = res.data.map((b: Business) => b.user_id).filter(Boolean);
          if (userIds.length === 0) {
            setBusinesses([]);
            return;
          }
          const { data: profiles, error: profileError } = await supabase
            .from("profiles")
            .select("id, is_approved")
            .in("id", userIds);
          if (profileError || !profiles) {
            setBusinesses([]);
            return;
          }
          const approvedIds = new Set(profiles.filter((p: Profile) => p.is_approved).map((p: Profile) => p.id));
          const filtered = res.data.filter((b: Business) => approvedIds.has(b.user_id));
          setBusinesses(filtered);
        } else {
          setBusinesses([]);
        }
      });
  }, [filters]);

  return (
    <div className="lg:flex lg:space-x-6 p-4">
      <aside className="w-full lg:w-1/4 mb-6 lg:mb-0">
        <FilterPanel
          categories={categories}
          communities={communities}
          subcategories={subcategories}
          onChange={setFilters}
        />
      </aside>

      <main className="flex-1">
        {loading && <p className="text-center">Loading...</p>}
        {!loading && businesses.length === 0 && (
          <p className="text-center">No businesses found.</p>
        )}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {businesses.map(b => (
            <BusinessCard key={b.id} business={b} />
          ))}
        </div>
      </main>
    </div>
  );
}
