/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    remotePatterns: [
      { protocol: 'https', hostname: '**' },
      { protocol: 'http', hostname: '**' },
    ],
    unoptimized: true,
  },
  async rewrites() {
    return [
      {
        source: '/uploads/:filename',
        destination: '/api/uploads/:filename',
      },
    ];
  },
};

export default nextConfig;
