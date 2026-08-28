# Melanie Berberette — Portfolio

A portfolio site for an independent Web & UX designer. Dark editorial layout, a
3D extruded version of the MB monogram in the hero, smooth scrolling with Lenis,
and scroll-driven animation with GSAP and Motion.

## Running it locally

```bash
npm install
npm run dev
```

The dev server listens on **http://localhost:43417**.

```bash
npm run build   # production build
npm start       # serve the production build
npm run lint    # eslint
npm run typecheck
npm run shot    # screenshot the running dev server (visual QA, needs Chrome)
```

## Stack

| Concern         | Choice                                                |
| --------------- | ----------------------------------------------------- |
| Framework       | Next.js 16 (App Router, React 19, TypeScript)          |
| Styling         | Tailwind CSS v4 with a custom theme in `globals.css`   |
| Smooth scroll   | [Lenis](https://lenis.darkroom.engineering/)           |
| Scroll + text   | GSAP (ScrollTrigger, SplitText, CustomEase)            |
| UI motion       | [Motion](https://motion.dev/) (`motion/react`)         |
| 3D              | Three.js via react-three-fiber and drei                |
| Logo animation  | lottie-web, playing the hand-authored MB monogram rig  |
| Type            | Archivo (display), Geist (body), Geist Mono, Instrument Serif |

Lenis is driven by the GSAP ticker in `SmoothScroll.tsx` so smooth scrolling and
ScrollTrigger never fight over the same frame.

## Editing content

**All copy lives in one file: `src/lib/content.ts`.** Nothing is hardcoded in
components. Update the name, role, email, socials, projects, capabilities,
process, stats, testimonials and recognition there and the whole site follows.

A few notes on the placeholder content:

- The five case studies, testimonials, stats and awards are **sample entries**
  written to show the layout at realistic length. Replace them with your real
  work before publishing.
- `site.email`, `site.url` and the social links point at placeholders.

## Brand assets

| File                                | What it is                                       |
| ----------------------------------- | ------------------------------------------------ |
| `public/logo/mb-mark.svg`           | Vector monogram — also extruded into 3D in the hero |
| `public/logo/mb-monogram.json`      | Original Lottie animation                         |
| `public/logo/mb-monogram-alpha.json`| Same animation with the background solid removed  |
| `public/logo/mb-monogram.lottie`    | Original dotLottie bundle                         |
| `public/images/melanie.jpg`         | Portrait used in the Studio section               |
| `assets/`                           | Untouched originals as supplied                   |

The Lottie plays in the preloader and as the preview for the identity project.

### Adding video previews to case studies

The work list supports looping video previews that play on hover, the way
heynesh.com does it. To use one:

1. Drop the file into `public/media/`, e.g. `public/media/mb-identity.mp4`.
2. Add the path to that project in `src/lib/content.ts`:

```ts
{
  id: "mb-identity",
  // ...
  video: "/media/mb-identity.mp4",
}
```

Video takes priority over everything else. Without it, a project falls back to
the animated monogram (`lottie: true`) or to a generative poster built from the
project's accent colour in `ProjectPoster.tsx`. Short, muted, 8–12 second loops
around 1600px wide work best.

## Structure

```
src/
  app/
    layout.tsx        fonts, metadata, shell
    page.tsx          section order + Person JSON-LD
    globals.css       theme tokens, base styles, utilities
  components/
    brand/            Monogram SVG
    motion/           Magnetic, Reveal (lines / words / blocks)
    providers/        AppShell, SmoothScroll (Lenis), intro context
    sections/         Hero, Marquee, Studio, Work, Capabilities,
                      Process, Testimonials, Contact
    site/             Nav, Footer, Cursor, Preloader, ScrollProgress, LocalTime
    three/            MonogramScene — SVG extrusion, lighting, scroll response
    work/             ProjectMedia, ProjectPoster
  lib/
    content.ts        every word on the site
    gsap.ts           plugin registration + custom eases
    utils.ts
```

## Accessibility and motion

- `prefers-reduced-motion` is honoured throughout: the preloader is skipped, the
  custom cursor is disabled, text reveals resolve instantly and the 3D mark stops
  drifting.
- The custom cursor only replaces the native one on fine pointers with hover.
- Keyboard focus is visible everywhere, there is a skip link, and the mobile menu
  closes on Escape.

## Deploying

Any Node host works. On Vercel, push the repo and accept the defaults — there is
no server-side state, no database and no environment variables.

Before going live, set `site.url` in `src/lib/content.ts` to the real domain so
that Open Graph tags and the JSON-LD resolve correctly, and add an
`app/opengraph-image.tsx` (or `public/og.png`) for link previews.
