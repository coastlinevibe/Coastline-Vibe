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
    { name: "Miami, USA", icon: <Building size={24} className="text-coralAccent" /> },
    { name: "Nha Trang, Vietnam", icon: <Waves size={24} className="text-primaryTeal" /> },
    { name: "Da Nang, Vietnam", icon: <MapPin size={24} className="text-seafoam" /> },
  ];

  const features = [
    {
      title: "Community Feed",
      description: "Stay updated with local news, events, and discussions.",
      icon: <MessageSquare size={32} className="text-primaryTeal mb-2" />
    }, {
      title: "Marketplace",
      description: "Buy and sell unique items within your coastal community.",
      icon: <ShoppingBag size={32} className="text-primaryTeal mb-2" />
    }, {
      title: "Properties",
      description: "Find your dream coastal home or list your property.",
      icon: <Building size={32} className="text-primaryTeal mb-2" />
    }, {
      title: "Local Directory",
      description: "Discover and support local businesses and services.",
      icon: <Compass size={32} className="text-primaryTeal mb-2" />
    }
  ];

  return (
    <div className="min-h-screen bg-sand text-darkCharcoal flex flex-col font-body">
      {/* Main Content Area */}
      <main className="flex-grow">
        {/* Hero Section */}
        <section id="hero" className="relative h-[60vh] min-h-[400px] flex flex-col items-center justify-center text-center overflow-hidden">
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
          <div className="absolute top-0 left-0 w-full h-full bg-gradient-to-b from-primaryTeal/60 to-primaryTeal/0 z-10"></div>

          {/* Hero Content */}
          <div className="relative z-20 container mx-auto px-4 max-w-content">
            <h1 className="text-4xl sm:text-5xl md:text-6xl font-heading font-bold mb-6 leading-tight text-offWhite">
              Your Coastal Connection.
            </h1>
            <p className="text-lg sm:text-xl max-w-3xl mx-auto mb-10 text-offWhite font-body">
              CoastlineVibe is your all-in-one platform to connect with your local coastal community, discover hidden gems, and embrace the vibrant seaside lifestyle.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 sm:gap-6 justify-center">
              <Link href="/signup">
                <button 
                  type="button"
                  className="px-8 py-3 rounded-md font-semibold bg-primaryTeal text-offWhite hover:bg-seafoam hover:text-primaryTeal transition-colors shadow-elevated border-2 border-primaryTeal"
                >
                  Join the Community
                </button>
              </Link>
              <button 
                type="button"
                className="px-8 py-3 rounded-md font-semibold bg-coralAccent text-offWhite hover:bg-seafoam hover:text-coralAccent transition-colors shadow-elevated border-2 border-coralAccent"
              >
                Explore Features
              </button>
            </div>
          </div>
        </section>

        {/* About Us Section */}
        <section id="about" className="py-16 sm:py-20 bg-offWhite relative overflow-hidden shadow-subtle mx-auto max-w-content mt-8 rounded-lg">
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
                <h2 className="text-3xl sm:text-4xl font-heading font-bold text-primaryTeal mb-6">
                  About <span className="text-seafoam">Coastline</span><span className="text-coralAccent">Vibe</span>
                </h2>
                <p className="text-seafoam font-semibold text-lg mb-4">
                  Safe, comprehensive and fast platform
                </p>
                <div className="text-darkCharcoal space-y-4">
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
                  src="/about-us-image.jpg"
                  alt="Coastal community gathering"
                  className="rounded-lg shadow-elevated w-full h-auto object-cover aspect-[4/3] bg-sand"
                />
              </div>
            </div>

            {/* Statistics Section */}
            <div className="mt-16 grid grid-cols-1 sm:grid-cols-3 gap-8 text-center relative z-10">
              <div className="bg-offWhite p-6 rounded-lg shadow-subtle border border-seafoam/20">
                <TrendingUp size={32} className="text-primaryTeal mx-auto mb-3" />
                <h4 className="text-lg font-semibold text-seafoam mb-1 font-heading">Active Listings</h4>
                <p className="text-3xl font-bold text-primaryTeal">20,123+</p>
              </div>
              <div className="bg-offWhite p-6 rounded-lg shadow-subtle border border-seafoam/20">
                <CalendarDays size={32} className="text-coralAccent mx-auto mb-3" />
                <h4 className="text-lg font-semibold text-seafoam mb-1 font-heading">Vibing Since</h4>
                <p className="text-3xl font-bold text-primaryTeal">2023</p>
              </div>
              <div className="bg-offWhite p-6 rounded-lg shadow-subtle border border-seafoam/20">
                <UserCheck size={32} className="text-seafoam mx-auto mb-3" />
                <h4 className="text-lg font-semibold text-seafoam mb-1 font-heading">Happy Members</h4>
                <p className="text-3xl font-bold text-primaryTeal">13,560+</p>
              </div>
            </div>
          </div>
        </section>

        {/* Communities to Join Section */}
        <section id="communities" className="py-16 sm:py-20 bg-seafoam/10">
          <div className="container mx-auto px-4 text-center max-w-content">
            <h2 className="text-3xl font-heading font-bold text-primaryTeal mb-12">Join a Vibe Near You</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
              {communities.map((community) => (
                <div key={community.name} className="bg-offWhite p-6 sm:p-8 rounded-lg shadow-elevated hover:shadow-xl transition-shadow flex flex-col items-center border border-seafoam/20">
                  <div className="p-4 mb-4 rounded-full bg-gradient-to-br from-seafoam/30 to-coralAccent/20">
                    {community.icon}
                  </div>
                  <h3 className="text-xl font-heading font-semibold text-primaryTeal mb-4">{community.name}</h3>
                  <button className="mt-2 px-5 py-2 rounded-pill font-semibold bg-coralAccent hover:bg-seafoam text-offWhite hover:text-primaryTeal transition-colors shadow-subtle">
                    Explore Community
                  </button>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Features Section */}
        <section id="features" className="py-16 sm:py-20 bg-offWhite">
          <div className="container mx-auto px-4 max-w-content">
            <h2 className="text-3xl font-heading font-bold text-primaryTeal mb-12 text-center">Platform Highlights</h2>
            <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-4">
              {features.map((feature) => (
                <div
                  key={feature.title}
                  className="group rounded-lg bg-sand p-6 text-center transition-colors shadow-subtle hover:shadow-elevated border border-seafoam/20"
                >
                  <div className="flex justify-center mb-4">
                    {feature.icon}
                  </div>
                  <h3 className="mb-3 text-xl font-heading font-semibold text-primaryTeal group-hover:text-seafoam">
                    {feature.title}
                  </h3>
                  <p className="text-sm text-darkCharcoal">
                    {feature.description}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </section>

      </main>

      {/* Footer */}
      <footer className="py-8 text-center bg-sand border-t border-seafoam/20">
        <p className="text-grayLight text-sm">
          &copy; {new Date().getFullYear()} CoastlineVibe. All rights reserved. Embrace the coast!
        </p>
      </footer>
    </div>
  );
}
