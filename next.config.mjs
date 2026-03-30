/** @type {import('next').NextConfig} */
const nextConfig = {
  webpack: (config) => {
    // Leaflet uses 'self' which is not available in SSR context
    config.resolve.fallback = {
      ...config.resolve.fallback,
      fs: false,
    };
    return config;
  },
};

export default nextConfig;
