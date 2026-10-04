# hamshamb.github.io

The personal site of **hamshamb**, a student developer in India, coding since 2021. Live at [hamshamb.github.io](https://hamshamb.github.io).

One scrolling home page (a scroll-driven hero, selected work, in the lab, more things, the 2021 to 2026 development history, about, stuff, contact) plus a prerendered case study for each flagship project at `/work/<slug>`.

## Stack

- [vinext](https://github.com/cloudflare/vinext) (Next.js App Router API on Vite) with `output: "export"`
- React 19, TypeScript, plain CSS with design tokens in `app/globals.css`
- [Motion](https://motion.dev) for interface motion, [Anime.js v4](https://animejs.com) for choreography
- Self-hosted variable fonts: Schibsted Grotesk and JetBrains Mono (Fontsource)

## Local development

Requires Node.js 22.13 or newer.

    npm install
    npm run dev

Checks:

    npm run lint
    npm run typecheck
    npm run build
    npm test

`npm test` reads the static export in `dist/client`, so run it after a build. CI runs the build and tests before every deploy.

## Where things live

    content/portfolio.ts   projects, lab work, forks, journey, bio, now, skills (server only)
    content/site.ts        small client-safe facts: owner, nav sections, phase labels
    app/                   layout, home page, /work/[slug] case studies, 404
    components/home/       home page sections
    components/home/engine.ts  geometry and labels of the hero's build engine drawing
    components/layout/     header (nav, mobile menu) and footer
    components/ui/         command palette, copy email, theme toggle, icons
    components/motion/     Motion provider and scroll reveal
    lib/motion.ts          shared motion tokens (durations, easing, springs)
    lib/anime.ts           the same tokens for Anime.js, plus the hero's timings and scroll stages
    lib/hero-state.ts      how the hero starts (static, scroll only, or with the timed opening)
    public/work/           project logos and optimised media

To add or edit a project, change `content/portfolio.ts` and add its URL to `public/sitemap.xml` (the tests fail if one is missing).

Content rules the tests enforce:

- `releasedOn` and `startedOn` are real dates. Unreleased work (Rivet, MX) has no date at all.
- The journey is development history. Development milestones (when something began, was prototyped, rewritten or hardened) carry a year only. The only exact dates in it are public releases and repositories, read straight from project data, so a development start can never be mistaken for a release.
- Forks live in their own list, labelled FORK, with credit to the upstream author. They are never projects.
- The Writing section is hidden. Its ideas stay in `futureWriting` so it can come back later.

## Motion

The two libraries never animate the same element.

- **Anime.js** owns choreography: the hero (a short timed opening on first visit, then the build engine drawing, assembling, exploding and reassembling as you scroll, plus the 2021 to 2026 hero rail), the journey rail drawn in step with the scroll, and the Rivet mesh diagram.
- **Motion** owns interface state: the active nav indicator, the work highlight and identity preview, the journey milestones arriving, command palette, mobile menu, copy feedback, theme icon, cube shuffle, and scroll reveals.
- **CSS** handles the case-study visual reveal, so it runs from the first paint without a flash.

The hero never takes over scrolling: on large screens the scene is sticky inside a taller section and the page scrolls natively. The timed opening plays once per session; repeat visits and background tabs skip it but keep the scroll-driven drawing.

With `prefers-reduced-motion`, the hero renders as a finished drawing, reveals are static and Motion drops transform animations. Without JavaScript, every section is still fully rendered, drawing included.

## Keyboard

- `/` or `Ctrl/Cmd + K` opens the command palette (sections, projects, copy email, theme)
- `Esc` closes the palette or the mobile menu

## vinext notes

These are workarounds for `vinext@1.0.0-beta.2`; revisit them when upgrading.

- `trailingSlash` is `false`. With `true`, dynamic routes fail to export (the prerenderer gets a 308).
- Internal links use plain anchors (`components/ui/AppLink.tsx`). Client-side navigation from `next/link` throws on a static export.
- Metadata routes (`robots.ts`, `sitemap.ts`) are not exported, so `public/robots.txt` and `public/sitemap.xml` are static files.

## Deployment

`.github/workflows/deploy-pages.yml` builds, runs the tests, and deploys `dist/client` to GitHub Pages on every push to `main`. Pages must use **GitHub Actions** as its source.
