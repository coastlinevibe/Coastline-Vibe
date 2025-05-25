"use client"; // Mark this as a Client Component

import { useEffect, useState } from 'react';
import { Users, Waves, MapPin, Building, ShoppingBag, MessageSquare, Compass, TrendingUp, CalendarDays, UserCheck } from 'lucide-react';
import Link from 'next/link';

export default function HomePage() {
  const [isClient, setIsClient] = useState(false);

  useEffect(() => {
    setIsClient(true);
  }, []);

  const communities = [
    { name: "Miami, USA", icon: <Building size={24} className="text-rose-500" /> },
    { name: "Nha Trang, Vietnam", icon: <Waves size={24} className="text-cyan-500" /> },
    { name: "Da Nang, Vietnam", icon: <MapPin size={24} className="text-orange-500" /> },
  ];

  const features = [
    {
      title: "Community Feed",
      description: "Stay updated with local news, events, and discussions.",
      icon: <MessageSquare size={32} className="text-sky-600 mb-2" />
    }, {
      title: "Marketplace",
      description: "Buy and sell unique items within your coastal community.",
      icon: <ShoppingBag size={32} className="text-sky-600 mb-2" />
    }, {
      title: "Properties",
      description: "Find your dream coastal home or list your property.",
      icon: <Building size={32} className="text-sky-600 mb-2" />
    }, {
      title: "Local Directory",
      description: "Discover and support local businesses and services.",
      icon: <Compass size={32} className="text-sky-600 mb-2" />
    }
  ];

  return (
    <div className="min-h-screen bg-sky-50 text-slate-700 flex flex-col">
      {/* Main Content Area */}
      <main className="flex-grow">
        {/* Hero Section */}
        <section id="hero" className="relative h-screen flex flex-col items-center justify-center text-center text-white overflow-hidden">
          {/* Background Video - Render only on client-side */}
          {isClient && (
            <video
              autoPlay
              loop
              muted
              playsInline // Important for iOS and some browsers
              className="absolute top-0 left-0 w-full h-full object-cover z-0"
            >
              <source src="/background-hero.mp4" type="video/mp4" />
              Your browser does not support the video tag.
            </video>
          )}

          {/* Overlay */}
          <div className="absolute top-0 left-0 w-full h-full bg-black/50 z-10"></div> {/* Darker overlay: bg-black/50 */}
          {/* You can try other overlays like: */}
          {/* <div className="absolute top-0 left-0 w-full h-full bg-sky-800/60 z-10"></div> */}
          {/* <div className="absolute top-0 left-0 w-full h-full bg-gradient-to-br from-cyan-700/70 via-sky-600/50 to-rose-700/70 z-10"></div> */}

          {/* Hero Content */}
          <div className="relative z-20 container mx-auto px-4">
            <h2 className="text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-bold mb-6 leading-tight">
              Your Coastal Connection.
            </h2>
            <p className="text-lg sm:text-xl md:text-2xl max-w-3xl mx-auto mb-10 opacity-90">
              CoastlineVibe is your all-in-one platform to connect with your local coastal community, discover hidden gems, and embrace the vibrant seaside lifestyle.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 sm:gap-6 justify-center">
              <button 
                type="button"
                className="px-8 py-3 sm:px-10 sm:py-4 rounded-lg font-semibold bg-cyan-200 hover:bg-cyan-300 text-cyan-800 transition-colors shadow-lg hover:shadow-xl text-lg sm:text-xl transform hover:scale-105"
              >
                Join the Community
              </button>
              <button 
                type="button"
                className="px-8 py-3 sm:px-10 sm:py-4 rounded-lg font-semibold bg-rose-200 hover:bg-rose-300 text-rose-800 transition-colors shadow-lg hover:shadow-xl text-lg sm:text-xl transform hover:scale-105"
              >
                Explore Features
              </button>
            </div>
          </div>
        </section>

        {/* About Us Section */}
        <section id="about" className="py-16 sm:py-20 md:py-24 bg-orange-50/70 relative overflow-hidden">
          {/* Decorative background images */}
          <img 
            src="/beach-ball.png" 
            alt="Beach ball" 
            className="absolute top-16 left-16 w-24 h-24 opacity-20 animate-bounce-slow" 
          />
          <img 
            src="/shell 1.png" 
            alt="Shell 1"
            className="absolute bottom-12 left-10 w-28 h-28 opacity-25 rotate-12 animate-pulse"
          />
          <img 
            src="/shell 2.png" 
            alt="Shell 2"
            className="absolute top-1/3 left-12 sm:left-16 md:left-24 w-20 h-20 opacity-20 -rotate-12 animate-bounce-gentle"
          />
          <img
            src="/sand-bucket.png"
            alt="Sand bucket"
            className="absolute top-[45%] left-[290px] sm:left-[236px] w-20 h-20 opacity-20 rotate-6 animate-pulse"
          />

          <div className="container mx-auto px-4">
            <div className="grid md:grid-cols-2 gap-12 sm:gap-16 items-center">
              {/* Left Column: Text Content */}
              <div className="relative z-10">
                <h3 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-sky-700 mb-6">
                  About <span className="text-cyan-600">Coastline</span><span className="text-rose-500">Vibe</span>
                </h3>
                <p className="text-blue-500 font-semibold text-lg sm:text-xl mb-4">
                  Safe, comprehensive and fast platform
                </p>
                <div className="text-slate-600 space-y-4 sm:text-lg">
                  <p>
                    The world's coastal lifestyle is changing. We're moving from just visiting the beach to truly living it. CoastlineVibe is your technology-based, community-focused platform. We believe that with the advent of modern connection tools, the coastal experience can be richer, more accessible, and more united. We seek to create a fundamental and key role in this vibrant evolution.
                  </p>
                  <p>
                    At CoastlineVibe, we believe in the magic of coastal living. Our platform is born from a passion for sun-kissed shores, salty air, and the incredible communities that thrive by the sea. We aim to be the digital heartbeat of your coastal town, connecting residents, visitors, and local businesses in a seamless and engaging ecosystem.
                  </p>
                </div>
              </div>

              {/* Right Column: Image */}
              <div className="relative z-10 mt-10 md:mt-0">
                <img 
                  src="/about-us-image.jpg" // Please replace with your actual image for the About Us section
                  alt="Coastal community gathering"
                  className="rounded-xl shadow-2xl w-full h-auto object-cover aspect-[4/3]"
                />
              </div>
            </div>

            {/* Statistics Section */}
            <div className="mt-16 sm:mt-20 md:mt-24 grid grid-cols-1 sm:grid-cols-3 gap-8 sm:gap-12 text-center relative z-10">
              <div className="bg-white p-6 rounded-lg shadow-lg">
                <TrendingUp size={32} className="text-cyan-600 mx-auto mb-3" />
                <h4 className="text-lg font-semibold text-slate-500 mb-1">Active Listings</h4>
                <p className="text-3xl sm:text-4xl font-bold text-sky-700">20,123+</p>
              </div>
              <div className="bg-white p-6 rounded-lg shadow-lg">
                <CalendarDays size={32} className="text-rose-500 mx-auto mb-3" />
                <h4 className="text-lg font-semibold text-slate-500 mb-1">Vibing Since</h4>
                <p className="text-3xl sm:text-4xl font-bold text-sky-700">2023</p>
              </div>
              <div className="bg-white p-6 rounded-lg shadow-lg">
                <UserCheck size={32} className="text-orange-500 mx-auto mb-3" />
                <h4 className="text-lg font-semibold text-slate-500 mb-1">Happy Members</h4>
                <p className="text-3xl sm:text-4xl font-bold text-sky-700">13,560+</p>
              </div>
            </div>
          </div>
        </section>

        {/* Communities to Join Section */}
        <section id="communities" className="py-16 sm:py-20 md:py-24 bg-sky-50">
          <div className="container mx-auto px-4 text-center">
            <h3 className="text-3xl sm:text-4xl font-bold text-sky-700 mb-12">Join a Vibe Near You</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
              {communities.map((community) => (
                <div key={community.name} className="bg-white p-6 sm:p-8 rounded-xl shadow-lg hover:shadow-xl transition-shadow flex flex-col items-center">
                  <div className="p-3 mb-4 rounded-full bg-gradient-to-br from-cyan-100 to-rose-100">
                    {community.icon}
                  </div>
                  <h4 className="text-xl sm:text-2xl font-semibold text-slate-700 mb-2">{community.name}</h4>
                  <button className="mt-4 px-5 py-2 rounded-md font-medium bg-orange-200 hover:bg-orange-300 text-orange-800 transition-colors text-sm">
                    Explore Community
                  </button>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Features Section (existing, slightly restyled for consistency) */}
        <section id="features" className="py-16 sm:py-20 md:py-24 bg-white">
          <div className="container mx-auto px-4">
            <h3 className="text-3xl sm:text-4xl font-bold text-sky-700 mb-12 text-center">Platform Highlights</h3>
            <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-4">
              {features.map((feature) => (
                <div
                  key={feature.title}
                  className="group rounded-xl border border-slate-200 p-6 text-center transition-colors hover:border-cyan-200 hover:bg-sky-50/50 shadow-sm hover:shadow-md"
                >
                  <div className="flex justify-center mb-4">
                    {feature.icon}
                  </div>
                  <h4 className="mb-3 text-xl sm:text-2xl font-semibold text-sky-700 group-hover:text-cyan-700">
                    {feature.title}
                  </h4>
                  <p className="m-0 text-sm text-slate-600 opacity-90">
                    {feature.description}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </section>

      </main>

      {/* Footer */}
      <footer className="py-8 sm:py-12 text-center bg-slate-100 border-t border-slate-200">
        <p className="text-slate-600 text-sm">
          &copy; {new Date().getFullYear()} CoastlineVibe. All rights reserved. Embrace the coast!
        </p>
      </footer>
    </div>
  );
}
