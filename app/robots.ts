import { MetadataRoute } from 'next';

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [{ userAgent: '*', allow: '/', disallow: ['/api/'] }],
    sitemap: 'https://gorepireo.in/sitemap.xml',
    host: 'https://gorepireo.in',
  };
}
