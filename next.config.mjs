/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  webpack: (config) => {
    config.externals.push("pino-pretty", "lokijs", "encoding");

    // wagmi's connectors barrel pulls in the Coinbase/Base account SDK, which
    // has optional peer deps (@x402/*) we never use (Ace only uses the injected
    // connector). Stub these out so the production build doesn't fail on them.
    config.resolve = config.resolve || {};
    config.resolve.alias = {
      ...(config.resolve.alias || {}),
      "@x402/evm/upto/client": false,
      "@x402/evm/exact/client": false,
      "@x402/core/client": false,
      "@x402/svm/exact/client": false,
      "@x402/evm": false,
    };

    return config;
  },
};

export default nextConfig;
