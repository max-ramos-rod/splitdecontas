/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,

  experimental: {
    externalDir: true,
    esmExternals: "loose",
  },

  transpilePackages: [
    "@solana/web3.js",
    "@solana/pay",
    "@coral-xyz/anchor",
    "@anchor-lang/core",
    "rpc-websockets",
    "uuid",
  ],

  webpack: (config) => {
    config.resolve.fallback = {
      ...config.resolve.fallback,
      fs: false,
      os: false,
      path: false,
    };

    return config;
  },
};

module.exports = nextConfig;