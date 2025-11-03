/** @type {import('next').NextConfig} */
const nextConfig = {
  serverExternalPackages: ['@neondatabase/serverless'],
  experimental: {
    // Reduce Fast Refresh sensitivity
    optimizePackageImports: ['lucide-react'],
  },
  // Add empty turbopack config to silence warnings
  turbopack: {},
  // Improve development stability
  webpack: (config, { dev }) => {
    if (dev) {
      config.watchOptions = {
        poll: 1000,
        aggregateTimeout: 300,
      }
    }
    return config
  }
}

module.exports = nextConfig