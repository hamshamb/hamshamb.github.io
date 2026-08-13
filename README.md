# PORTFOLIO/OS

An interactive, terminal-inspired developer portfolio for **hamshamb**. It combines an old-school phosphor CRT aesthetic with an accessible, responsive one-page interface.

## Features

- Clickable OS-style launcher and keyboard-friendly navigation
- Working terminal commands, history, and tab completion
- Shareable hash links for every section and project case study
- Green and amber phosphor profiles with persistent preferences
- Optional CRT effects and reduced-motion support
- Real project content sourced from [StudyFilter](https://github.com/hamshamb/StudyFilter), [AreUHuman](https://github.com/hamshamb/AreUHuman), and [PyForge](https://github.com/hamshamb/PyForge)
- Static export and GitHub Pages deployment workflow

## Commands

`help`, `whoami`, `about`, `projects`, `open pyforge`, `experience`, `skills`, `contact`, `status`, `theme green`, `theme amber`, `fx on`, `fx off`, and `clear`.

## Customize

Update identity, links, projects, skills, and timeline data in `app/portfolio-data.ts`. The interface behavior lives in `app/TerminalOS.tsx`, and the visual system lives in `app/globals.css`.

## Local development

```bash
npm install
npm run dev
```

Run quality checks with:

```bash
npm run lint
npm run build
npm test
```

## GitHub Pages

The workflow in `.github/workflows/deploy-pages.yml` builds the static export and deploys `dist/client`. After pushing the repository, choose **GitHub Actions** as the Pages source in the repository settings.
