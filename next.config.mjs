/** @type {import('next').NextConfig} */
function resolveAppUrl() {
  const configured = process.env.NEXTAUTH_URL?.trim();
  if (configured) return configured.replace(/\/$/, "");

  const cf =
    process.env.CF_PAGES_URL?.trim() ||
    process.env.CLOUDFLARE_URL?.trim() ||
    process.env.WORKER_URL?.trim();
  if (cf) return cf.startsWith("http") ? cf.replace(/\/$/, "") : `https://${cf}`;

  return "http://localhost:3000";
}

const nextConfig = {
  env: {
    NEXTAUTH_URL: resolveAppUrl(),
  },
  experimental: {
    serverActions: {
      bodySizeLimit: "2mb",
    },
  },
};

export default nextConfig;

import { initOpenNextCloudflareForDev } from "@opennextjs/cloudflare";
initOpenNextCloudflareForDev();
