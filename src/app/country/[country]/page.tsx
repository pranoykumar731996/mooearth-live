import { Metadata } from 'next';
import HomePage from '../../page';

interface CountryPageProps {
  params: Promise<{
    country: string;
  }>;
}

export async function generateMetadata({ params }: CountryPageProps): Promise<Metadata> {
  const { country: rawCountry } = await params;
  const decoded = decodeURIComponent(rawCountry);
  const capitalized = decoded.charAt(0).toUpperCase() + decoded.slice(1);
  const title = `${capitalized} News, Sports, Weather & World Cup Updates | MooEarth Live`;
  const description = `Explore ${capitalized}'s latest news, sports, weather, FIFA World Cup updates, and country insights on MooEarth Live's interactive 3D emotional globe.`;

  return {
    title,
    description,
    alternates: {
      canonical: `/country/${rawCountry.toLowerCase()}`,
    },
    openGraph: {
      title,
      description,
      url: `https://www.mooearth.live/country/${rawCountry.toLowerCase()}`,
      type: 'website',
    },
    twitter: {
      card: 'summary_large_image',
      title,
      description,
    }
  };
}

export default async function CountryPage({ params }: CountryPageProps) {
  const { country: rawCountry } = await params;
  const decoded = decodeURIComponent(rawCountry);
  const capitalized = decoded.charAt(0).toUpperCase() + decoded.slice(1);

  // Capital/Population lookup matching our CLIENT_INFO_MAP
  const countryInfoList: Record<string, { capital: string; pop: string }> = {
    'spain': { capital: 'Madrid', pop: '47.4M' },
    'brazil': { capital: 'Brasília', pop: '203.1M' },
    'argentina': { capital: 'Buenos Aires', pop: '46.2M' },
    'united kingdom': { capital: 'London', pop: '67.0M' },
    'england': { capital: 'London', pop: '67.0M' },
    'germany': { capital: 'Berlin', pop: '84.3M' },
    'france': { capital: 'Paris', pop: '68.0M' },
    'italy': { capital: 'Rome', pop: '58.9M' },
    'portugal': { capital: 'Lisbon', pop: '10.3M' },
    'netherlands': { capital: 'Amsterdam', pop: '17.7M' },
    'belgium': { capital: 'Brussels', pop: '11.6M' },
    'croatia': { capital: 'Zagreb', pop: '3.9M' },
    'uruguay': { capital: 'Montevideo', pop: '3.4M' },
    'colombia': { capital: 'Bogotá', pop: '51.5M' },
    'mexico': { capital: 'Mexico City', pop: '127.5M' },
    'united states': { capital: 'Washington D.C.', pop: '333.3M' },
    'usa': { capital: 'Washington D.C.', pop: '333.3M' },
    'japan': { capital: 'Tokyo', pop: '125.1M' },
    'south korea': { capital: 'Seoul', pop: '51.7M' },
    'morocco': { capital: 'Rabat', pop: '37.5M' },
    'senegal': { capital: 'Dakar', pop: '17.3M' },
    'canada': { capital: 'Ottawa', pop: '38.9M' },
    'australia': { capital: 'Canberra', pop: '25.6M' },
    'china': { capital: 'Beijing', pop: '1.41B' },
    'india': { capital: 'New Delhi', pop: '1.43B' },
    'libya': { capital: 'Tripoli', pop: '6.9M' },
    'bosnia and herzegovina': { capital: 'Sarajevo', pop: '3.2M' },
    'democratic republic of the congo': { capital: 'Kinshasa', pop: '99M' },
    'ivory coast': { capital: 'Yamoussoukro', pop: '28M' }
  };

  const key = decoded.toLowerCase();
  const info = countryInfoList[key] || { capital: 'Capital City', pop: 'N/A' };

  // Structured Data (JSON-LD) for the country page
  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'Place',
    'name': capitalized,
    'description': `Discover news, sports, weather, and live activities in ${capitalized} on MooEarth Live.`,
    'address': {
      '@type': 'PostalAddress',
      'addressCountry': capitalized
    },
    'containedInPlace': {
      '@type': 'Place',
      'name': 'Earth'
    },
    'additionalProperty': [
      {
        '@type': 'PropertyValue',
        'name': 'Capital',
        'value': info.capital
      },
      {
        '@type': 'PropertyValue',
        'name': 'Population',
        'value': info.pop
      }
    ]
  };

  const breadcrumbJsonLd = {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    'itemListElement': [
      {
        '@type': 'ListItem',
        'position': 1,
        'name': 'Home',
        'item': 'https://www.mooearth.live'
      },
      {
        '@type': 'ListItem',
        'position': 2,
        'name': capitalized,
        'item': `https://www.mooearth.live/country/${key}`
      }
    ]
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbJsonLd) }}
      />
      <HomePage initialCountry={capitalized} />
    </>
  );
}
