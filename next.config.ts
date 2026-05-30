import type {NextConfig} from "next";

const nextConfig: NextConfig = {
  // Standalone breaks Amplify WEB_COMPUTE. Not required on Vercel either.
  serverExternalPackages: ['sequelize'],
    outputFileTracingIncludes: {
        '*': ['./certs/**/*']
    },
    /**
     * Legacy URLs from before magazine issues lived under `publications/issues/…`.
     */
    async redirects() {
        return [
            {
                source: '/logged/pages/production/publications/subpage',
                destination: '/logged/pages/production/publications/magazines/subpage',
                permanent: false,
            },
            {
                source: '/logged/pages/production/publications/flatplans/:path*',
                destination: '/logged/pages/production/publications/magazines/flatplans/:path*',
                permanent: false,
            },
            {
                source: '/logged/pages/production/publications/published/:path*',
                destination: '/logged/pages/production/publications/magazines/published/:path*',
                permanent: false,
            },
            {
                source: '/logged/pages/production/publications/issues/subpage',
                destination: '/logged/pages/production/publications/magazines/subpage',
                permanent: false,
            },
            {
                source: '/logged/pages/production/publications/issues/flatplans/:path*',
                destination: '/logged/pages/production/publications/magazines/flatplans/:path*',
                permanent: false,
            },
            {
                source: '/logged/pages/production/publications/issues/published/:path*',
                destination: '/logged/pages/production/publications/magazines/published/:path*',
                permanent: false,
            },
            {
                source: '/logged/pages/production/publications/issues/:pubId/manager/article_builder/:path*',
                destination: '/logged/pages/production/publications/issues/:pubId/article_builder/:path*',
                permanent: false,
            },
            {
                source: '/logged/pages/production/publications/:pubId(publication_[^/]+)/manager/article_builder/:path*',
                destination: '/logged/pages/production/publications/issues/:pubId/article_builder/:path*',
                permanent: false,
            },
            {
                source: '/logged/pages/production/publications/issues/:pubId/slots/:slotId/article_editor/:path*',
                destination: '/logged/pages/production/publications/issues/:pubId/slots/:slotId',
                permanent: false,
            },
            {
                source: '/logged/pages/production/publications/:pubId(publication_[^/]+)/slots/:slotId/article_editor/:path*',
                destination: '/logged/pages/production/publications/issues/:pubId/slots/:slotId',
                permanent: false,
            },
            {
                source: '/logged/pages/production/publications/:pubId(publication_[^/]+)/slots/:path*',
                destination: '/logged/pages/production/publications/issues/:pubId/slots/:path*',
                permanent: false,
            },
            {
                source: '/logged/pages/production/publications/:pubId(publication_[^/]+)',
                destination: '/logged/pages/production/publications/issues/:pubId',
                permanent: false,
            },
        ];
    },
    // Optimizations for Vercel
    compress: true,
    poweredByHeader: false,
    reactStrictMode: true,
    // Optimize images
    images: {
        formats: ['image/avif', 'image/webp'],
        minimumCacheTTL: 60,
        remotePatterns: [
            {
                protocol: 'https',
                hostname: 'source.unsplash.com',
            },
        ],
    },
    // Experimental features for better performance
    // optimizeCss requires 'critters' package; disable if not installed
    experimental: {
        optimizeCss: false,
        externalDir: true,
    },
    // Headers for caching
    async headers() {
        return [
            {
                source: '/:path*',
                headers: [
                    {
                        key: 'X-DNS-Prefetch-Control',
                        value: 'on'
                    },
                    {
                        key: 'X-Frame-Options',
                        value: 'SAMEORIGIN'
                    },
                    {
                        key: 'X-Content-Type-Options',
                        value: 'nosniff'
                    },
                ],
            },
            {
                source: '/_next/static/:path*',
                headers: [
                    {
                        key: 'Cache-Control',
                        value: 'public, max-age=31536000, immutable',
                    },
                ],
            },
        ];
    },
};

export default nextConfig;
