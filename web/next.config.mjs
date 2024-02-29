/** @type {import('next').NextConfig} */
const nextConfig = {
  experimental: {
    serverComponentsExternalPackages: ["db"],
    typedRoutes: true,
  },
};

export default nextConfig;
