"use client";

import { useState, useEffect } from "react";
import { createBrowserClient } from "@supabase/ssr";
import type { Database } from "@/types/supabase";
import { BusinessCard } from "@/components/BusinessCard";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";

// Add types for query responses
type Category = {
  id: string;
  name: string;
};

type Subcategory = {
  id: string;
  name: string;
  category_id: string;
};

type Business = {
  id: string;
  name: string;
  description: string;
  address: string;
  phone: string;
  email: string;
  website: string;
  logo_url: string;
  cover_image_url: string;
  is_featured: boolean;
  community_id: string;
  category_id: string;
  subcategory_id: string;
  category?: { id: string; name: string };
  subcategory?: { id: string; name: string };
  category_name?: string;
  subcategory_name?: string;
};

export default function BusinessDirectoryPage() {
  const supabase = createBrowserClient<Database>(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!);
  const params = useParams();
  const communityId = (params?.communityId as string) || '';
  const router = useRouter();

  const [businesses, setBusinesses] = useState<Business[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [subcategories, setSubcategories] = useState<Subcategory[]>([]);
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState("");
  const [subDirectory, setSubDirectory] = useState("");
  const [loading, setLoading] = useState(false);
  const [communityUuid, setCommunityUuid] = useState<string | null>(null);
  const [userRole, setUserRole] = useState<string | null>(null);

  // Fetch user role
  useEffect(() => {
    const fetchUserRole = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        const { data: profileData, error: profileError } = await supabase
          .from('profiles')
          .select('role')
          .eq('id', user.id)
          .single();
        
        if (profileError) {
          console.error('Error fetching user role:', profileError);
          setUserRole(null);
        } else {
          setUserRole(profileData?.role || null);
        }
      }
    };
    
    fetchUserRole();
  }, [supabase]);

  // Get community UUID from slug
  useEffect(() => {
    const fetchCommunityUuid = async () => {
      if (!communityId) return; // Ensure slug is available
      const { data: communityData, error: communityError } = await supabase
        .from("communities")
        .select("id")
        .eq("slug", communityId) // Use the slug here
        .single();
      
      if (communityError) {
        console.error("Error fetching community UUID:", communityError);
        setCommunityUuid(null); // Set to null on error
        return;
      }
      
      if (communityData) {
        console.log("Found community UUID:", communityData.id);
        setCommunityUuid(communityData.id);
      } else {
        setCommunityUuid(null); // Set to null if no data
      }
    };
    
    if (communityId) { // Only run if communityId (slug) is present
      fetchCommunityUuid();
    }
  }, [supabase, communityId]);

  // Only show subcategories that match the selected category
  const filteredSubcategories = subcategories.filter(sc => sc.category_id === category);

  // Get categories and subcategories
  useEffect(() => {
    supabase.from("categories").select("id, name").then(res => {
      if (!res.error && res.data) setCategories(res.data);
      else if (res.error) console.error("Error fetching categories:", res.error);
    });
    supabase.from("subcategories").select("id, name, category_id").then(res => {
      if (!res.error && res.data) setSubcategories(res.data);
      else if (res.error) console.error("Error fetching subcategories:", res.error);
    });
  }, [supabase]);

  // Fetch businesses for the community
  useEffect(() => {
    if (!communityUuid) return; // Wait until we have the community UUID
    
    setLoading(true);
    
    // Fetch businesses from the database
    supabase
      .from("businesses")
      .select(`
        *,
        category:category_id(id, name),
        subcategory:subcategory_id(id, name)
      `)
      .eq("community_id", communityUuid)
      .then(res => {
        setLoading(false);
        if (!res.error) {
          console.log("All businesses:", res.data);
          const transformedData = res.data.map(business => ({
            ...business,
            category_name: business.category?.name,
            subcategory_name: business.subcategory?.name
          }));
          setBusinesses(transformedData);
        } else {
          console.error("Error fetching all businesses:", res.error);
        }
      });
  }, [supabase, communityUuid]);

  // Search businesses function
  const searchBusinesses = () => {
    if (!communityUuid) return; // Don't search if we don't have the community UUID
    
    setLoading(true);
    
    // Build the query
    let query = supabase
      .from("businesses")
      .select(`
        *,
        category:category_id(id, name),
        subcategory:subcategory_id(id, name)
      `)
      .eq("community_id", communityUuid);
    
    // Add filters if they exist
    if (search) {
      query = query.ilike("name", `%${search}%`);
    }
    
    if (category) {
      query = query.eq("category_id", category);
    }
    
    if (subDirectory) {
      query = query.eq("subcategory_id", subDirectory);
    }
    
    // Execute the query
    query.then(res => {
      setLoading(false);
      if (!res.error) {
        const transformedData = res.data.map(business => ({
          ...business,
          category_name: business.category?.name,
          subcategory_name: business.subcategory?.name
        }));
        setBusinesses(transformedData);
      } else {
        console.error("Error searching businesses:", res.error);
      }
    });
  };

  // Dummy icons for categories (replace with real icons as needed)
  const categoryIcons: Record<string, string> = {
    "Health & Medical": "💊",
    "Restaurants & Cafés": "🍽️",
    "Shopping": "🛍️",
    "Beauty & Spa": "💅",
    "Hotels": "🏨",
    "Food & Drink": "🥤",
    "Other": "⭐",
  };

  // Dummy popular categories (replace with real logic as needed)
  const popularCategories = categories.slice(0, 6);

  return (
    <div className="min-h-screen bg-gradient-to-b from-teal-50 to-blue-50">
      {/* Development Note: Display user role for context */}
      {userRole && (
        <div className="mb-4 p-3 bg-sky-100 text-sky-700 rounded-md text-sm">
          You're viewing the business directory as a {userRole === 'community admin' ? 'community administrator' : 'regular member'}.
        </div>
      )}
      
      {/* 1. Hero/Search Banner */}
      <section className="w-full bg-gradient-to-r from-primaryTeal/60 to-seafoam/40 py-16 flex flex-col items-center justify-center text-center relative">
        <h1 className="text-3xl md:text-4xl font-heading font-extrabold text-offWhite mb-8 drop-shadow">Discover Local Businesses Near You.</h1>
        <div className="flex justify-center w-full max-w-content mx-auto">
          <form
            className="flex flex-row items-center w-full max-w-content gap-3"
            onSubmit={e => { 
              e.preventDefault();
              searchBusinesses();
            }}
          >
            <div className="bg-offWhite rounded-xl shadow-subtle p-4 flex items-center gap-2 flex-1">
              <input
                type="text"
                placeholder="What are you looking for?"
                className="px-3 py-1.5 rounded-md border border-grayLight bg-sand text-darkCharcoal font-body focus:ring-2 focus:ring-primaryTeal focus:border-primaryTeal focus:outline-none transition"
                style={{ flex: '0 0 22%' }}
                value={search}
                onChange={e => setSearch(e.target.value)}
              />
              <select
                className="px-3 py-1.5 rounded-md border border-grayLight bg-sand text-darkCharcoal font-body focus:ring-2 focus:ring-primaryTeal focus:border-primaryTeal focus:outline-none transition"
                value={category}
                onChange={e => { setCategory(e.target.value); setSubDirectory(""); }}
              >
                <option value="">Select Category</option>
                {categories.map(cat => (
                  <option key={cat.id} value={cat.id}>{cat.name}</option>
                ))}
              </select>
              {category ? (
                <select
                  className="px-3 py-1.5 rounded-md border border-grayLight bg-sand text-darkCharcoal font-body focus:ring-2 focus:ring-primaryTeal focus:border-primaryTeal focus:outline-none transition"
                  value={subDirectory}
                  onChange={e => setSubDirectory(e.target.value)}
                >
                  <option value="">Sub category</option>
                  {filteredSubcategories.map(sc => (
                    <option key={sc.id} value={sc.id}>{sc.name}</option>
                  ))}
                </select>
              ) : (
                <input
                  type="text"
                  placeholder="Sub category"
                  className="flex-1 px-3 py-1.5 rounded-md border border-grayLight bg-sand text-grayLight font-body focus:outline-none transition"
                  value=""
                  disabled
                />
              )}
            </div>
            <button
              type="submit"
              className="px-5 py-3 rounded-md bg-primaryTeal text-offWhite font-semibold font-body hover:bg-seafoam transition ml-2 shadow-elevated"
              style={{ minWidth: '120px' }}
            >
              Search
            </button>
          </form>
        </div>
      </section>

      {/* 2. Category Quick-Links */}
      <section className="w-full max-w-content mx-auto mt-8 flex flex-wrap justify-center gap-3">
        {categories.slice(0, 7).map(cat => (
          <button
            key={cat.id}
            className="flex items-center gap-2 px-4 py-2 rounded-pill bg-seafoam text-white font-semibold font-body shadow-subtle border-none hover:bg-primaryTeal transition"
            onClick={() => setCategory(cat.id)}
          >
            <span>{categoryIcons[cat.name] || "⭐"}</span>
            {cat.name}
          </button>
        ))}
        <button
          className="flex items-center gap-2 px-4 py-2 rounded-pill bg-primaryTeal text-offWhite font-semibold font-body shadow-subtle border-none hover:bg-seafoam transition"
          onClick={() => setCategory("")}
        >
          <span>🔄</span> All Categories
        </button>
      </section>

      {/* 3. Popular Categories Strip */}
      <section className="w-full max-w-content mx-auto mt-10 overflow-x-auto pb-2">
        <div className="flex gap-6 min-w-max">
          {popularCategories.map(cat => (
            <div key={cat.id} className="flex flex-col items-center bg-offWhite rounded-card shadow-subtle px-6 py-4 min-w-[140px]">
              <div className="text-3xl mb-2">{categoryIcons[cat.name] || "⭐"}</div>
              <div className="font-semibold text-primaryTeal font-heading">{cat.name}</div>
              <div className="text-xs text-grayLight mt-1">-- Listings</div>
            </div>
          ))}
        </div>
      </section>

      {/* 4. Results Grid */}
      <section className="w-full max-w-content mx-auto mt-12">
        {loading && <p className="text-center text-primaryTeal font-body">Loading...</p>}
        <div className="text-center text-slate-500 my-10">
          <p>Community ID: {communityId} | Total businesses: {businesses.length}</p>
          {businesses.length === 0 && (
            <>
              <p>No businesses found.</p>
              <p className="text-xs mt-4 text-slate-400">Debug info: 
                {loading ? "Loading..." : "Completed loading"}
              </p>
            </>
          )}
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {businesses.map(b => (
            <BusinessCard 
              key={b.id} 
              business={{
                id: b.id,
                name: b.name,
                description: b.description,
                image_url: b.logo_url || b.cover_image_url || undefined,
                is_featured: b.is_featured,
                category: b.category_name,
                category_name: b.category_name,
                subcategory_name: b.subcategory_name
              }}
            />
          ))}
        </div>
      </section>

      {/* 5. Pagination / Load More */}
      <section className="w-full flex justify-center mt-10 mb-16">
        <button className="px-6 py-2 rounded-pill bg-offWhite shadow-subtle border border-grayLight text-primaryTeal font-semibold font-body hover:bg-seafoam hover:text-white transition">
          Load More
        </button>
      </section>
    </div>
  );
} 