/** @type {import('next').NextConfig} */
const securityHeaders = [
  {
    key: 'X-DNS-Prefetch-Control',
    value: 'on',
  },
  {
    key: 'Strict-Transport-Security',
    value: 'max-age=63072000; includeSubDomains; preload',
  },
  {
    key: 'X-Content-Type-Options',
    value: 'nosniff',
  },
  {
    key: 'X-Frame-Options',
    value: 'SAMEORIGIN',
  },
  {
    key: 'X-XSS-Protection',
    value: '1; mode=block',
  },
  {
    key: 'Referrer-Policy',
    value: 'origin-when-cross-origin',
  },
  {
    key: 'Permissions-Policy',
    value: 'camera=(self), microphone=(self), geolocation=()',
  },
]

const nextConfig = {
  poweredByHeader: false,
  compress: true,
  reactStrictMode: true,
  output: 'standalone',
  
  async headers() {
    return [
      {
        source: '/:path*',
        headers: securityHeaders,
      },
    ]
  },

  async rewrites() {
    return []
  },

  images: {
    formats: ['image/avif', 'image/webp'],
    domains: [
      'localhost',
      'via.placeholder.com',
      'lh3.googleusercontent.com',
      'avatars.githubusercontent.com',
    ],
    minimumCacheTTL: 60,
  },

  experimental: {
    optimizePackageImports: ['lucide-react', 'framer-motion'],
  },
}

export default nextConfig
