import type { NextConfig } from "next";

// Polyfill for URL.canParse for Node.js < 18.17.0
if (!URL.canParse) {
  URL.canParse = function(input: string | URL, base?: string | URL): boolean {
    try {
      new URL(input, base);
      return true;
    } catch {
      return false;
    }
  };
}

const nextConfig: NextConfig = {
  /* config options here */
};

export default nextConfig;
