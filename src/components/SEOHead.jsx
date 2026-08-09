import { useEffect } from 'react';

/**
 * SEOHead — dynamically updates document <head> for each page.
 * 
 * Props:
 *   title       – page title (appended with " | Printing Ustad")
 *   description – meta description (max ~160 chars)
 *   keywords    – comma-separated keywords string
 *   canonical   – canonical URL path (e.g. "/shop")
 *   ogImage     – Open Graph image URL
 *   ogType      – Open Graph type (default: "website")
 *   schemaData  – optional JSON-LD schema object
 */
const SITE_NAME = 'Printing Ustad';
const BASE_URL = 'https://printingustad.com';
const DEFAULT_OG_IMAGE = '/logo.png';

const SEOHead = ({
  title,
  description,
  keywords,
  canonical,
  ogImage,
  ogType = 'website',
  schemaData,
}) => {
  useEffect(() => {
    // Title
    const fullTitle = title ? `${title} | ${SITE_NAME}` : `${SITE_NAME} | Custom Printing Services Online`;
    document.title = fullTitle;

    // Helper to set/create meta tags
    const setMeta = (attr, attrValue, content) => {
      if (!content) return;
      let el = document.querySelector(`meta[${attr}="${attrValue}"]`);
      if (!el) {
        el = document.createElement('meta');
        el.setAttribute(attr, attrValue);
        document.head.appendChild(el);
      }
      el.setAttribute('content', content);
    };

    // Standard meta
    setMeta('name', 'description', description);
    if (keywords) setMeta('name', 'keywords', keywords);

    // Open Graph
    setMeta('property', 'og:title', fullTitle);
    setMeta('property', 'og:description', description);
    setMeta('property', 'og:type', ogType);
    setMeta('property', 'og:site_name', SITE_NAME);
    setMeta('property', 'og:image', ogImage || DEFAULT_OG_IMAGE);
    if (canonical) setMeta('property', 'og:url', `${BASE_URL}${canonical}`);

    // Twitter Card
    setMeta('name', 'twitter:card', 'summary_large_image');
    setMeta('name', 'twitter:title', fullTitle);
    setMeta('name', 'twitter:description', description);
    setMeta('name', 'twitter:image', ogImage || DEFAULT_OG_IMAGE);

    // Canonical link
    if (canonical) {
      let link = document.querySelector('link[rel="canonical"]');
      if (!link) {
        link = document.createElement('link');
        link.setAttribute('rel', 'canonical');
        document.head.appendChild(link);
      }
      link.setAttribute('href', `${BASE_URL}${canonical}`);
    }

    // JSON-LD Schema
    const schemaId = 'seo-schema-jsonld';
    let existingSchema = document.getElementById(schemaId);
    if (schemaData) {
      if (!existingSchema) {
        existingSchema = document.createElement('script');
        existingSchema.id = schemaId;
        existingSchema.type = 'application/ld+json';
        document.head.appendChild(existingSchema);
      }
      existingSchema.textContent = JSON.stringify(schemaData);
    } else if (existingSchema) {
      existingSchema.remove();
    }
  }, [title, description, keywords, canonical, ogImage, ogType, schemaData]);

  return null; // This component only manages <head>, renders nothing
};

// Pre-built schema generators
export const localBusinessSchema = () => ({
  '@context': 'https://schema.org',
  '@type': 'LocalBusiness',
  name: 'Printing Ustad',
  description: 'India\'s premium custom printing service for T-shirts, mugs, visiting cards, diaries, bottles, corporate gifts and more.',
  url: BASE_URL,
  logo: `${BASE_URL}/logo.png`,
  telephone: '+91-70110-49502',
  email: 'support@printingustad.com',
  address: {
    '@type': 'PostalAddress',
    streetAddress: 'Printing Ustad',
    addressLocality: 'Ghaziabad',
    addressRegion: 'Uttar Pradesh',
    postalCode: '201001',
    addressCountry: 'IN',
  },
  openingHours: 'Mo-Sa 10:00-19:00',
  priceRange: '₹₹',
  sameAs: [
    'https://www.facebook.com/share/1EEf7EGPP7/',
    'https://www.instagram.com/printingustad.official',
  ],
});

export const blogPostSchema = (post) => ({
  '@context': 'https://schema.org',
  '@type': 'BlogPosting',
  headline: post.title,
  description: post.excerpt || post.meta_description,
  image: post.featured_image,
  author: {
    '@type': 'Organization',
    name: post.author || 'Printing Ustad',
  },
  publisher: {
    '@type': 'Organization',
    name: 'Printing Ustad',
    logo: { '@type': 'ImageObject', url: `${BASE_URL}/logo.png` },
  },
  datePublished: post.created_at,
  dateModified: post.updated_at || post.created_at,
  mainEntityOfPage: `${BASE_URL}/blog/${post.slug}`,
});

export const productSchema = (product) => ({
  '@context': 'https://schema.org',
  '@type': 'Product',
  name: product.name,
  description: product.description || product.desc,
  image: product.base_image_url || product.img,
  brand: { '@type': 'Brand', name: 'Printing Ustad' },
  offers: {
    '@type': 'Offer',
    price: product.base_price || product.price,
    priceCurrency: 'INR',
    availability: 'https://schema.org/InStock',
    url: `${BASE_URL}/product/${product.id}`,
  },
});

export default SEOHead;
