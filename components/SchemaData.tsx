import React from 'react';

interface FAQItem {
  question: string;
  answer: string;
}

interface SchemaDataProps {
  type?: 'LocalBusiness' | 'Service' | 'FAQPage';
  title: string;
  description: string;
  url: string;
  image?: string;
  category?: string;
  city?: string;
  ratingValue?: number;
  reviewCount?: number;
  minPrice?: number;
  maxPrice?: number;
  faqs?: FAQItem[];
}

export default function SchemaData({
  type = 'Service',
  title,
  description,
  url,
  image = 'https://gorepireo.in/logo.png',
  category = 'Home Services',
  city = 'India',
  ratingValue = 4.9,
  reviewCount = 1250,
  minPrice = 199,
  maxPrice = 2499,
  faqs = []
}: SchemaDataProps) {

  // LocalBusiness & Service Schema
  const businessSchema = {
    '@context': 'https://schema.org',
    '@type': 'LocalBusiness',
    'name': `Go_Repireo - ${title}`,
    'image': image,
    '@id': url,
    'url': url,
    'telephone': '+91-8679245568',
    'priceRange': '₹₹',
    'address': {
      '@type': 'PostalAddress',
      'addressLocality': city,
      'addressCountry': 'IN'
    },
    'geo': {
      '@type': 'GeoCoordinates',
      'latitude': '26.7606',
      'longitude': '79.0300'
    },
    'openingHoursSpecification': {
      '@type': 'OpeningHoursSpecification',
      'dayOfWeek': [
        'Monday',
        'Tuesday',
        'Wednesday',
        'Thursday',
        'Friday',
        'Saturday',
        'Sunday'
      ],
      'opens': '00:00',
      'closes': '23:59'
    },
    'aggregateRating': {
      '@type': 'AggregateRating',
      'ratingValue': ratingValue.toString(),
      'reviewCount': reviewCount.toString(),
      'bestRating': '5',
      'worstRating': '1'
    }
  };

  const serviceSchema = {
    '@context': 'https://schema.org',
    '@type': 'Service',
    'name': title,
    'serviceType': category,
    'provider': {
      '@type': 'LocalBusiness',
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
      '@type': 'AggregateOffer',
      'priceCurrency': 'INR',
      'lowPrice': minPrice.toString(),
      'highPrice': maxPrice.toString(),
      'offerCount': '50+'
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
        dangerouslySetInnerHTML={{ __html: JSON.stringify(businessSchema) }}
      />
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
