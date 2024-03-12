/** @type {import('next').NextConfig} */
const nextConfig = {
  experimental: {
    serverComponentsExternalPackages: ["db"],
  },
  output: "standalone",
};

export default nextConfig;
