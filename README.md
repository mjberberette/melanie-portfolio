# Melanie Berberette — Portfolio

Portfolio site for an independent Web & UX designer. Dark editorial layout, and
a hero built around the MB monogram in real 3D — chrome-lit from a hand-painted
studio environment, sandwiched between the two lines of the name, following the
pointer, draggable, and choreographed by the scroll while the section is
pinned. Smooth scrolling with Lenis, scroll-driven animation with GSAP.

**No framework.** This is hand-written HTML, CSS and JavaScript. Vite is used
only as a dev server and bundler — there is no React, no JSX and no templating
layer. `index.html` contains every word on the site and you can edit it
directly.

## Running it locally

```bash
npm install
npm run dev
```

The dev server listens on **http://localhost:43417**.

```bash
npm run build     # production build into dist/
npm run preview   # serve the production build
npm run shot      # screenshot the running dev server (visual QA, needs Chrome)
```

## Stack

| Concern        | Choice                                                     |
| -------------- | ---------------------------------------------------------- |
| Markup         | One hand-written `index.html`                               |
| Styling        | Plain CSS with custom properties, split by concern          |
| Scripting      | ES modules, no framework                                    |
| Dev server     | Vite                                                        |
| Smooth scroll  | [Lenis](https://lenis.darkroom.engineering/)                |
| Scroll + text  | GSAP — ScrollTrigger, SplitText, CustomEase                 |
| 3D             | Three.js — extruded from the original vector coordinates    |
| Logo animation | lottie-web, playing the hand-authored MB monogram rig       |
| Animated icons | [Lordicon](https://lordicon.com/) via `lord-icon-element`   |
| Type           | Grift (display, self-hosted in `public/fonts`), Geist, Geist Mono, Instrument Serif |

Lenis is stepped by the GSAP ticker in `smooth-scroll.js`, so smooth scrolling
and ScrollTrigger always resolve on the same frame. Three.js is loaded as a
separate chunk after first paint, so the initial JavaScript payload stays small.

## Structure

```
index.html              all markup and copy, plus the monogram <symbol> sprite
vite.config.js
public/
  logo/                 monogram SVG + Lottie files
  images/melanie.jpg    portrait
  icons/*.json          recoloured Lordicon animations
  media/                drop project preview videos here
src/
  css/
    main.css            imports the four files below
    tokens.css          colours, type, spacing, easing — change things here
    base.css            reset and document defaults
    layout.css          shell, section rhythm, buttons, tags, reveal primitives
    chrome.css          preloader, cursor, rail navigation
    sections.css        hero, marquee, studio, work, capabilities, stack,
                        what-you-get, pricing, contact, footer
  js/
    main.js             boots every module
    gsap.js             plugin registration + custom eases
    utils.js            small helpers and the "page revealed" event
    modules/
      smooth-scroll.js  Lenis + GSAP ticker, scrollTo helper
      preloader.js      counter, Lottie monogram draw-on, curtain wipe
      cursor.js         two-part custom cursor
      rail.js           side-rail navigation: scrollspy, progress, anchor links
      reveal.js         data-reveal / -lines / -words scroll animations
      hero.js           name intro, pinned scroll scene, pointer parallax
      monogram.js       the 3D mark: geometry, studio lighting, follow/drag
      marquee.js        velocity-reactive ticker
      counters.js       stat counters
      work.js           pinned horizontal gallery + auto-scrolling iPads
      accordion.js      capabilities
      journey-bg.js     wayfinding chart behind the journey: drifting plus
                        grid, scroll parallax, vermilion pings
      wyg.js            "what you get": scrubbed statement reveal + hoverable
                        capability chips parked inside the sentence
      plans.js          pricing tiers: GSAP entrance + price count-up, Motion
                        (motion.dev) spring hover and feature-row cascade
      stack.js          toolbox grid: GSAP grid-wave entrance, Motion spring
                        pops, idle accent sweep over the brand glyphs
      contact.js        copy-to-clipboard
      clock.js          local time + copyright year
      icons.js          defines <lord-icon> and parks icons on their last frame
scripts/
  recolor-icons.mjs     maps Lordicon's palette onto the site's colours
  make-screens.mjs      generates the still site captures inside the iPad mockups
  record-screen.mjs     records a live site scrolling, for video previews
  shot.mjs              full-page screenshots
  interact.mjs          hover/menu/accordion screenshots
  qa.mjs                responsive + reduced-motion sweep
  icon-sheet.mjs        renders a contact sheet of Lordicon IDs
assets/                 untouched source files as supplied
```

## Editing content

Open `index.html`. Every heading, paragraph, project, capability, testimonial
and award is written out as normal HTML — there is no data file to keep in sync.

A note on the placeholder content: the five case studies, the testimonials, the
stats and the awards are **sample entries** written at realistic length to show
the layout. Replace them with real work before publishing, along with
`hello@melanieberberette.com`, the canonical URL and the social links.

### Changing the look

`src/css/tokens.css` holds the whole visual system — surfaces, type colours, the
vermilion accent, font stacks, section rhythm and easing curves. Changing
`--accent` there recolours the site. Per-project accents are set inline on the
work rows and cards with `style="--accent: #7c9cff"`.

### The work gallery

On larger screens the Selected Work section pins and scrolls sideways. Each
card is an iPad mockup showing the project's website over an animated gradient
backdrop in that project's accent colour. A card's screen is one of two things:

- **A recorded scroll-through** (`<video … data-screen-video>`) — a real
  recording of the live site being scrolled, so its own animations and
  scroll-driven sections play back exactly as they do on the site. Card 02
  (EveryPeer) works this way. Videos only play while the card is on screen and
  don't download until then. Produce one with
  `node scripts/record-screen.mjs <name> <url>` (needs `ffmpeg`); it writes
  `public/media/screens/<name>.mp4` plus a poster frame.
- **A tall still capture** (`<img … data-screen>`) that the site pans up and
  down. Card 01 uses a real capture of this site; the other three are small
  original landing pages designed in `scripts/make-screens.mjs` as stand-ins
  (`node scripts/make-screens.mjs` while the dev server is running).

The scroll animation measures the image at load, so any height works. A video
can be used instead by swapping a card's `<img>` for a muted, looping,
autoplaying `<video>` in `index.html`.

### Icons

Icons are animated Lottie files from [Lordicon](https://lordicon.com/), stored
locally in `public/icons` so there is no runtime CDN dependency. Lordicon ships
them in its own navy/teal palette, so `scripts/recolor-icons.mjs` rewrites those
two brand colours to the site's bone and vermilion — including the "Fill" effect
layers, which is what actually tints the artwork.

To swap an icon:

1. Download the JSON from Lordicon into `assets/lordicon-src/`.
2. Run `node scripts/recolor-icons.mjs`.
3. Point the `src` of the relevant `<lord-icon>` in `index.html` at the new file.

Each icon rests on its last frame, replays on hover, and plays once the first
time it scrolls into view. Lordicon's free tier requires attribution, which is
in the footer.

## Brand assets

| File                                 | What it is                                          |
| ------------------------------------ | --------------------------------------------------- |
| `public/logo/mb-mark.svg`            | Vector monogram (favicon + inline sprite)            |
| `public/logo/mb-monogram.json`       | Original Lottie animation                            |
| `public/logo/mb-monogram-alpha.json` | Same animation with the background solid removed     |
| `public/logo/mb-monogram.lottie`     | Original dotLottie bundle                            |
| `assets/`                            | Untouched originals as supplied                      |

The 3D hero mark is built from the original vector coordinates supplied for the
logo (see `LOGO` in `src/js/modules/monogram.js`), so its edges are exact. The
monogram SVG was traced from the supplied PNG for the favicon and the inline
sprite. The Lottie plays in the preloader and as the preview for the identity
project.

## Accessibility and motion

- `prefers-reduced-motion` is honoured everywhere: the preloader is skipped,
  Lenis is not started, the custom cursor stays off, reveals resolve instantly,
  the marquee holds still and the 3D mark stops drifting.
- The custom cursor only replaces the native one on devices with a fine pointer
  and hover.
- There is a skip link, visible focus rings, an accessible accordion
  (`aria-expanded`), and the journey detail panels close on Escape.

## Deploying

`npm run build` produces a fully static `dist/` — no server, no database, no
environment variables. Drop it on Netlify, Vercel, Cloudflare Pages, GitHub
Pages or any static host.

Before going live, set the canonical URL and Open Graph URL in `index.html` to
the real domain, and add an Open Graph image (`public/og.png` plus
`<meta property="og:image">`) for link previews.

## Client portal

`portal/` is a separate Next.js app for `portal.melanieberberette.design`, where
clients sign agreements and follow project status. It has its own dependencies,
README, and Vercel project (set the project's Root Directory to `portal`). See
[`portal/README.md`](portal/README.md) for setup, Supabase configuration, and
the subdomain steps. The portfolio build is unaffected by it.
