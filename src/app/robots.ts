import { MetadataRoute } from 'next';

export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: '*',
      allow: [
        '/',
        '/news',
        '/country',
        '/sports',
        '/weather',
        '/business',
        '/technology',
        '/play-earth',
        '/games',
        '/daily',
        '/challenges',
        '/challenge',
        '/trending',
        '/explore',
        '/category/*',
        '/article/*',
        '/about',
        '/contact',
        '/privacy',
        '/terms',
      ],
      disallow: [
        '/api/',
        '/admin/',
        '/debug/',
        '/private/',
      ],
    },
    sitemap: 'https://www.mooearth.live/sitemap.xml',
  };
}
