import type { NextConfig } from 'next';

const NEWS_IMAGE_HOSTS = [
  'thuvienphapluat.vn',
  'cdn.thuvienphapluat.vn',
  'baochinhphu.vn',
  'media.baochinhphu.vn',
  'image.baochinhphu.vn',
  'moj.gov.vn',
  'tapchitoaan.vn',
  'images.tapchitoaan.vn',
  'luatvietnam.vn',
  'image.luatvietnam.vn',
  'cdn.luatvietnam.vn',
];

const config: NextConfig = {
  reactStrictMode: true,
  typedRoutes: true,
  transpilePackages: ['@laws/shared'],
  images: {
    remotePatterns: NEWS_IMAGE_HOSTS.flatMap((hostname) => [
      { protocol: 'https' as const, hostname },
      { protocol: 'https' as const, hostname: `www.${hostname}` },
    ]),
  },
};

export default config;
