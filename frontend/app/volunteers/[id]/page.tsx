import VolunteerDetailClient from './VolunteerDetailClient';

export function generateStaticParams() {
  return [{ id: '_' }];
}

interface PageProps {
  params: Promise<{ id: string }>;
}

export default async function Page({ params }: PageProps) {
  const { id } = await params;
  const resolvedId = id === '_' ? undefined : id;
  return <VolunteerDetailClient initialId={resolvedId} />;
}
