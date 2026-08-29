/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  webpack: (config, { isServer }) => {
    config.externals.push("pino-pretty", "lokijs", "encoding");

    if (isServer) {
      // Disable server splitChunks to avoid Windows scoped @wagmi vendor-chunk filename issue
      if (config.optimization) {
        config.optimization.splitChunks = false;
      }
    }

    config.resolve = config.resolve || {};
    config.resolve.alias = {
      ...(config.resolve.alias || {}),
      "@x402/evm/upto/client": false,
      "@x402/evm/exact/client": false,
      "@x402/core/client": false,
      "@x402/svm/exact/client": false,
      "@x402/evm": false,
      "@react-native-async-storage/async-storage": false,
    };

    return config;
  },
};

export default nextConfig;
