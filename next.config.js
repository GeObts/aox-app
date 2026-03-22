/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  async redirects() {
    return [
      { source: '/nft', destination: '/marketplace/nft', permanent: true },
      { source: '/defi', destination: '/marketplace/defi', permanent: true },
      { source: '/token', destination: '/marketplace/token', permanent: true },
      { source: '/misc', destination: '/marketplace/misc', permanent: true },
      { source: '/polymarket', destination: '/marketplace/polymarket', permanent: true },
    ];
  },
  async rewrites() {
    return [
      { source: '/skill.md', destination: '/aox.skill.md' },
      { source: '/.well-known/skill.md', destination: '/aox.skill.md' },
      { source: '/.well-known/ai-plugin.json', destination: '/ai-plugin.json' },
    ];
  },
  webpack: (config) => {
    config.resolve.fallback = {
      ...config.resolve.fallback,
      fs: false,
      net: false,
      tls: false,
    };
    return config;
  },
};

module.exports = nextConfig;
