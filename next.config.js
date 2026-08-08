/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  /* Powering up for live launch */
  // Prevent bundling of Node.js-only packages; use native runtime modules instead
  serverExternalPackages: ['web-push'],
};

module.exports = nextConfig;
