"use client";

import Link from 'next/link';
import Image from 'next/image';
import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { createBrowserClient } from '@supabase/ssr';
import { MapPin, Store, Coffee, Utensils, Hotel, Tent, Camera, Bike } from 'lucide-react';

export default function Home() {
  const router = useRouter();
  const supabase = createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );

  const [redirecting, setRedirecting] = useState(false);

  useEffect(() => {
    // Check if the user is already logged in
    const checkUser = async () => {
      const { data: { user } } = await supabase.auth.getUser();

      if (user) {
        const { data: profile } = await supabase
          .from('profiles')
          .select('community_id, role')
          .eq('id', user.id)
          .single();
          
        if (profile && profile.community_id) {
          const { data: community } = await supabase
            .from('communities')
            .select('slug')
            .eq('id', profile.community_id)
            .single();
            
          if (community) {
            setRedirecting(true);
            if (profile.role === 'business') {
              router.push(`/community/${community.slug}/business/directory/businessmenu`);
            } else {
              router.push(`/community/${community.slug}/mini-dash`);
            }
          }
        }
      }
    };

    checkUser();
  }, [router, supabase]);

  if (redirecting) {
    return (
      <div className="flex justify-center items-center h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primaryTeal"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col">
        {/* Hero Section */}
      <div className="relative h-screen bg-teal-900">
        {/* Background Image */}
        <Image 
          src="/images/cover.jpg" 
          alt="Da Nang Beach" 
          fill 
          style={{ objectFit: 'cover', objectPosition: 'center' }}
          priority
        />

          {/* Overlay */}
        <div className="absolute inset-0 bg-gradient-to-b from-teal-900/70 to-teal-900/30"></div>

        {/* Content */}
        <div className="absolute inset-0 flex flex-col justify-center items-center text-white p-4">
          <div className="mb-4 inline-flex items-center px-4 py-2 bg-white/20 backdrop-blur-sm rounded-full">
            <MapPin size={18} className="mr-2" />
            <span className="font-medium">Da Nang, Vietnam</span>
          </div>
          <h1 className="text-5xl sm:text-6xl md:text-7xl font-bold text-center mb-4">
            Discover Da Nang
            </h1>
          <p className="text-xl sm:text-2xl font-light mb-6 text-center max-w-2xl">
            Your guide to local businesses and hidden gems
          </p>
          <div className="flex flex-col sm:flex-row gap-4 mt-4">
            <Link href="/login?redirect=/community/da-nang/business/directory" className="bg-primaryTeal hover:bg-teal-600 text-white font-bold py-4 px-8 rounded-lg shadow-lg transition duration-300 text-center">
              Explore Local Directory
            </Link>
            <Link href="/signup" className="bg-white bg-opacity-20 hover:bg-opacity-30 text-white font-bold py-4 px-8 rounded-lg shadow-lg transition duration-300 text-center">
              Join Community
            </Link>
          </div>
        </div>
      </div>
      
      {/* What's in the Directory Section */}
      <div className="py-16 bg-white">
        <div className="max-w-6xl mx-auto px-4">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-gray-800 mb-4">Discover Da Nang&apos;s Local Directory</h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              Find the best places to eat, stay, and play in Da Nang. Our community-powered directory gives you access to local favorites and hidden gems.
            </p>
          </div>
          
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
            {[
              { icon: <Coffee className="h-8 w-8" />, title: "Cafes & Restaurants", count: "80+" },
              { icon: <Hotel className="h-8 w-8" />, title: "Accommodation", count: "40+" },
              { icon: <Bike className="h-8 w-8" />, title: "Activities", count: "30+" },
              { icon: <Store className="h-8 w-8" />, title: "Local Services", count: "50+" }
            ].map((category, idx) => (
              <div key={idx} className="bg-gray-50 p-6 rounded-lg text-center hover:shadow-md transition-shadow">
                <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-teal-100 text-primaryTeal mb-4">
                  {category.icon}
                </div>
                <h3 className="text-lg font-semibold mb-1">{category.title}</h3>
                <p className="text-primaryTeal font-bold">{category.count}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
      
      {/* Featured Neighborhoods */}
      <div className="py-16 bg-gray-50">
        <div className="max-w-6xl mx-auto px-4">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-gray-800 mb-4">Explore Da Nang&apos;s Neighborhoods</h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              Each area of Da Nang offers a unique experience. Discover businesses across these vibrant neighborhoods.
            </p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {[
              {
                name: "My An Beach Area",
                image: "/beach-ball.png",
                description: "Popular for its beautiful beach, vibrant cafes, and international restaurants."
              },
              {
                name: "Han Riverside",
                image: "/beach-ball.png",
                description: "Famous for the Dragon Bridge, night market, and scenic river views."
              },
              {
                name: "Son Tra Peninsula",
                image: "/beach-ball.png",
                description: "Nature reserve with stunning views, beaches, and the famous Lady Buddha statue."
              }
            ].map((neighborhood, idx) => (
              <div key={idx} className="bg-white rounded-lg overflow-hidden shadow-md hover:shadow-lg transition-shadow">
                <div className="h-48 relative">
                  <Image 
                    src={neighborhood.image} 
                    alt={neighborhood.name}
                    fill
                    style={{ objectFit: 'cover' }}
                  />
                </div>
                <div className="p-6">
                  <h3 className="text-xl font-bold mb-2">{neighborhood.name}</h3>
                  <p className="text-gray-600 mb-4">{neighborhood.description}</p>
                  <Link href="/login?redirect=/community/da-nang/business/directory" className="text-primaryTeal font-medium hover:underline flex items-center">
                    Explore businesses 
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 ml-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                    </svg>
                  </Link>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
      
      {/* Popular Categories */}
      <div className="py-16 bg-white">
        <div className="max-w-6xl mx-auto px-4">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-gray-800 mb-4">Popular Categories</h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              Find exactly what you&apos;re looking for in our comprehensive business directory.
            </p>
          </div>
          
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {[
              { icon: <Utensils className="h-6 w-6" />, name: "Restaurants" },
              { icon: <Coffee className="h-6 w-6" />, name: "Cafes" },
              { icon: <Hotel className="h-6 w-6" />, name: "Hotels & Hostels" },
              { icon: <Tent className="h-6 w-6" />, name: "Tours & Activities" },
              { icon: <Camera className="h-6 w-6" />, name: "Photography" },
              { icon: <Bike className="h-6 w-6" />, name: "Rentals" },
              { icon: <Store className="h-6 w-6" />, name: "Shopping" },
              { icon: <MapPin className="h-6 w-6" />, name: "More..." }
            ].map((category, idx) => (
              <Link 
                key={idx} 
                href="/login?redirect=/community/da-nang/business/directory" 
                className="flex items-center p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors"
              >
                <div className="mr-3 text-primaryTeal">{category.icon}</div>
                <span className="font-medium">{category.name}</span>
              </Link>
            ))}
          </div>
        </div>
            </div>
      
      {/* Join Community CTA */}
      <div className="bg-gradient-to-r from-teal-500 to-blue-500 py-16 px-4 text-white">
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="text-3xl sm:text-4xl font-bold mb-6">Join the Da Nang Community Today</h2>
          <p className="text-xl mb-8 opacity-90">
            Connect with locals, discover new places, and get the most out of your time in Da Nang.
          </p>
          <div className="flex flex-col sm:flex-row justify-center gap-4">
            <Link href="/signup" className="bg-white text-teal-600 hover:bg-slate-100 font-bold py-3 px-8 rounded-lg shadow-lg transition duration-300 text-center">
              Create Account
            </Link>
            <Link href="/login?redirect=/community/da-nang/business/directory" className="bg-transparent hover:bg-white hover:bg-opacity-20 border-2 border-white font-bold py-3 px-8 rounded-lg shadow-lg transition duration-300 text-center">
              Browse as Guest
            </Link>
          </div>
        </div>
      </div>

      {/* Footer */}
      <footer className="bg-gray-900 text-gray-300 py-12 px-4">
        <div className="max-w-6xl mx-auto">
          <div className="flex flex-col md:flex-row justify-between gap-8">
            <div className="md:w-1/3">
              <div className="flex items-center mb-4">
                <div className="w-10 h-10 relative mr-2">
                  <Image src="/images/logo.svg" alt="CoastlineVibe Logo" fill style={{ objectFit: 'contain' }} />
                </div>
                <span className="text-2xl font-bold text-white">CoastlineVibe</span>
              </div>
              <p className="mb-4">Your guide to Da Nang&apos;s local businesses and community.</p>
              <div className="flex space-x-4">
                <a href="#" className="text-gray-300 hover:text-primaryTeal transition-colors">
                  <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                    <path fillRule="evenodd" d="M22 12c0-5.523-4.477-10-10-10S2 6.477 2 12c0 4.991 3.657 9.128 8.438 9.878v-6.987h-2.54V12h2.54V9.797c0-2.506 1.492-3.89 3.777-3.89 1.094 0 2.238.195 2.238.195v2.46h-1.26c-1.243 0-1.63.771-1.63 1.562V12h2.773l-.443 2.89h-2.33v6.988C18.343 21.128 22 16.991 22 12z" clipRule="evenodd" />
                  </svg>
                </a>
                <a href="#" className="text-gray-300 hover:text-primaryTeal transition-colors">
                  <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                    <path d="M8.29 20.251c7.547 0 11.675-6.253 11.675-11.675 0-.178 0-.355-.012-.53A8.348 8.348 0 0022 5.92a8.19 8.19 0 01-2.357.646 4.118 4.118 0 001.804-2.27 8.224 8.224 0 01-2.605.996 4.107 4.107 0 00-6.993 3.743 11.65 11.65 0 01-8.457-4.287 4.106 4.106 0 001.27 5.477A4.072 4.072 0 012.8 9.713v.052a4.105 4.105 0 003.292 4.022 4.095 4.095 0 01-1.853.07 4.108 4.108 0 003.834 2.85A8.233 8.233 0 012 18.407a11.616 11.616 0 006.29 1.84" />
                  </svg>
                </a>
                <a href="#" className="text-gray-300 hover:text-primaryTeal transition-colors">
                  <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                    <path fillRule="evenodd" d="M12.315 2c2.43 0 2.784.013 3.808.06 1.064.049 1.791.218 2.427.465a4.902 4.902 0 011.772 1.153 4.902 4.902 0 011.153 1.772c.247.636.416 1.363.465 2.427.048 1.067.06 1.407.06 4.123v.08c0 2.643-.012 2.987-.06 4.043-.049 1.064-.218 1.791-.465 2.427a4.902 4.902 0 01-1.153 1.772 4.902 4.902 0 01-1.772 1.153c-.636.247-1.363.416-2.427.465-1.067.048-1.407.06-4.123.06h-.08c-2.643 0-2.987-.012-4.043-.06-1.064-.049-1.791-.218-2.427-.465a4.902 4.902 0 01-1.772-1.153 4.902 4.902 0 01-1.153-1.772c-.247-.636-.416-1.363-.465-2.427-.047-1.024-.06-1.379-.06-3.808v-.63c0-2.43.013-2.784.06-3.808.049-1.064.218-1.791.465-2.427a4.902 4.902 0 011.153-1.772A4.902 4.902 0 015.45 2.525c.636-.247 1.363-.416 2.427-.465C8.901 2.013 9.256 2 11.685 2h.63zm-.081 1.802h-.468c-2.456 0-2.784.011-3.807.058-.975.045-1.504.207-1.857.344-.467.182-.8.398-1.15.748-.35.35-.566.683-.748 1.15-.137.353-.3.882-.344 1.857-.047 1.023-.058 1.351-.058 3.807v.468c0 2.456.011 2.784.058 3.807.045.975.207 1.504.344 1.857.182.466.399.8.748 1.15.35.35.683.566 1.15.748.353.137.882.3 1.857.344 1.054.048 1.37.058 4.041.058h.08c2.597 0 2.917-.01 3.96-.058.976-.045 1.505-.207 1.858-.344.466-.182.8-.398 1.15-.748.35-.35.566-.683.748-1.15.137-.353.3-.882.344-1.857.048-1.055.058-1.37.058-4.041v-.08c0-2.597-.01-2.917-.058-3.96-.045-.976-.207-1.505-.344-1.858a3.097 3.097 0 00-.748-1.15 3.098 3.098 0 00-1.15-.748c-.353-.137-.882-.3-1.857-.344-1.023-.047-1.351-.058-3.807-.058zM12 6.865a5.135 5.135 0 110 10.27 5.135 5.135 0 010-10.27zm0 1.802a3.333 3.333 0 100 6.666 3.333 3.333 0 000-6.666zm5.338-3.205a1.2 1.2 0 110 2.4 1.2 1.2 0 010-2.4z" clipRule="evenodd" />
                  </svg>
                </a>
              </div>
            </div>
            <div className="md:w-2/3 grid grid-cols-2 sm:grid-cols-3 gap-8">
              <div>
                <h3 className="text-white font-semibold text-lg mb-4">Da Nang Directory</h3>
                <ul className="space-y-2">
                  <li><a href="#" className="hover:text-primaryTeal transition-colors">Restaurants</a></li>
                  <li><a href="#" className="hover:text-primaryTeal transition-colors">Accommodations</a></li>
                  <li><a href="#" className="hover:text-primaryTeal transition-colors">Activities</a></li>
                  <li><a href="#" className="hover:text-primaryTeal transition-colors">Services</a></li>
                </ul>
              </div>
              <div>
                <h3 className="text-white font-semibold text-lg mb-4">Areas</h3>
                <ul className="space-y-2">
                  <li><a href="#" className="hover:text-primaryTeal transition-colors">My An Beach</a></li>
                  <li><a href="#" className="hover:text-primaryTeal transition-colors">Han Riverside</a></li>
                  <li><a href="#" className="hover:text-primaryTeal transition-colors">Son Tra Peninsula</a></li>
                  <li><a href="#" className="hover:text-primaryTeal transition-colors">All Neighborhoods</a></li>
                </ul>
              </div>
              <div>
                <h3 className="text-white font-semibold text-lg mb-4">Info</h3>
                <ul className="space-y-2">
                  <li><a href="#" className="hover:text-primaryTeal transition-colors">About Us</a></li>
                  <li><a href="/signup" className="hover:text-primaryTeal transition-colors">Join Community</a></li>
                  <li><a href="#" className="hover:text-primaryTeal transition-colors">Add Your Business</a></li>
                  <li><a href="#" className="hover:text-primaryTeal transition-colors">Contact</a></li>
                </ul>
              </div>
            </div>
          </div>
          <div className="border-t border-gray-700 mt-12 pt-8 text-center text-sm">
            <p>&copy; {new Date().getFullYear()} CoastlineVibe - Da Nang Local Directory. All rights reserved.</p>
            </div>
          </div>
      </footer>
    </div>
  );
}
