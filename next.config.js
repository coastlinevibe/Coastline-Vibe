// @ts-check
/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    domains: [
      'misc.s3.us-west-2.amazonaws.com',
      'res.cloudinary.com',
      'images.unsplash.com',
      'source.unsplash.com',
      'ui-avatars.com',
      'kbjudvamidagzzfvxgov.supabase.co',
      'api.dicebear.com',
      'i.pravatar.cc',
    ],
    unoptimized: process.env.NODE_ENV === 'production',
  },
  output: 'standalone',
  trailingSlash: false,
  reactStrictMode: true,
};

module.exports = nextConfig; 