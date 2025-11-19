/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'campuseat-assets.s3.ap-northeast-2.amazonaws.com',
        port: '',
        pathname: '/**', 
      },
    ],
  },
};

export default nextConfig;