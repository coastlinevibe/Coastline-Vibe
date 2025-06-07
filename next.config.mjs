/** @type {import('next').NextConfig} */
const nextConfig = {
  /* config options here */
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'placekitten.com',
        port: '',
        pathname: '/**',
      },
      {
        protocol: 'https',
        hostname: 'source.unsplash.com',
        port: '',
        pathname: '/**',
      },
      {
        protocol: 'https',
        hostname: 'static.wikia.nocookie.net',
        port: '',
        pathname: '/**',
      },
      {
        protocol: 'https',
        hostname: 'kbjudvamidagzzfvxgov.supabase.co',
        port: '',
        pathname: '/storage/v1/object/public/**',
      },
    ],
  },
  // Set the development server port to 3001 explicitly
  devIndicators: {
    buildActivity: true,
  },
  // Use server actions for form handling
  experimental: {
    serverActions: true,
  },
  // Define environment variables with defaults
  env: {
    PORT: process.env.PORT || '3001',
  },
};
 
export default nextConfig; 