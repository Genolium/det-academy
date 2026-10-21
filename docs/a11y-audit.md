# Accessibility audit

## Automated gate

`e2e/a11y-all-routes.spec.ts` runs axe-core on 15 routes and fails on any
**critical, serious or moderate** violation:

```bash
npx playwright test e2e/a11y-all-routes.spec.ts
```

Routes: `/`, `/theory`, `/practice`, `/practice/flashcards`,
`/practice/typing`, `/test`, `/diagnostic`, `/dashboard`, `/profile`,
`/institutions`, `/vocabulary`, `/verify`, `/verify/unknown`, `/arena`, `/admin`.

The suite includes authenticated routes with mocked users and a server-issued
attempt. It also covers heading order, page-level `h1`, form labels, icon-button
names, scrollable-region keyboard access and color contrast.

Additional automated coverage:

- `e2e/a11y-keyboard.spec.ts` — skip link and focus transfer to main;
- `e2e/a11y-reflow.spec.ts` — all 15 routes at 320 CSS px (equivalent to 200% zoom
  on a 640px viewport) without horizontal document overflow;
- `e2e/a11y-forced-colors.spec.ts` — focus outline remains visible in
  `forced-colors: active`;
- `e2e/a11y-motion.spec.ts` — `prefers-reduced-motion` collapses animations;
- `e2e/a11y-focus.spec.ts` — auth dialog focus trap, Escape close and focus return;
- `e2e/a11y-errors.spec.ts` — login errors are announced via `role="alert"`;
- `e2e/a11y-transcript.spec.ts` — Listen and Type exposes an accessible transcript.

## Manual WCAG checks still required

These cannot be proven by an automated DOM scan and need a human with a browser,
keyboard and screen reader:

- [ ] VoiceOver (macOS/iOS) and NVDA (Windows) announcement quality;
- [ ] full keyboard-only flow through registration, test session, audio recording,
      writing submission and result modal;
- [ ] focus trap and focus return in the remaining dialogs (cookie consent and
      result modal are not covered by the auth-dialog test);
- [ ] screen-reader announcement of timer changes and recording state;
- [ ] captions/transcripts for the remaining listening and speaking prompt types;
- [ ] error messages linked with `aria-describedby` to the invalid field;
- [ ] color is never the only indicator of correctness or status.

The automated gate is necessary but not sufficient for a WCAG 2.2 AA conformance
claim.
