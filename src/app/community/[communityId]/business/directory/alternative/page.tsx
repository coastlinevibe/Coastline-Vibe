"use client";

import { useState, useEffect } from "react";
import { createBrowserClient } from "@supabase/ssr";
import { useParams } from "next/navigation";

export default function AlternativeBusinessDirectoryPage() {
  const params = useParams();
  const communityId = params.communityId as string;
  const [business, setBusiness] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const supabase = createBrowserClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    );

    // Directly fetch the Wild West Hotel by ID
    supabase
      .from("businesses")
      .select("*")
      .eq("id", "5bdc653b-256b-46a1-b853-ebd99468d255")
      .single()
      .then((res) => {
        setLoading(false);
        if (res.error) {
          console.error("Error fetching business:", res.error);
        } else {
          console.log("Found Wild West Hotel:", res.data);
          setBusiness(res.data);
        }
      });
  }, []);

  if (loading) {
    return <div>Loading...</div>;
  }

  if (!business) {
    return <div>No business found</div>;
  }

  return (
    <div style={{ padding: '20px' }}>
      <h1 style={{ fontSize: '24px', marginBottom: '20px' }}>Alternative Business Directory</h1>
      <div style={{ border: '1px solid #ccc', padding: '20px', borderRadius: '5px' }}>
        <h2 style={{ fontSize: '20px', marginBottom: '10px' }}>{business.name || business.title}</h2>
        <p style={{ marginBottom: '10px' }}>{business.description}</p>
        <div style={{ marginBottom: '5px' }}>Email: {business.email}</div>
        <div style={{ marginBottom: '5px' }}>Phone: {business.phone}</div>
        <div style={{ marginBottom: '5px' }}>Community ID: {business.community_id}</div>
        <a 
          href={`/community/${communityId}/business/${business.id}`}
          style={{ 
            display: 'inline-block', 
            padding: '8px 16px', 
            backgroundColor: '#4CAF50', 
            color: 'white', 
            textDecoration: 'none',
            borderRadius: '4px',
            marginTop: '15px' 
          }}
        >
          View Details
        </a>
      </div>
    </div>
  );
} 