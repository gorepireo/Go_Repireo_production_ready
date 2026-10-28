import { MetadataRoute } from 'next';

export default function sitemap(): MetadataRoute.Sitemap {
  const baseUrl = 'https://gorepireo.in';
  const lastContentUpdate = new Date();

  // Static canonical public pages
  const staticPages: MetadataRoute.Sitemap = [
    { url: baseUrl,                              lastModified: lastContentUpdate, changeFrequency: 'daily',   priority: 1.0 },
    { url: `${baseUrl}/services`,                lastModified: lastContentUpdate, changeFrequency: 'daily',   priority: 0.95 },
    { url: `${baseUrl}/services/service`,        lastModified: lastContentUpdate, changeFrequency: 'daily',   priority: 0.95 },
    { url: `${baseUrl}/services/installation`,   lastModified: lastContentUpdate, changeFrequency: 'weekly',  priority: 0.9 },
    { url: `${baseUrl}/about`,                   lastModified: lastContentUpdate, changeFrequency: 'monthly', priority: 0.6 },
    { url: `${baseUrl}/contact`,                 lastModified: lastContentUpdate, changeFrequency: 'monthly', priority: 0.6 },
    { url: `${baseUrl}/privacy`,                 lastModified: lastContentUpdate, changeFrequency: 'yearly',  priority: 0.3 },
    { url: `${baseUrl}/terms`,                   lastModified: lastContentUpdate, changeFrequency: 'yearly',  priority: 0.3 },
    { url: `${baseUrl}/refund-policy`,           lastModified: lastContentUpdate, changeFrequency: 'yearly',  priority: 0.3 },
  ];

  // Near-Me Pages (high-intent local searches)
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
    priority: 0.9,
  }));

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

  // Category Hub Pages (/services/plumbing, etc.)
  const categoryPages: MetadataRoute.Sitemap = categories.map(cat => ({
    url: `${baseUrl}/services/${cat}`,
    lastModified: lastContentUpdate,
    changeFrequency: 'weekly',
    priority: 0.9,
  }));

  // Etawah Service + Category Pages
  const activeCities = ['etawah'];
  const cityServicePages: MetadataRoute.Sitemap = [];
  categories.forEach(cat => {
    activeCities.forEach(city => {
      cityServicePages.push({
        url: `${baseUrl}/services/${cat}/${city}`,
        lastModified: lastContentUpdate,
        changeFrequency: 'weekly',
        priority: 0.85,
      });
    });
  });

  return [...staticPages, ...categoryPages, ...nearMePages, ...cityServicePages];
}
