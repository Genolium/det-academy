const VERSION = 'v2';
const STATIC_CACHE = `det-static-${VERSION}`;
const PAGE_CACHE = `det-pages-${VERSION}`;
const API_CACHE_PREFIX = `det-api-${VERSION}-`;
const OFFLINE_URL = '/offline.html';
const STATIC_ASSETS = ['/manifest.webmanifest', OFFLINE_URL];

const CACHEABLE_API = [
  '/api/v1/vocabulary',
  '/api/v1/institutions',
  '/api/v1/banners',
  '/api/v1/theory/progress',
  '/api/v1/test/sessions/me',
  '/api/v1/user/',
  '/api/v1/arena/leaderboard',
];

function isCacheableApi(pathname) {
  return CACHEABLE_API.some((prefix) => pathname === prefix || pathname.startsWith(`${prefix}/`) || pathname.startsWith(prefix));
}

function cacheNamespace(request) {
  const auth = request.headers.get('Authorization') || '';
  const token = auth.startsWith('Bearer ') ? auth.slice(7) : '';
  if (!token) return 'public';
  try {
    const payload = token.split('.')[1];
    const normalized = payload.replace(/-/g, '+').replace(/_/g, '/');
    const decoded = JSON.parse(atob(normalized + '='.repeat((4 - (normalized.length % 4)) % 4)));
    const id = decoded?.userId ?? decoded?.user_id ?? decoded?.sub;
    if (typeof id === 'string' && id) return `user-${id}`;
  } catch {
    // Fall through to an opaque token-based namespace.
  }
  return `token-${token.slice(-16)}`;
}

async function cacheApiResponse(request) {
  const cache = await caches.open(`${API_CACHE_PREFIX}${cacheNamespace(request)}`);
  const response = await fetch(request);
  if (response.ok && (response.headers.get('content-type') || '').includes('application/json')) {
    cache.put(request, response.clone()).catch(() => {});
  }
  return response;
}

async function navigationResponse(request) {
  const cache = await caches.open(PAGE_CACHE);
  try {
    const response = await fetch(request);
    if (response.ok && (response.headers.get('content-type') || '').includes('text/html')) {
      cache.put(request, response.clone()).catch(() => {});
    }
    return response;
  } catch {
    const cachedPage = await cache.match(request, { ignoreSearch: true });
    if (cachedPage) return cachedPage;
    const offline = await caches.match(OFFLINE_URL);
    return offline || Response.error();
  }
}

self.addEventListener('install', (event) => {
  self.skipWaiting();
  event.waitUntil(caches.open(STATIC_CACHE).then((cache) => cache.addAll(STATIC_ASSETS)).catch(() => {}));
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(
        keys
          .filter((key) => key !== STATIC_CACHE && key !== PAGE_CACHE && !key.startsWith(API_CACHE_PREFIX))
          .map((key) => caches.delete(key))
      )
    )
  );
  self.clients.claim();
});

self.addEventListener('message', (event) => {
  if (event.data?.type !== 'CLEAR_OFFLINE_CACHES') return;
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(
        keys
          .filter((key) => key.startsWith('det-api-') || (event.data.clearPages && key.startsWith('det-pages-')))
          .map((key) => caches.delete(key))
      )
    )
  );
});

self.addEventListener('fetch', (event) => {
  const request = event.request;
  if (request.method !== 'GET') return;
  const url = new URL(request.url);
  if (url.origin !== self.location.origin) return;

  if (request.mode === 'navigate') {
    event.respondWith(navigationResponse(request));
    return;
  }

  if (url.pathname.startsWith('/api/')) {
    if (!isCacheableApi(url.pathname)) return;
    event.respondWith(
      cacheApiResponse(request).catch(async () => {
        const cache = await caches.open(`${API_CACHE_PREFIX}${cacheNamespace(request)}`);
        return (await cache.match(request)) || Response.error();
      })
    );
    return;
  }

  const isStatic =
    url.pathname.startsWith('/_next/static/') ||
    /\.(?:css|js|svg|png|jpg|jpeg|webp|woff2?)$/.test(url.pathname);

  if (!isStatic) return;

  event.respondWith(
    caches.match(request).then((cached) => {
      if (cached) return cached;
      return fetch(request)
        .then((response) => {
          if (response.ok) {
            const copy = response.clone();
            caches.open(STATIC_CACHE).then((cache) => cache.put(request, copy)).catch(() => {});
          }
          return response;
        })
        .catch(() => cached || Response.error());
    })
  );
});
