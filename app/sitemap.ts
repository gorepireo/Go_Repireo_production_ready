import { MetadataRoute } from 'next';

export default function sitemap(): MetadataRoute.Sitemap {
  const baseUrl = 'https://gorepireo.in';
  const lastContentUpdate = new Date('2026-08-09');

  // Only list canonical public landing pages. Account, dashboard, and
  // order-tracking routes are intentionally excluded because they are noindex.
  const staticPages: MetadataRoute.Sitemap = [
    { url: baseUrl,                        lastModified: lastContentUpdate, changeFrequency: 'weekly',  priority: 1.0 },
    { url: `${baseUrl}/services`,          lastModified: lastContentUpdate, changeFrequency: 'weekly',  priority: 0.9 },
    { url: `${baseUrl}/services/service`,  lastModified: lastContentUpdate, changeFrequency: 'weekly',  priority: 0.9 },
    { url: `${baseUrl}/about`,             lastModified: lastContentUpdate, changeFrequency: 'monthly', priority: 0.6 },
    { url: `${baseUrl}/contact`,           lastModified: lastContentUpdate, changeFrequency: 'monthly', priority: 0.6 },
    { url: `${baseUrl}/privacy`,           lastModified: lastContentUpdate, changeFrequency: 'yearly',  priority: 0.2 },
    { url: `${baseUrl}/terms`,             lastModified: lastContentUpdate, changeFrequency: 'yearly',  priority: 0.2 },
    { url: `${baseUrl}/refund-policy`,     lastModified: lastContentUpdate, changeFrequency: 'yearly',  priority: 0.2 },
  ];

  // ─── Near-Me Pages (high-intent local searches) ──────────────────────
  // These target searches like "plumber near me etawah", "ac repair near me"
  const nearMeServices = [
    'electrician-near-me',
    'plumber-near-me',
    'ac-service-near-me',
    'ac-repair-near-me',
    'washing-machine-repair-near-me',
    'refrigerator-repair-near-me',
    'bathroom-cleaning-near-me',
    'sofa-cleaning-near-me',
    'carpenter-near-me',
    'painter-near-me',
    'ro-repair-near-me',
    'geyser-repair-near-me',
    'cctv-installation-near-me',
    'pest-control-near-me',
    'deep-cleaning-near-me',
    'microwave-repair-near-me',
    'tv-repair-near-me',
    'chimney-repair-near-me',
  ];

  const nearMePages: MetadataRoute.Sitemap = nearMeServices.map(service => ({
    url: `${baseUrl}/near-me/${service}`,
    lastModified: lastContentUpdate,
    changeFrequency: 'weekly',
    priority: 0.95,
  }));

  // ─── Etawah Service + Category Pages ─────────────────────────────────
  // These target searches like "best plumber in etawah", "ac repair etawah"
  // Add more cities here when expanding: ['etawah', 'lucknow', ...]
  const activeCities = ['etawah'];
  const categories = [
    'plumbing',
    'electrical',
    'ac-repair',
    'cleaning',
    'appliance',
    'carpentry',
    'painting',
    'pest-control',
    'cctv-installation',
    'ro-service',
    'geyser-repair',
    'deep-cleaning',
  ];

  const cityServicePages: MetadataRoute.Sitemap = [];
  categories.forEach(cat => {
    activeCities.forEach(city => {
      cityServicePages.push({
        url: `${baseUrl}/services/${cat}/${city}`,
        lastModified: lastContentUpdate,
        changeFrequency: 'weekly',
        priority: 0.9,
      });
    });
  });

  return [...staticPages, ...nearMePages, ...cityServicePages];
}
