import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  reactStrictMode: true,
  // L'application ne possède aucune route API propre : tout passe par le
  // backend Spring (port 8080). NEXT_PUBLIC_API_BASE_URL cible ce backend ;
  // en production, définir la variable d'environnement du même nom.
  async rewrites() {
    const base = process.env.NEXT_PUBLIC_API_BASE_URL ?? "http://localhost:8080";
    return [{ source: "/backend-api/:path*", destination: `${base}/api/:path*` }];
  },
};

export default nextConfig;
