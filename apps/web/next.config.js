import path from "path";
import { fileURLToPath } from "url";

// ES 모듈 환경에서 __dirname 대체
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  output: "standalone", // 빌드 결과를 독립 실행형으로
  images: {
    unoptimized: true, // 이미지 최적화 비활성화
  },

  webpack: (config) => {
    if (!config.resolve) config.resolve = {};
    if (!config.resolve.alias) config.resolve.alias = {};

    // 경로 별칭 설정
    config.resolve.alias["components"] = path.resolve(__dirname, "./../../packages/components");
    config.resolve.alias["screens"] = path.resolve(__dirname, "./../../packages/screens");
    config.resolve.alias["services"] = path.resolve(__dirname, "./../../packages/services");
    config.resolve.alias["context"] = path.resolve(__dirname, "./../../packages/context");

    return config;
  },
};

export default nextConfig;
