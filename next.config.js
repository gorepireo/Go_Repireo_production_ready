/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  /* Powering up for live launch */
  // Prevent bundling of Node.js-only packages; use native runtime modules instead
  serverExternalPackages: ['web-push'],
  async headers() {
    return [
      {
        source: '/(admin|dashboard|login|register|forgot-password|track|chat)(/:path*)?',
        headers: [{ key: 'X-Robots-Tag', value: 'noindex, nofollow, noarchive' }],
      },
      {
        source: '/api/:path*',
        headers: [{ key: 'X-Robots-Tag', value: 'noindex, nofollow, noarchive' }],
      },
    ];
  },
};

module.exports = nextConfig;
