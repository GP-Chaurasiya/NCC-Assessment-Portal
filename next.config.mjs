/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  env: {
    JWT_SECRET: process.env.JWT_SECRET || 'super-secret-ncc-cadet-portal-jwt-token-key-2026',
    NEXT_PUBLIC_APP_NAME: 'NCC Examination & Question Bank Portal',
  },
  experimental: {
    serverComponentsExternalPackages: ['pdf-parse', 'pdfjs-dist', 'mammoth'],
    outputFileTracingIncludes: {
      '/**': ['./prisma/**/*', './dev.db'],
    },
  },
};

export default nextConfig;
