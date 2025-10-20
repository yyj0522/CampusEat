/** @type {import('next').NextConfig} */
const nextConfig = {
 images: {
  remotePatterns: [
   {
    protocol: 'https',
    hostname: 'campuseat-image-storage-20251017.s3.ap-northeast-2.amazonaws.com',
    port: '',
    pathname: '/reviews/**', 
   },
   {
    protocol: 'https',
    hostname: 'campuseat-image-storage-20251017.s3.ap-northeast-2.amazonaws.com',
    port: '',
    pathname: '/posts/**', 
   },
   {
    protocol: 'https',
    hostname: 'campuseat-image-storage-20251017.s3.ap-northeast-2.amazonaws.com',
    port: '',
    pathname: '/inquiries/**', 
   },
  ],
 },
};

export default nextConfig;
