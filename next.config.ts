import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Không bundle các package server nặng/native vào route handler — để Node tự require.
  serverExternalPackages: ["mongoose", "bcryptjs", "@aws-sdk/client-s3", "@aws-sdk/s3-request-presigner"],
  images: {
    // Ưu tiên định dạng hiện đại khi next/image tối ưu ảnh -> nhẹ hơn, LCP/SEO tốt hơn.
    formats: ["image/avif", "image/webp"],
    remotePatterns: [
      {
        protocol: "https",
        hostname: "*.r2.dev",
      },
      {
        protocol: "https",
        hostname: "picsum.photos",
      },
      {
        protocol: "https",
        hostname: "github.com",
      },
      {
        protocol: "https",
        hostname: "*.ufs.sh",
      },
      {
        protocol: "https",
        hostname: "utfs.io",
      },
      {
        protocol: "https",
        hostname: "cdn-icons-png.flaticon.com",
      },
      {
        protocol: "https",
        hostname: "*.flaticon.com",
      },
    ],
  },
};

export default nextConfig;
