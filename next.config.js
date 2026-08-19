/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  images: {
    unoptimized: true,
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'api.mainnet.shelby.xyz',
      },
      {
        protocol: 'https',
        hostname: 'api.testnet.shelby.xyz',
      },
      {
        protocol: 'https',
        hostname: '*.shelby.xyz',
      },
    ],
  },
  webpack: (config) => {
    config.externals = [...(config.externals || []), 'canvas', 'jsdom'];
    return config;
  },
};

module.exports = nextConfig;
