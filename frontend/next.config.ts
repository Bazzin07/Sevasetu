import type { NextConfig } from "next";

// output: "export" is only needed for the Firebase Hosting static build.
// Running `next dev` without this flag lets dynamic routes work naturally.
// To produce the Firebase static bundle: NEXT_EXPORT=1 npm run build
const nextConfig: NextConfig = {
  ...(process.env.NEXT_EXPORT === "1" ? { output: "export" } : {}),
};

export default nextConfig;
