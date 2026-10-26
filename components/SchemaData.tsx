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
  ratingValue?: number;
  reviewCount?: number;
  faqs?: FAQItem[];
}

export default function SchemaData({
  title,
  description,
  url,
  category = 'Home Services',
  city = 'Etawah',
  minPrice = 199,
  maxPrice = 2499,
  ratingValue = 4.8,
  reviewCount = 2450,
  faqs = []
}: SchemaDataProps) {

  const serviceSchema = {
    '@context': 'https://schema.org',
    '@type': 'Service',
    '@id': `${url}#service`,
    'name': title,
    'serviceType': category,
    'provider': {
      '@type': 'LocalBusiness',
      '@id': 'https://gorepireo.in/#localbusiness',
      'name': 'Go_Repireo',
      'url': 'https://gorepireo.in',
      'telephone': '+91-8679245568',
      'image': 'https://gorepireo.in/icon.png',
      'priceRange': '₹99 - ₹4999',
      'address': {
        '@type': 'PostalAddress',
        'addressLocality': city,
        'addressRegion': 'Uttar Pradesh',
        'addressCountry': 'IN'
      }
    },
    'areaServed': {
      '@type': 'City',
      'name': city,
      'addressRegion': 'Uttar Pradesh',
      'addressCountry': 'IN'
    },
    'description': description,
    'aggregateRating': {
      '@type': 'AggregateRating',
      'ratingValue': ratingValue.toFixed(1),
      'reviewCount': String(reviewCount),
      'bestRating': '5',
      'worstRating': '1'
    },
    'offers': {
      '@type': 'AggregateOffer',
      'url': url,
      'priceCurrency': 'INR',
      'lowPrice': minPrice,
      'highPrice': maxPrice,
      'offerCount': '12'
    }
  };

  const breadcrumbSchema = {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    'itemListElement': [
      {
        '@type': 'ListItem',
        'position': 1,
        'name': 'Home',
        'item': 'https://gorepireo.in'
      },
      {
        '@type': 'ListItem',
        'position': 2,
        'name': 'Services',
        'item': 'https://gorepireo.in/services'
      },
      {
        '@type': 'ListItem',
        'position': 3,
        'name': title,
        'item': url
      }
    ]
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
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbSchema) }}
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
