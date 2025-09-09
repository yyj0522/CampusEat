import path from "path";

/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true, 
  output: "export",       

  webpack: (config) => {
    if (!config.resolve) config.resolve = {};
    if (!config.resolve.alias) config.resolve.alias = {};

    config.resolve.alias["components"] = path.resolve("./../../packages/components");
    config.resolve.alias["screens"] = path.resolve("./../../packages/screens");
    config.resolve.alias["services"] = path.resolve("./../../packages/services");
    config.resolve.alias["context"] = path.resolve("./../../packages/context");

    return config;
  },
};

export default nextConfig;
