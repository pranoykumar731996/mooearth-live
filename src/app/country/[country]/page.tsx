import { redirect } from 'next/navigation';
import { resolveCanonicalSlug } from '@/data/countries';

interface CountryRedirectPageProps {
  params: Promise<{
    country: string;
  }>;
}

export default async function CountryRedirectPage({ params }: CountryRedirectPageProps) {
  const { country: rawCountry } = await params;
  const decoded = decodeURIComponent(rawCountry);
  const canonical = resolveCanonicalSlug(decoded) || decoded.toLowerCase().replace(/[^a-z0-9]+/g, '-');
  redirect(`/countries/${canonical}`);
}
