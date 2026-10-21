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

`e2e/a11y-keyboard.spec.ts` verifies that the first Tab stop is the skip link and
that Enter moves focus to `<main id="main-content">`.

## Manual WCAG checks still required

These cannot be proven by an automated DOM scan and need a human with a browser,
keyboard and screen reader:

- [ ] VoiceOver (macOS/iOS) and NVDA (Windows) announcement quality;
- [ ] full keyboard-only flow through registration, test session, audio recording,
      writing submission and result modal;
- [ ] focus trap and focus return in auth, cookie-consent and result dialogs;
- [ ] 200% browser zoom and 320 CSS px reflow without loss of content;
- [ ] Windows High Contrast / forced-colors mode;
- [ ] `prefers-reduced-motion` behavior for timers, confetti and animated cards;
- [ ] captions/transcripts for listening and speaking prompts;
- [ ] error messages announced and linked to the invalid field;
- [ ] color is never the only indicator of correctness or status.

The automated gate is necessary but not sufficient for a WCAG 2.2 AA conformance
claim.
