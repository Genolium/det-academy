import { NextRequest } from 'next/server';

/**
 * Same-origin proxy for the Directus CMS.
 *
 * The browser never talks to a separate CMS hostname: it calls `/directus/...`
 * on the application origin and this handler forwards the request to the CMS
 * container over the internal network. That keeps the site working when the
 * nginx server block for the CMS subdomain is not deployed and avoids browser
 * TLS warnings for a hostname that is not covered by the certificate.
 *
 * Only read requests for public content are proxied. Everything else is
 * rejected so the origin cannot be used as an open proxy for the CMS admin
 * API.
 */

export const dynamic = 'force-dynamic';

const READ_ONLY_COLLECTIONS = new Set([
  'theory_lessons',
  'questions',
  'institutions',
  'ad_banners',
  'vocabulary_publication',
]);

const ALLOWED_FILE_PREFIXES = ['assets/', 'files/'];

const UPSTREAM_TIMEOUT_MS = 4_000;

function directusBaseUrl(): string {
  const configured = process.env.DIRECTUS_INTERNAL_URL || process.env.NEXT_PUBLIC_DIRECTUS_URL || '';
  return configured.replace(/\/+$/, '');
}

function isAllowedPath(path: string): boolean {
  if (ALLOWED_FILE_PREFIXES.some((prefix) => path.startsWith(prefix))) {
    return true;
  }
  if (!path.startsWith('items/')) {
    return false;
  }
  const collection = path.slice('items/'.length).split('/')[0];
  return READ_ONLY_COLLECTIONS.has(collection);
}

async function proxy(request: NextRequest, path: string[]): Promise<Response> {
  const base = directusBaseUrl();
  if (!base) {
    return Response.json(
      { error: 'cms_unavailable', message: 'DIRECTUS_INTERNAL_URL is not configured' },
      { status: 503 },
    );
  }

  const joined = path.join('/');
  if (!isAllowedPath(joined)) {
    return Response.json(
      { error: 'forbidden', message: `path /${joined} is not proxied` },
      { status: 403 },
    );
  }

  const upstream = new URL(`${base}/${joined}`);
  request.nextUrl.searchParams.forEach((value, key) => {
    upstream.searchParams.append(key, value);
  });

  const headers: Record<string, string> = { Accept: 'application/json' };
  const token = process.env.DIRECTUS_TOKEN || process.env.DIRECTUS_STATIC_TOKEN;
  if (token) {
    headers.Authorization = `Bearer ${token}`;
  }

  try {
    const response = await fetch(upstream.toString(), {
      method: 'GET',
      headers,
      signal: AbortSignal.timeout(UPSTREAM_TIMEOUT_MS),
      cache: 'no-store',
    });

    const contentType = response.headers.get('content-type') || 'application/json';
    const body = await response.arrayBuffer();

    return new Response(body, {
      status: response.status,
      headers: {
        'Content-Type': contentType,
        'Cache-Control': 'public, s-maxage=60, stale-while-revalidate=300',
      },
    });
  } catch (error) {
    return Response.json(
      { error: 'cms_unavailable', message: error instanceof Error ? error.message : 'cms request failed' },
      { status: 502 },
    );
  }
}

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ path: string[] }> },
): Promise<Response> {
  const { path } = await params;
  return proxy(request, path ?? []);
}

export async function HEAD(
  request: NextRequest,
  { params }: { params: Promise<{ path: string[] }> },
): Promise<Response> {
  const { path } = await params;
  return proxy(request, path ?? []);
}
