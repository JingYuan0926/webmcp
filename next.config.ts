import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Prevent Next.js from generating agent-specific compatibility files.
  agentRules: false,
};

export default nextConfig;
