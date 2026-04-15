/** @type {import('next').NextConfig} */
const apiOrigin = process.env.LMS_API_ORIGIN ?? "http://127.0.0.1:8787";

const nextConfig = {
  transpilePackages: ["@conductor/contracts", "@conductor/ui"],
  async rewrites() {
    return [
      {
        source: "/api/v1/:path*",
        destination: `${apiOrigin}/api/v1/:path*`
      }
    ];
  }
};

export default nextConfig;
