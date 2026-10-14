// ============================================================
// MooEarth Live — Curated Discovery Collection Route
// ============================================================
// Phase 10: Dynamic public collection presentation with Open Graph cards,
// Schema.org structured data, and draft privacy protection.

import { Metadata } from 'next';
import { getCollectionById } from '@/services/collectionService';
import CollectionLandingClient from '@/components/Collections/CollectionLandingClient';

interface CollectionPageProps {
  params: Promise<{ id: string }>;
}

export async function generateMetadata({ params }: CollectionPageProps): Promise<Metadata> {
  const { id } = await params;
  const col = await getCollectionById(id);

  if (!col || col.status !== 'published') {
    return {
      title: 'Collection Not Found | MooEarth Live',
      description: 'The requested curated world collection was not found or is currently private.',
      robots: { index: false, follow: false },
    };
  }

  const title = `${col.coverEmoji ? col.coverEmoji + ' ' : ''}${col.title} | MooEarth Live`;
  const description = col.description || `Explore ${col.totalLocations} curated world discoveries on the living 3D globe.`;
  const url = `https://mooearth.live/collections/${encodeURIComponent(col.id)}`;

  return {
    title,
    description,
    alternates: { canonical: url },
    robots: { index: true, follow: true },
    openGraph: {
      title,
      description,
      url,
      type: 'article',
      siteName: 'MooEarth Live',
    },
    twitter: {
      card: 'summary_large_image',
      title,
      description,
    },
  };
}

export default async function CollectionPage({ params }: CollectionPageProps) {
  const { id } = await params;
  const col = await getCollectionById(id);

  // Schema.org structured data for educational collections
  const jsonLd = col && col.status === 'published' ? {
    '@context': 'https://schema.org',
    '@type': 'ItemList',
    name: col.title,
    description: col.description,
    numberOfItems: col.locations?.length || 0,
    itemListElement: col.locations?.map((loc, idx) => ({
      '@type': 'ListItem',
      position: idx + 1,
      name: loc.name,
      description: loc.educationalNotes || `Geographic discovery in ${loc.country || 'World'}`,
    })),
  } : null;

  return (
    <>
      {jsonLd && (
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
        />
      )}
      <CollectionLandingClient initialCollection={col} collectionId={id} />
    </>
  );
}
