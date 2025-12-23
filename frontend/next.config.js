/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  // Clear webpack cache on build issues
  webpack: (config, { isServer }) => {
    // Ensure proper module resolution
    config.resolve.extensions = ['.tsx', '.ts', '.jsx', '.js', '.json'];
    return config;
  },
}

module.exports = nextConfig
