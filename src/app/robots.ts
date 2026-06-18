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
        '/fifa',
        '/play-earth',
        '/category/*',
        '/article/*',
      ],
      disallow: [
        '/api/',
        '/debug/',
        '/private/',
      ],
    },
    sitemap: 'https://www.mooearth.live/sitemap.xml',
  };
}
