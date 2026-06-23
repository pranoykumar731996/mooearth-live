import { Metadata } from 'next';
import HomePage from '../../page';
import { demoEvents } from '@/data/events';
import { fetchOrGenerateArticleDetails } from '@/services/article';

interface ArticlePageProps {
  params: Promise<{
    id: string;
  }>;
}

async function getArticleDetailsHelper(id: string) {
  const event = demoEvents.find(e => e.id === id);
  if (!event) return null;

  try {
    const details = await fetchOrGenerateArticleDetails(
      event.id,
      event.source,
      event.title,
      event.summary,
      event.country,
      event.category,
      event.publishedAt
    );
    return { event, details };
  } catch (error) {
    console.error('Error fetching details for sitemap / page metadata:', error);
    return { event, details: null };
  }
}

export async function generateMetadata({ params }: ArticlePageProps): Promise<Metadata> {
  const { id } = await params;
  const result = await getArticleDetailsHelper(id);

  if (!result || !result.event) {
    return {
      title: 'World Event Article | MooEarth Live',
      description: 'Explore live global events on MooEarth Live.'
    };
  }

  const { event, details } = result;
  const title = details ? `${details.title} | MooEarth Live` : `${event.title} | MooEarth Live`;
  const description = details ? details.aiSummary.substring(0, 160) : event.summary.substring(0, 160);
  const imageUrl = details?.image || 'https://images.unsplash.com/photo-1504711434969-e33886168f5c?q=80&w=800';

  return {
    title,
    description,
    alternates: {
      canonical: `/article/${id}`,
    },
    openGraph: {
      title,
      description,
      url: `https://www.mooearth.live/article/${id}`,
      type: 'article',
      publishedTime: event.publishedAt,
      authors: details?.author ? [details.author] : ['Staff Reporter'],
      images: [
        {
          url: imageUrl,
          width: 800,
          height: 600,
          alt: title
        }
      ]
    },
    twitter: {
      card: 'summary_large_image',
      title,
      description,
      images: [imageUrl]
    }
  };
}

export default async function ArticlePage({ params }: ArticlePageProps) {
  const { id } = await params;
  const result = await getArticleDetailsHelper(id);

  if (!result || !result.event) {
    return <HomePage />;
  }

  const { event, details } = result;
  const title = details?.title || event.title;
  const summary = details?.aiSummary || event.summary;
  const author = details?.author || 'Staff Reporter';
  const imageUrl = details?.image || 'https://images.unsplash.com/photo-1504711434969-e33886168f5c?q=80&w=800';

  const newsArticleJsonLd = {
    '@context': 'https://schema.org',
    '@type': 'NewsArticle',
    'headline': title,
    'description': summary,
    'image': [imageUrl],
    'datePublished': event.publishedAt,
    'dateModified': event.publishedAt,
    'author': {
      '@type': 'Person',
      'name': author
    },
    'publisher': {
      '@type': 'Organization',
      'name': 'MooEarth Live',
      'logo': {
        '@type': 'ImageObject',
        'url': 'https://www.mooearth.live/icons/icon-512.png'
      }
    },
    'mainEntityOfPage': {
      '@type': 'WebPage',
      '@id': `https://www.mooearth.live/article/${id}`
    }
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
        'name': event.category.toUpperCase(),
        'item': `https://www.mooearth.live/category/${event.category}`
      },
      {
        '@type': 'ListItem',
        'position': 3,
        'name': title,
        'item': `https://www.mooearth.live/article/${id}`
      }
    ]
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(newsArticleJsonLd) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbJsonLd) }}
      />
      <HomePage initialArticleId={id} />
    </>
  );
}
