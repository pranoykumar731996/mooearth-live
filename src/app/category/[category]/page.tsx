import { Metadata } from 'next';
import HomePage from '../../page';
import { EventCategory } from '@/types';

interface CategoryPageProps {
  params: Promise<{
    category: string;
  }>;
}

const CATEGORY_LABELS: Record<string, string> = {
  breaking: 'Breaking News',
  sports: 'Sports',
  football: 'Football Matches',
  technology: 'Technology',
  weather: 'Weather Updates',
  business: 'Business News',
  entertainment: 'Entertainment',
  worldcup: 'FIFA World Cup 2026'
};

export async function generateMetadata({ params }: CategoryPageProps): Promise<Metadata> {
  const { category: rawCategory } = await params;
  const cat = rawCategory.toLowerCase();
  const label = CATEGORY_LABELS[cat] || 'News Updates';
  const title = `${label} Live Stream & Global Events | MooEarth Live`;
  const description = `Follow the latest live ${label} updates, global trends, real-time sports results, and weather maps on MooEarth Live's 3D interactive emotional globe.`;

  return {
    title,
    description,
    alternates: {
      canonical: `/category/${cat}`,
    },
    openGraph: {
      title,
      description,
      url: `https://www.mooearth.live/category/${cat}`,
      type: 'website',
    },
    twitter: {
      card: 'summary_large_image',
      title,
      description,
    }
  };
}

export default async function CategoryPage({ params }: CategoryPageProps) {
  const { category: rawCategory } = await params;
  const cat = rawCategory.toLowerCase() as EventCategory;
  const label = CATEGORY_LABELS[cat] || 'News';

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
        'name': label,
        'item': `https://www.mooearth.live/category/${cat}`
      }
    ]
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbJsonLd) }}
      />
      <HomePage initialCategory={cat} />
    </>
  );
}
