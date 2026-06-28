/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  // Azure DevOps avatars / images are loaded server-side and proxied,
  // so no remote image patterns are required by default.
};

export default nextConfig;
