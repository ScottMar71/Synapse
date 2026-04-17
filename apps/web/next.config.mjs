/** @type {import('next').NextConfig} */
function resolveLmsApiOrigin() {
  const fromEnv = process.env.LMS_API_ORIGIN?.trim();
  if (fromEnv) {
    return fromEnv;
  }
  // `rewrites()` is evaluated at build time; defaulting to localhost on Vercel would send
  // `/api/v1/*` traffic nowhere in production.
  if (process.env.VERCEL === "1") {
    throw new Error(
      "LMS_API_ORIGIN must be set when building on Vercel (for example https://your-api.vercel.app). " +
        "Add it to the web project Environment Variables for Production and Preview so it is available at build time."
    );
  }
  return "http://127.0.0.1:8787";
}

const apiOrigin = resolveLmsApiOrigin();

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
