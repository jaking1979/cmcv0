/** @type {import('next').NextConfig} */
const nextConfig = {
  eslint: {
    // Don’t fail the Vercel/CI build on lint errors
    ignoreDuringBuilds: true,
  },
  // Keep TS type-checking strict in builds (safer)
  typescript: {
    ignoreBuildErrors: false,
  },
};
module.exports = nextConfig;
