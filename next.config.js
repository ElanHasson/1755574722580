/** @type {import('next').NextConfig} */
const nextConfig = {
  output: 'export',
  images: { unoptimized: true },
  cacheDirectories: [".next/cache"]
};

module.exports = nextConfig;