import NeedDetailClient from './NeedDetailClient';

// Static export builds (NEXT_EXPORT=1): Firebase Hosting rewrites
// /needs/<any-uuid> → /needs/_.html, so we only need '_' here.
// Dev mode (no output:export): Next.js serves params properly via props.
export function generateStaticParams() {
  return [{ id: '_' }];
}

interface PageProps {
  params: Promise<{ id: string }>;
}

export default async function Page({ params }: PageProps) {
  const { id } = await params;
  // '_' is the static-export placeholder; skip it so the client reads the
  // real UUID from window.location.pathname (same as before).
  const resolvedId = id === '_' ? undefined : id;
  return <NeedDetailClient initialId={resolvedId} />;
}
