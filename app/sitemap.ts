import { MetadataRoute } from 'next';

export default function sitemap(): MetadataRoute.Sitemap {
  const baseUrl = 'https://gorepireo.in';

  // ─── Core Static Pages ───────────────────────────────────────────────
  const staticPages: MetadataRoute.Sitemap = [
    { url: baseUrl,                               lastModified: new Date(), changeFrequency: 'daily',   priority: 1.0 },
    { url: `${baseUrl}/about`,                    lastModified: new Date(), changeFrequency: 'monthly', priority: 1.0 },
    { url: `${baseUrl}/services`,                 lastModified: new Date(), changeFrequency: 'weekly',  priority: 0.95 },
    { url: `${baseUrl}/services/service`,         lastModified: new Date(), changeFrequency: 'daily',   priority: 0.9  },
    { url: `${baseUrl}/services/installation`,    lastModified: new Date(), changeFrequency: 'weekly',  priority: 0.85 },
    { url: `${baseUrl}/shop`,                     lastModified: new Date(), changeFrequency: 'daily',   priority: 0.8  },
    { url: `${baseUrl}/contact`,                  lastModified: new Date(), changeFrequency: 'monthly', priority: 0.7  },
    { url: `${baseUrl}/track`,                    lastModified: new Date(), changeFrequency: 'monthly', priority: 0.6  },
    { url: `${baseUrl}/login`,                    lastModified: new Date(), changeFrequency: 'monthly', priority: 0.5  },
    { url: `${baseUrl}/register`,                 lastModified: new Date(), changeFrequency: 'monthly', priority: 0.6  },
    { url: `${baseUrl}/privacy`,                  lastModified: new Date(), changeFrequency: 'monthly', priority: 0.4  },
    { url: `${baseUrl}/terms`,                    lastModified: new Date(), changeFrequency: 'monthly', priority: 0.4  },
    { url: `${baseUrl}/refund-policy`,            lastModified: new Date(), changeFrequency: 'monthly', priority: 0.4  },
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
    lastModified: new Date(),
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
    'appliances',
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
        lastModified: new Date(),
        changeFrequency: 'weekly',
        priority: 0.9,
      });
    });
  });

  return [...staticPages, ...nearMePages, ...cityServicePages];
}
