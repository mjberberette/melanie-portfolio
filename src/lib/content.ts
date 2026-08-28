/**
 * Single source of truth for every word on the site.
 * Edit here — no copy is hardcoded inside components.
 */

export const site = {
  name: "Melanie Berberette",
  shortName: "MB",
  role: "Web & UX Designer",
  discipline: "Product design, design systems and interface craft",
  location: "Denver, Colorado",
  timezone: "America/Denver",
  email: "hello@melanieberberette.com",
  url: "https://melanieberberette.com",
  availability: {
    status: "Booking projects for Q4",
    open: true,
  },
  socials: [
    { label: "LinkedIn", href: "https://www.linkedin.com/" },
    { label: "Dribbble", href: "https://dribbble.com/" },
    { label: "Read.cv", href: "https://read.cv/" },
    { label: "Instagram", href: "https://www.instagram.com/" },
  ],
} as const;

export const nav = [
  { label: "Work", href: "#work" },
  { label: "Studio", href: "#studio" },
  { label: "Capabilities", href: "#capabilities" },
  { label: "Contact", href: "#contact" },
] as const;

export const hero = {
  eyebrow: "Independent designer — est. 2014",
  lines: ["Web & UX", "designer for", "ambitious teams"],
  standfirst:
    "I design digital products that feel inevitable — clear systems, considered motion, and interfaces people trust on the first click.",
  scrollCue: "Scroll to explore",
} as const;

export const marquee = [
  "Product Design",
  "Design Systems",
  "UX Research",
  "Art Direction",
  "Interaction Design",
  "Front-end",
  "Prototyping",
  "Brand Identity",
] as const;

export const manifesto = {
  eyebrow: "Approach",
  statement:
    "Good design is not decoration. It is the shortest path between a person and what they came to do — built once, documented properly, and beautiful enough that the team defends it.",
  paragraphs: [
    "I work as an embedded partner rather than a vendor. That means sitting in the messy part of the problem with your team, pressure-testing the strategy before a single frame is drawn, and staying through implementation so the thing that ships is the thing we designed.",
    "Twelve years across fintech, healthcare and commerce taught me that the hard part is rarely the pixels. It is the alignment: naming the tradeoffs out loud, making the invisible system legible, and giving engineers a spec they actually want to build.",
  ],
  signature: "— Melanie",
} as const;

export type Project = {
  id: string;
  index: string;
  title: string;
  subtitle: string;
  summary: string;
  year: string;
  role: string[];
  metric: { value: string; label: string };
  /**
   * Optional looping preview that plays on hover, heynesh-style.
   * Drop an .mp4 into /public/media and point at it, e.g.
   * `video: "/media/mb-identity.mp4"`. It takes priority over everything else.
   */
  video?: string;
  poster?: string;
  /** Renders the animated monogram instead of an image. */
  lottie?: boolean;
  accent: string;
};

export const projects: Project[] = [
  {
    id: "mb-identity",
    index: "01",
    title: "Identity in Motion",
    subtitle: "Melanie Berberette — Studio brand",
    summary:
      "An isometric monogram built as a single continuous ribbon, then rigged so every stroke draws itself in sequence. One mark that works as a favicon, a loader and a six-second title card.",
    year: "2026",
    role: ["Brand Identity", "Motion Design", "Art Direction"],
    metric: { value: "1 mark", label: "12 states" },
    lottie: true,
    accent: "#ff4a1c",
  },
  {
    id: "halden",
    index: "02",
    title: "Halden Capital",
    subtitle: "Institutional trading, made legible",
    summary:
      "A dense treasury platform rebuilt around a single density system. We replaced eleven bespoke table patterns with one, and cut the time analysts spend reconciling positions from hours to minutes.",
    year: "2025",
    role: ["Product Design", "Design System", "Front-end"],
    metric: { value: "−68%", label: "time to reconcile" },
    accent: "#7c9cff",
  },
  {
    id: "verso",
    index: "03",
    title: "Verso",
    subtitle: "An editorial CMS with a point of view",
    summary:
      "Writing tools for newsrooms that hold opinions. Structured content modelling, a block editor that never fights the writer, and a publishing flow designed around deadline pressure.",
    year: "2025",
    role: ["UX Architecture", "Prototyping", "Design System"],
    metric: { value: "4.8/5", label: "editor satisfaction" },
    accent: "#d7ff5c",
  },
  {
    id: "field-foundry",
    index: "04",
    title: "Field & Foundry",
    subtitle: "Commerce for a slow-made brand",
    summary:
      "A storefront that sells craft by showing the making. Full art direction, a photography system the team can reshoot forever, and a checkout stripped to three decisions.",
    year: "2024",
    role: ["Art Direction", "Web Design", "Commerce"],
    metric: { value: "+41%", label: "conversion lift" },
    accent: "#ffb35c",
  },
  {
    id: "kinnect",
    index: "05",
    title: "Kinnect Health",
    subtitle: "Care coordination without the clipboard",
    summary:
      "Eighteen shadowing sessions in clinics produced one insight: nurses were designing around the software. So we designed around the nurses instead — one queue, one truth, zero double entry.",
    year: "2024",
    role: ["UX Research", "Service Design", "Accessibility"],
    metric: { value: "AA+", label: "WCAG compliance" },
    accent: "#8fe3c4",
  },
];

