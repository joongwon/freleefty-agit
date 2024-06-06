/** @type {import('next').NextConfig} */
const nextConfig = {
  experimental: {
    serverComponentsExternalPackages: ["db"],
  },
  output: "standalone",
  trailingSlash: true,
};

export default nextConfig;
