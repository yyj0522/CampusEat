const path = require("path");
const nextConfig = {
  webpack: (config) => {
    if (!config.resolve) config.resolve = {};
    if (!config.resolve.alias) config.resolve.alias = {};

    config.resolve.alias["components"] = path.resolve(__dirname, "../../packages/components");
    config.resolve.alias["screens"] = path.resolve(__dirname, "../../packages/screens");
    config.resolve.alias["services"] = path.resolve(__dirname, "../../packages/services");
    config.resolve.alias["context"] = path.resolve(__dirname, "../../packages/context");

    return config;
  },
};

module.exports = nextConfig;