export const capabilities = [
  {
    number: "01",
    title: "Product & UX Design",
    blurb:
      "End-to-end interface design for complex products — information architecture, flows, states, and the unglamorous edge cases that decide whether a product feels finished.",
    tags: ["Discovery", "IA & Flows", "Interface Design", "Usability Testing"],
  },
  {
    number: "02",
    title: "Design Systems",
    blurb:
      "Token architecture, component APIs and governance that survive team turnover. Built in Figma, documented for engineers, shipped as code when you need it.",
    tags: ["Tokens", "Component Libraries", "Documentation", "Governance"],
  },
  {
    number: "03",
    title: "Brand & Art Direction",
    blurb:
      "Identity systems designed for screens first — marks that scale to 16px, motion that carries the personality, and guidelines a marketing team can actually apply.",
    tags: ["Identity", "Motion", "Photography", "Guidelines"],
  },
  {
    number: "04",
    title: "Web Design & Build",
    blurb:
      "Marketing sites and portfolios designed and built by the same pair of hands. Next.js, GSAP, Lenis — accessible, fast, and animated with restraint.",
    tags: ["Next.js", "GSAP", "Webflow", "Performance"],
  },
] as const;

export const process = [
  {
    step: "01",
    title: "Orient",
    body: "A week inside your problem. Stakeholder interviews, a teardown of what exists, and an honest map of the constraints nobody wrote down.",
  },
  {
    step: "02",
    title: "Frame",
    body: "We agree on the one thing this project must be true about. Everything downstream gets measured against it — including my own ideas.",
  },
  {
    step: "03",
    title: "Design",
    body: "Weekly working sessions, not big reveals. You see rough thinking early and polished work late, so the direction is never a surprise.",
  },
  {
    step: "04",
    title: "Ship",
    body: "I stay through build. Specs, tokens, QA passes against real code, and a handover document your next designer will thank you for.",
  },
] as const;

export const stats = [
  { value: 12, suffix: "", label: "Years designing" },
  { value: 40, suffix: "+", label: "Products shipped" },
  { value: 9, suffix: "", label: "Design systems built" },
  { value: 3, suffix: "", label: "Industry awards" },
] as const;

export const testimonials = [
  {
    quote:
      "Melanie is the rare designer who makes the engineering team faster. She showed up with a token architecture in week two and we never argued about spacing again.",
    name: "Priya Raghavan",
    title: "VP Engineering, Halden Capital",
  },
  {
    quote:
      "She interrogated our roadmap before she touched Figma. Half the features we thought we needed quietly disappeared, and the product got better.",
    name: "Tom Alvarez",
    title: "Founder, Verso",
  },
  {
    quote:
      "The work is beautiful, but what sold our board was the clarity. Every decision had a reason, and she could explain it in one sentence.",
    name: "Dana Whitfield",
    title: "Chief Product Officer, Kinnect Health",
  },
] as const;

export const recognition = [
  { award: "Site of the Day", org: "Awwwards", year: "2025" },
  { award: "Honourable Mention", org: "Awwwards", year: "2024" },
  { award: "Design System of the Year — Finalist", org: "UX Awards", year: "2024" },
  { award: "Featured Studio", org: "Godly", year: "2023" },
] as const;

export const contact = {
  eyebrow: "Next project",
  headline: ["Let’s make", "something", "worth keeping"],
  body: "Tell me what you're building and where it's stuck. I read every message and reply within two working days.",
  cta: "Start a project",
} as const;
