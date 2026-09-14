# PORTFOLIO/OS

The interactive developer portfolio for **hamshamb**. Version 3 keeps the phosphor terminal identity and turns it into a complete, accessible portfolio operating system.

## What is inside

- Seven-part OS launcher: identity, projects, logbook, field notes, stack, and contact
- Five original public builds, with GitHub forks explicitly excluded
- Rich project records with status, decisions, limits, verified features, and direct source links
- A chronological build log derived from the same project data
- Three full field notes about OSINT ethics, interface design, and geopolitics
- Expanded language and engineering stack across Python, Java, JavaScript, TypeScript, C#, C++, Rust, React, and Node.js
- Working terminal commands, history, tab completion, keyboard shortcuts, and shareable hash routes
- Green, amber, and cyan phosphor profiles with persistent preferences
- Optional CRT effects and full reduced-motion support
- Responsive layouts designed for desktop, tablet, and mobile
- Static GitHub Pages deployment with portfolio-specific metadata and structured data

## Original work index

- [Nexus](https://github.com/hamshamb/nexus)
- [CHC Review Studio](https://github.com/hamshamb/chc-review-studio)
- [AreUHuman](https://github.com/hamshamb/AreUHuman)
- [StudyFilter](https://github.com/hamshamb/StudyFilter)
- [PyForge](https://github.com/hamshamb/PyForge)

Forked repositories are intentionally not displayed as authored portfolio projects.

## Terminal commands

Try help, whoami, projects, latest, open nexus, open chc-review-studio, open areuhuman, open studyfilter, open pyforge, log, blog, read osint-starts-with-restraint, skills, interests, contact, status, theme green, theme amber, theme cyan, fx on, fx off, and clear.

Keyboard controls:

- / focuses the command line
- Up and Down browse command history
- Tab completes a command
- Alt+1 through Alt+7 navigate the launcher
- Ctrl/Cmd+L clears terminal output
- Esc skips the first boot animation

## Content model

Update projects, identity, interests, skills, and field notes in app/portfolio-data.ts. The release log is always derived newest-first from the project records, so project status and chronology stay aligned.

## Local development

Requires Node.js 22 or newer.

    npm install
    npm run dev

Quality checks:

    npm run lint
    npm run build
    npm test

## GitHub Pages

The workflow in .github/workflows/deploy-pages.yml builds the static export and deploys dist/client. GitHub Pages must use **GitHub Actions** as its source.
