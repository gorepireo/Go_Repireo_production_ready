import React from 'react';

interface FAQItem {
  question: string;
  answer: string;
}

interface SchemaDataProps {
  title: string;
  description: string;
  url: string;
  category?: string;
  city?: string;
  minPrice?: number;
  maxPrice?: number;
  faqs?: FAQItem[];
}

export default function SchemaData({
  title,
  description,
  url,
  category = 'Home Services',
  city = 'India',
  minPrice = 199,
  maxPrice = 2499,
  faqs = []
}: SchemaDataProps) {

  const serviceSchema = {
    '@context': 'https://schema.org',
    '@type': 'Service',
    'name': title,
    'serviceType': category,
    'provider': {
      '@type': 'LocalBusiness',
      '@id': 'https://gorepireo.in/#localbusiness',
      'name': 'Go_Repireo',
      'url': 'https://gorepireo.in',
      'telephone': '+91-8679245568'
    },
    'areaServed': {
      '@type': 'City',
      'name': city
    },
    'description': description,
    'offers': {
      '@type': 'Offer',
      'url': url,
      'priceSpecification': {
        '@type': 'PriceSpecification',
        'minPrice': minPrice,
        'maxPrice': maxPrice,
        'priceCurrency': 'INR'
      }
    }
  };

  const faqSchema = faqs.length > 0 ? {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    'mainEntity': faqs.map(faq => ({
      '@type': 'Question',
      'name': faq.question,
      'acceptedAnswer': {
        '@type': 'Answer',
        'text': faq.answer
      }
    }))
  } : null;

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(serviceSchema) }}
      />
      {faqSchema && (
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(faqSchema) }}
        />
      )}
    </>
  );
}
