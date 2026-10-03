# hamshamb.github.io

The personal site of **hamshamb**: a student who makes stuff. Live at [hamshamb.github.io](https://hamshamb.github.io).

One scrolling home page (work, build log, about, stuff, writing, contact) plus a prerendered case study for each project at `/work/<slug>`.

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

    content/portfolio.ts   projects, bio, now, skills, writing ideas (server only)
    content/site.ts        small client-safe facts: owner, nav sections, phase labels
    app/                   layout, home page, /work/[slug] case studies, 404
    components/home/       home page sections
    components/layout/     header (nav, mobile menu) and footer
    components/ui/         command palette, copy email, theme toggle, icons
    components/motion/     Motion provider and scroll reveal
    lib/motion.ts          shared motion tokens (durations, easing, springs)
    lib/anime.ts           the same tokens for Anime.js
    public/work/           optimised project media (WebP)

To add or edit a project, change `content/portfolio.ts` and add its URL to `public/sitemap.xml` (the tests fail if one is missing). The build log and chart are derived from project dates. Forks are not listed as projects.

## Motion

The two libraries never animate the same element.

- **Anime.js** owns choreography: the hero intro (masked headline words, then the hand-drawn underline) and the release chart bars growing in.
- **Motion** owns interface state: the active nav indicator, work list highlight and preview, command palette, mobile menu, copy feedback, theme icon, cube shuffle, and scroll reveals.

With `prefers-reduced-motion`, the hero, chart and reveals render static and Motion drops transform animations. Without JavaScript, every section is still fully rendered.

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
