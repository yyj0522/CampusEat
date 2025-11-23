/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'objectstorage.ap-chuncheon-1.oraclecloud.com',
        port: '',
        pathname: '/**', 
      },
    ],
  },
};

export default nextConfig;