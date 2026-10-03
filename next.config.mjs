/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  env: {
    DATABASE_URL: process.env.DATABASE_URL || 'file:./dev.db',
    JWT_SECRET: process.env.JWT_SECRET || 'super-secret-ncc-cadet-portal-jwt-token-key-2026',
    NEXT_PUBLIC_APP_NAME: 'NCC Examination & Question Bank Portal',
  },
  experimental: {
    outputFileTracingIncludes: {
      '/**': ['./prisma/**'],
    },
  },
};

export default nextConfig;
