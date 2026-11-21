/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  images: {
    domains: ['localhost', 'hamplard.com'],
  },
  async redirects() {
    return [
      { source: '/auth/login', destination: '/login', permanent: true },
      { source: '/auth/signup', destination: '/signup', permanent: true },
      { source: '/profile', destination: '/dashboard/profile', permanent: true },
      { source: '/instructor/courses/new', destination: '/dashboard/courses/create', permanent: true },
    ];
  },
};
module.exports = nextConfig;
