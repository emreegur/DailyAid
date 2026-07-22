/** @type {import('next').NextConfig} */
const nextConfig = {
  // Redirect API calls to respective backends
  async rewrites() {
    return [
      {
        source: '/api/:path*',
        destination: 'http://localhost:5116/api/:path*',
      },
    ];
  },
  experimental: {
    instrumentationHook: true,
  },
};

export default nextConfig;
