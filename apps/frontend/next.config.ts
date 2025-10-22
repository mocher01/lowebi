import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  output: 'standalone',
  async rewrites() {
    return [
      // Direct routes (for wizard provider API calls)
      {
        source: '/public/:path*',
        destination: `${process.env.NEXT_PUBLIC_API_URL || 'http://logen-backend:7600'}/public/:path*`,
      },
      {
        source: '/customer/:path*',
        destination: `${process.env.NEXT_PUBLIC_API_URL || 'http://logen-backend:7600'}/customer/:path*`,
      },
      // Legacy API routes (for components that still use /api/ prefix)
      {
        source: '/api/public/:path*',
        destination: `${process.env.NEXT_PUBLIC_API_URL || 'http://logen-backend:7600'}/public/:path*`,
      },
      {
        source: '/api/customer/:path*',
        destination: `${process.env.NEXT_PUBLIC_API_URL || 'http://logen-backend:7600'}/customer/:path*`,
      },
      {
        source: '/api/:path*',
        destination: `${process.env.NEXT_PUBLIC_API_URL || 'http://logen-backend:7600'}/api/:path*`,
      },
    ];
  },
};

export default nextConfig;
