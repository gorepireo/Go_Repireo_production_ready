import { MetadataRoute } from 'next';

export default function sitemap(): MetadataRoute.Sitemap {
  const baseUrl = 'https://gorepireo.in';

  const staticPages: MetadataRoute.Sitemap = [
    { url: baseUrl, lastModified: new Date(), changeFrequency: 'daily', priority: 1.0 },
    { url: `${baseUrl}/about`, lastModified: new Date(), changeFrequency: 'monthly', priority: 1.0 },
    { url: `${baseUrl}/services`, lastModified: new Date(), changeFrequency: 'weekly', priority: 0.95 },
    { url: `${baseUrl}/services/service`, lastModified: new Date(), changeFrequency: 'daily', priority: 0.9 },
    { url: `${baseUrl}/services/installation`, lastModified: new Date(), changeFrequency: 'weekly', priority: 0.8 },
    { url: `${baseUrl}/shop`, lastModified: new Date(), changeFrequency: 'daily', priority: 0.8 },
    { url: `${baseUrl}/contact`, lastModified: new Date(), changeFrequency: 'monthly', priority: 0.7 },
    { url: `${baseUrl}/privacy`, lastModified: new Date(), changeFrequency: 'monthly', priority: 0.5 },
    { url: `${baseUrl}/terms`, lastModified: new Date(), changeFrequency: 'monthly', priority: 0.5 },
    { url: `${baseUrl}/refund-policy`, lastModified: new Date(), changeFrequency: 'monthly', priority: 0.5 },
    { url: `${baseUrl}/login`, lastModified: new Date(), changeFrequency: 'monthly', priority: 0.5 },
    { url: `${baseUrl}/register`, lastModified: new Date(), changeFrequency: 'monthly', priority: 0.6 },
  ];

  const nearMeServices = [
    'electrician-near-me',
    'plumber-near-me',
    'ac-service-near-me',
    'washing-machine-repair-near-me',
    'bathroom-cleaning-near-me',
    'sofa-cleaning-near-me',
    'carpenter-near-me'
  ];

  const nearMePages: MetadataRoute.Sitemap = nearMeServices.map(service => ({
    url: `${baseUrl}/near-me/${service}`,
    lastModified: new Date(),
    changeFrequency: 'weekly',
    priority: 0.95
  }));

  const categories = ['plumbing', 'electrical', 'ac-repair', 'cleaning', 'appliances', 'carpentry'];
  const cities = ['etawah', 'delhi', 'mumbai', 'bangalore', 'hyderabad', 'pune', 'chennai', 'kolkata', 'lucknow', 'jaipur'];

  const cityPages: MetadataRoute.Sitemap = [];
  categories.forEach(cat => {
    cities.forEach(city => {
      cityPages.push({
        url: `${baseUrl}/services/${cat}/${city}`,
        lastModified: new Date(),
        changeFrequency: 'weekly',
        priority: 0.85
      });
    });
  });

  return [...staticPages, ...nearMePages, ...cityPages];
}
