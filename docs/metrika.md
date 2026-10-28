# Yandex Metrika

Counter: **113844701** (public identifier, not a secret).
Site: `https://det-academy.ru`.

## What is installed

`src/components/analytics/YandexMetrika.tsx` renders at the very top of
`<body>` in `src/app/layout.tsx`, so the counter is present on every route.
It injects the official `mc.yandex.ru/metrika/tag.js` loader once per document
and calls:

```js
ym(113844701, 'init', {
  ssr: true,
  webvisor: true,
  clickmap: true,
  ecommerce: 'dataLayer',
  referrer: document.referrer,
  url: location.href,
  accurateTrackBounce: true,
  trackLinks: true,
});
```

Notes:

- `webvisor`, `clickmap`, `ecommerce` and accurate bounce are also configured in
  the counter settings in the Metrika UI. The tag options enable the client
  side; the counter must not have these features disabled server-side.
- Ecommerce uses `window.dataLayer` (`ecommerce: 'dataLayer'`). The site does
  not ship GTM; future conversion code can push Metrika ecommerce objects into
  `window.dataLayer`.
- The App Router does not reload the document. After the first `init` pageview,
  route changes send `ym(113844701, 'hit', location.href, { title, referrer })`.
- The script element has `id="yandex-metrika"` and the loader checks
  `window.__detYandexMetrikaLoaded`; remounts and client navigations never
  inject a second copy.
- A `<noscript>` pixel is rendered **only** in always-on consent mode. Without
  JavaScript the consent banner cannot be shown, so the pixel is suppressed in
  the default consent-required mode.

### SSR

The root layout stays static (no `cookies()`/`headers()`), which keeps the SEO
pages prerenderable. The counter is therefore hydrated client-side, but the
initial hit is initialized with `ssr: true` together with the current `url` and
`referrer`, so the first pageview is attributed correctly. If the site later
moves consent to a cookie, the tag can be switched to `beforeInteractive` in the
root layout to place it in the initial HTML as well.

## Consent decision (default: consent required)

Metrika is a tracking/analytics tool and sets cookies (`_ym_uid`, `_ym_d`,
`_ym_isad`, Webvisor session data). The default behaviour is therefore:

> The counter is **not loaded at all** until `localStorage.det_cookie_consent`
> is `'true'` (the "Принять" action in the cookie banner).

If the visitor chooses "Только необходимое", `det_cookie_consent` becomes
`'rejected'` and Metrika is never injected. No `mc.yandex.ru` request is made
before consent. Consent changes in the same tab are picked up through the
Zustand settings store; changes in other tabs are picked up through the
`storage` event. A future consent manager can also dispatch a
`det:cookie-consent` window event.

### Always-on mode (legal escape hatch)

Some deployments may be legally allowed (or required by a different regulatory
regime) to run analytics without prior consent. Set at build time:

```bash
NEXT_PUBLIC_YM_CONSENT_MODE=always
```

Tradeoff, stated explicitly: in this mode the counter loads for every visitor
before any consent action, `_ym_*` cookies are written immediately, and the
`<noscript>` pixel is enabled. This is a privacy-relevant decision and must be
approved by whoever owns the legal basis for the deployment. Do not enable it
silently.

## Configuration

All variables are public (inlined into the client bundle at build time) and must
be present when `next build` runs.

| Variable | Default | Meaning |
| --- | --- | --- |
| `NEXT_PUBLIC_YM_ID` | `113844701` | Counter ID. Non-digits are stripped. |
| `NEXT_PUBLIC_YM_ENABLED` | unset | `true` forces the counter on outside production (local, e2e). `false` forces it off everywhere, including production. |
| `NEXT_PUBLIC_YM_CONSENT_MODE` | `required` | `required` = load only after consent. `always` = load immediately. |

Loading matrix:

| Environment | `NEXT_PUBLIC_YM_ENABLED` | Loads? |
| --- | --- | --- |
| production | unset | yes, after consent (or immediately with `CONSENT_MODE=always`) |
| production | `true` | yes, after consent |
| production | `false` | never |
| development / e2e | unset | never |
| development / e2e | `true` | yes, after consent |

### Force it locally

```bash
NEXT_PUBLIC_YM_ENABLED=true npm run dev
```

Then, in the browser devtools console:

```js
localStorage.setItem('det_cookie_consent', 'true');
location.reload();
```

Use a test counter if you do not want local traffic in production statistics.

## Disable

- Everywhere: build with `NEXT_PUBLIC_YM_ENABLED=false`.
- Outside production only: simply do not set `NEXT_PUBLIC_YM_ENABLED`.
- Emergency, no rebuild: block or remove the counter in the Metrika UI, or
  remove `https://mc.yandex.ru` from the CSP (this blocks the script but leaves
  the dead inline snippet in the bundle). Prefer the env switch.

## CSP

`https://mc.yandex.ru` is allowed in `script-src`, `connect-src` and `img-src`
in:

- `next.config.ts` (application headers);
- `nginx/det-academy.ru.conf`;
- `nginx/det-academy.ru.modern.conf`.

`unsafe-eval` is **not** re-introduced. `img-src https:` already covered the
pixel, but the explicit host documents intent. `frame-src` is unchanged:
Webvisor records the page and does not require an iframe from `mc.yandex.ru`.

## How to verify

1. Build/production-like run with the counter enabled and consent granted.
2. DevTools → Network, filter `mc.yandex.ru`. Expected:
   - `tag.js` loads once (200);
   - Webvisor/`watch` requests follow;
   - no request at all while consent is missing/rejected.
3. DevTools → Console:
   ```js
   typeof window.ym;        // "function"
   window.ym.a;             // queued init call with id 113844701
   ```
4. Navigate between pages: `window.ym.a` must still contain exactly one `init`
   call; a `hit` call appears for the new URL.
5. Metrika UI → real-time report should show the visit.
6. Automated checks:
   ```bash
   npx playwright test -c playwright.metrika.config.ts
   ```
   The test aborts all `mc.yandex.ru` requests, so it never sends real hits.

## Known follow-up (legal/UX, outside this change)

The cookie banner copy still says "Без рекламы и трекинга" / "No ads, no
tracking" (`src/lib/translations.ts`, `cookie.text`). With Metrika installed
this is no longer accurate. The copy should mention analytics and link to the
privacy policy's analytics section before launch. It was left untouched to
avoid conflicting with the i18n/UI owners; whoever ships analytics must update
it.
