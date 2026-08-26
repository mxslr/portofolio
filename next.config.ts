import type { NextConfig } from 'next';

/*
  Media under /public is served straight from the origin, which otherwise means
  no caching at all. The filenames are stable, so replacing one of these files
  means a returning visitor can see the old copy for one more request before the
  revalidation lands. Rename the file if that ever matters, the way
  /pdf/pdf.worker.min.mjs would if pdfjs-dist were bumped past its pinned 6.2.108.
*/
const MEDIA_PATHS = [
  '/logos/:path*',
  '/projects/:path*',
  '/sertifikat/:path*',
  '/gallery/:path*',
  '/publications/:path*',
  '/music/:path*',
  '/pdf/:path*',
];

const nextConfig: NextConfig = {
  experimental: {
    /* folds the stylesheet into the HTML so the first paint does not wait on a
       separate render-blocking request */
    inlineCss: true,
  },
  async headers() {
    return [
      {
        source: '/(.*)',
        headers: [
          { key: 'X-Content-Type-Options', value: 'nosniff' },
          { key: 'X-Frame-Options', value: 'SAMEORIGIN' },
          { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
          {
            key: 'Permissions-Policy',
            value: 'camera=(), microphone=(), geolocation=()',
          },
        ],
      },
      ...MEDIA_PATHS.map((source) => ({
        source,
        headers: [
          {
            key: 'Cache-Control',
            value: 'public, max-age=604800, stale-while-revalidate=2592000',
          },
        ],
      })),
    ];
  },
};

export default nextConfig;
