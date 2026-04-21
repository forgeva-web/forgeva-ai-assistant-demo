// @/lib/client-site.ts

export function urlToPageSlug(url: string): string {
  try {
    const pathname = new URL(url).pathname;
    const segment = pathname.replace(/^\//, '').split('/')[0];
    return segment || 'home';
  } catch {
    return 'home';
  }
}

export async function revalidateClientSite(payload: {
  tags: string[];
  path?: string;
}): Promise<void> {
  const clientSiteUrl = process.env.NEXT_PUBLIC_CLIENT_SITE_URL;
  const secret = process.env.CLIENT_SITE_REVALIDATION_SECRET;
  if (!clientSiteUrl || !secret) {
    console.warn('[revalidate] Missing CLIENT_SITE_URL or SECRET — skipping');
    return;
  }
  try {
    await fetch(`${clientSiteUrl}/api/revalidate`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${secret}`,
      },
      body: JSON.stringify(payload),
    });
    console.log('[revalidate] Success:', Response);
  } catch (error) {
    // Non-fatal — edit succeeded even if revalidation fails
    console.error('[revalidate] Failed:', error);
  }
}
