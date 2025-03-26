/** @type {import('next').NextConfig} */

const config = {
  experimental: {
    serverActions: {
      bodySizeLimit: '10mb',  // Increase the limit to 3MB
    },
  },
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "ok4static.oktacdn.com",
        port: '',
        pathname: "/fs/bco/1/fs012r07i1rX4ZtdW1t8",
      }
    ]
  },
  eslint: {
    // Warning: This allows production builds to successfully complete even if
    // your project has ESLint errors.
    ignoreDuringBuilds: true,
  },
};

export default config;
