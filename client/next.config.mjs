/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: false,                  // strict mode double-connects the socket in dev
  experimental: { externalDir: true },     // allow importing ../shared
};
export default nextConfig;
