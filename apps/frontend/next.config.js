/** @type {import('next').NextConfig} */
const nextConfig = {
  turbopack: {
    root: "./../..",
  },
  experimental: {
    // This disables the floating DevTools button
    nextDevPanel: false,
  },
};

export default nextConfig;
