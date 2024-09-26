/** @type {import('next').NextConfig} */
const nextConfig = {
    images: {
      remotePatterns: [
        {
          protocol: 'https',
          hostname: 'next-cozy.s3.us-east-2.amazonaws.com',
          pathname: '/**', // Allow all paths under this hostname
        },
      ],
    },
  };
  
  export default nextConfig;
