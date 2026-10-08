# Waitlist — a considered invitation

A responsive Next.js waitlist with a paper card, a coordinated envelope sequence,
and a functional reduced-motion alternative. The original Next.js/React/GSAP stack
and CSS Modules are retained. No new application dependency was added.

## Run locally

```sh
bun install --frozen-lockfile
bun run dev
```

Node/npm also work (`npm install`, `npm run dev`). The checks in this delivery used
Node 24 and npm with the dependency versions declared by the project. The existing
Bun lockfile is preserved; Bun itself was not available in the implementation environment.

### Preview the animation without saving an email

Copy `.env.example` to `.env.local` and set:

```dotenv
WAITLIST_DEMO_MODE=true
```

Restart the development server. The page visibly says it is a preview, the button
says “Preview the invitation,” and no email is stored or sent. Enter a sample email
and click the button to see the sequence. Enter/Space submissions and reduced-motion
preferences use the brief static confirmation path. Preview mode is always disabled
in a production build, even if the environment variable is true.

## Enable real signups

The destination for signup storage was not supplied. A configurable server adapter
is included; there is no pretend production persistence. Set these server-only values:

```dotenv
WAITLIST_WEBHOOK_URL=https://your-service.example/waitlist
WAITLIST_WEBHOOK_TOKEN=your-server-secret
```

The endpoint must:

1. Authenticate `Authorization: Bearer <token>`.
2. Accept JSON `{ "email": "normalized@example.com" }`.
3. Store the address durably, with a unique normalized email or equivalent deduplication.
4. Honor the stable `Idempotency-Key` header. Retries may follow uncertain timeouts.
5. Return a 2xx JSON response `{ "ok": true }` **only after** storage is confirmed,
   including when the email is already registered.

The adapter uses HTTPS, disallows redirects, and times out after eight seconds.
Unconfigured production returns 503; failed/unconfirmed provider responses return
502. The form preserves the entered email and permits retry. No real provider was
contacted during validation. Configure deployment-level abuse/rate controls and the
actual storage destination before public release; the adapter alone cannot guarantee
how an external receiver stores or deduplicates data.

## Customize

Edit `src/app/page.tsx` for the brand, card title and eyebrow. Palette and font stacks
live in `WaitlistExperience.module.css`. No external font or image requests are needed.

| File | Responsibility |
| --- | --- |
| `WaitlistExperience.tsx` | Request state, feedback, focus and orchestration |
| `WaitlistHero.tsx` + module | Hero heading and small editorial ornament |
| `WaitlistCard.tsx` + module | Accessible form and initial letter preview |
| `SubmissionLetter.tsx` + module | Decorative postcard used during insertion |
| `Envelope.tsx` + module | Rear, congruent flap, front pocket and seal |
| `envelopeGeometry.ts` | Shared silhouette, hinge, folds and pocket coordinates |
| `motion.ts` | Pure rectangle/pose calculations and GSAP timing tokens |
| `useWaitlistAnimation.ts` | One owned timeline, interruption and resize handling |
| `src/lib/waitlist.ts` | Shared email normalization and validation |
| `src/app/api/waitlist/route.ts` | Bounded requests, explicit demo and durable-receipt adapter |

The source files named above are under `src/components/waitlist/` unless otherwise specified.

## Behavior

- The initial card sizes to its content. Short screens scroll; text and controls are not clipped to force a one-screen layout.
- Success turns the card into a concise decorative postcard, lifts/shrinks it, brings in all envelope surfaces together, inserts the letter, folds the flap and seals it. The normal sequence is about two seconds.
- Letter fit is constrained by both physical pocket width and depth, rather than by the SVG wrapper width alone.
- A successful request stays successful if the optional animation skips, is cancelled or cannot measure a valid pose.
- The form's layout space remains reserved during playback, avoiding collapse while objects move.
- Reduced motion, keyboard submission, the Skip button and a size change during playback reach a static success state. Motion preferences are sampled when playback starts and monitored while it runs.
- Form errors are associated with the input; input and button focus rings remain visible; hidden animation artwork is excluded from the accessibility tree.

## Verification

```sh
bun run lint
bun run typecheck
bun run test
bun run build
bun run test:smoke
```

`test` compiles only its TypeScript dependency graph into `.test-build/` and runs the
Node test runner. `test:smoke` starts the production build on port 3107, checks the
rendered HTML and unconfigured API behavior, then stops that test server.

Completed during implementation:

- ESLint and React Compiler rules.
- TypeScript check and optimized Next.js production build.
- Geometry fixtures for viewport widths 320, 390, 430, 760, 761, 1024, 1366 and 1440;
  both insertion fit and interpolated travel bounds; original tall-card regression;
  flap symmetry and seam overlap; invalid measurement handling.
- API checks for normalization, invalid/oversized input, explicit local preview,
  production preview rejection, missing configuration, awaiting acknowledgement,
  stable retry keys, provider rejection, malformed receipts and timeout errors.
- Production HTTP smoke check. Provider calls in unit tests are mocked.

### Visual checks still required

The connected browser could not access the local preview server in this environment.
The viewport tests use explicit geometric fixtures, **not measured browser layouts**.
No Chrome/Safari/iOS screenshot review, real screen-reader session, live resize
interaction test, or frame-rate profiling is claimed.

Before launch, check normal and slow playback at 390×844, 761×800, 1440×900 and short
landscape, plus 200% zoom and longer content. Confirm every envelope surface remains
registered, no letter edge remains exposed after closure, no input/focus ring clips,
and feedback works with keyboard/VoiceOver/NVDA. Change reduced motion or resize during
insertion, navigate away during a request, test a slow/error response and rapid double
submission. For a temporary development slow-motion review, use `timeline.timeScale(0.1)`
immediately after timeline creation inside the animation hook; remove it afterward.

## Distribution

This archive contains the complete application source, configuration, existing Bun
lockfile, tests and environment example. It excludes dependencies, generated build
files, local secrets and embedded Git history. Overlay its source onto your working
copy or extract into a fresh folder. See `IMPLEMENTATION.md` for the change summary.
