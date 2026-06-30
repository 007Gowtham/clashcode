/** @type {import('next').NextConfig} */
const nextConfig = {
  async rewrites() {
    return [
      {
        source: '/api/:path*',
        destination: 'http://13.201.230.50:5000/api/:path*',
      },
    ];
  },
};

export default nextConfig;
