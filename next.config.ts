import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  webpack: (config, { dev, isServer }) => {
    if (dev && !isServer) {
      // Fix for CSS module HMR removeChild error
      // Prevents the error when CSS modules are hot-reloaded
      config.optimization = {
        ...config.optimization,
        removeAvailableModules: false,
        removeEmptyChunks: false,
      };
    }
    return config;
  },
  async rewrites() {
    return [
      {
        source: '/users',
        destination: 'http://localhost:3001/users',
      },
      {
        source: '/users/:path*',
        destination: 'http://localhost:3001/users/:path*',
      },
      {
        source: '/tables',
        destination: 'http://localhost:3001/tables',
      },
      {
        source: '/tables/:path*',
        destination: 'http://localhost:3001/tables/:path*',
      },
      {
        source: '/studentDeclarationForm',
        destination: 'http://localhost:3001/studentDeclarationForm',
      },
      {
        source: '/studentDeclarationForm/:path*',
        destination: 'http://localhost:3001/studentDeclarationForm/:path*',
      },
    ];
  },
};

export default nextConfig;
