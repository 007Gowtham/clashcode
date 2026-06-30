/** @type {import('next').NextConfig} */
const nextConfig = {
  async rewrites() {
    return [
      {
        source: '/api/:path*',
        destination: 'https://clashcode.duckdns.org/api/:path*',
      },
    ];
  },
};

export default nextConfig;
