"use client";

import { FormEvent, KeyboardEvent, useCallback, useEffect, useRef, useState } from "react";
import { commandNames, portfolio, type Project } from "./portfolio-data";

type View = "home" | "about" | "projects" | "experience" | "skills" | "contact";
type Theme = "green" | "amber";
type LogEntry = { command: string; message: string };

const viewLabels: { id: View; label: string; shortcut: string }[] = [
  { id: "home", label: "HOME", shortcut: "01" },
  { id: "about", label: "ABOUT", shortcut: "02" },
  { id: "projects", label: "PROJECTS", shortcut: "03" },
  { id: "experience", label: "LOG", shortcut: "04" },
  { id: "skills", label: "TOOLBOX", shortcut: "05" },
  { id: "contact", label: "CONTACT", shortcut: "06" },
];

function ProjectCard({ project, onOpen }: { project: Project; onOpen: () => void }) {
  return (
    <article className={`project-card${project.featured ? " featured" : ""}`}>
      <div className="project-index">{project.featured ? "FEATURED_01" : "LAB_02"}</div>
      <div>
        <p className="eyebrow">{project.eyebrow}</p>
        <h3>{project.name}</h3>
        <p>{project.description}</p>
        <div className="tag-row" aria-label="Technologies">
          {project.stack.map((item) => <span key={item}>{item}</span>)}
        </div>
      </div>
      <button className="text-button" onClick={onOpen} aria-label={`Open ${project.name} case study`}>
        OPEN CASE STUDY <span aria-hidden="true">↗</span>
      </button>
    </article>
  );
}

export function TerminalOS() {
  const [view, setView] = useState<View>("home");
  const [project, setProject] = useState<Project | null>(null);
  const [input, setInput] = useState("");
  const [history, setHistory] = useState<string[]>([]);
  const [historyIndex, setHistoryIndex] = useState(-1);
  const [log, setLog] = useState<LogEntry[]>([
    { command: "./boot --portfolio", message: "System ready. Type ‘help’ or use the launcher." },
  ]);
  const [theme, setTheme] = useState<Theme>("green");
  const [fx, setFx] = useState(true);
  const [booting, setBooting] = useState(true);
  const [clock, setClock] = useState("--:--");
  const [copied, setCopied] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const navigate = useCallback((nextView: View, nextProject: Project | null = null) => {
    setView(nextView);
    setProject(nextProject);
    const hash = nextProject ? `project-${nextProject.slug}` : nextView;
    window.history.pushState({ view: nextView, project: nextProject?.slug }, "", `#${hash}`);
  }, []);

  useEffect(() => {
    const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const visited = window.sessionStorage.getItem("portfolio-booted");
    const savedTheme = window.localStorage.getItem("portfolio-theme");
    const savedFx = window.localStorage.getItem("portfolio-fx");
    const applySavedState = () => {
      if (savedTheme === "amber" || savedTheme === "green") setTheme(savedTheme);
      if (savedFx === "off") setFx(false);
      window.sessionStorage.setItem("portfolio-booted", "true");
      setBooting(false);
    };
    const timer = window.setTimeout(applySavedState, reduceMotion || visited ? 0 : 900);
    return () => window.clearTimeout(timer);
  }, []);

  useEffect(() => {
    const updateClock = () => setClock(new Intl.DateTimeFormat("en", { hour: "2-digit", minute: "2-digit", hour12: false }).format(new Date()));
    updateClock();
    const timer = window.setInterval(updateClock, 30000);
    return () => window.clearInterval(timer);
  }, []);

  useEffect(() => {
    const readHash = () => {
      const hash = window.location.hash.replace("#", "");
      if (hash.startsWith("project-")) {
        const match = portfolio.projects.find((item) => item.slug === hash.replace("project-", ""));
        if (match) { setProject(match); setView("projects"); }
      } else if (viewLabels.some((item) => item.id === hash)) {
        setProject(null); setView(hash as View);
      }
    };
    readHash();
    window.addEventListener("popstate", readHash);
    return () => window.removeEventListener("popstate", readHash);
  }, []);

  const setThemeAndSave = (next: Theme) => {
    setTheme(next);
    window.localStorage.setItem("portfolio-theme", next);
  };

  const setFxAndSave = (next: boolean) => {
    setFx(next);
    window.localStorage.setItem("portfolio-fx", next ? "on" : "off");
  };

  const execute = useCallback((raw: string) => {
    const command = raw.trim().toLowerCase().replace(/\s+/g, " ");
    if (!command) return;
    setHistory((items) => [...items.slice(-19), command]);
    setHistoryIndex(-1);

    let message = "Command not found. Type ‘help’ to list available commands.";
    let target: View | null = null;
    let targetProject: Project | null = null;

    if (["whoami", "home"].includes(command)) { target = "home"; message = "Identity record loaded."; }
    else if (command === "about") { target = "about"; message = "Opening /usr/hamshamb/about.txt"; }
    else if (["projects", "ls", "ls projects"].includes(command)) { target = "projects"; message = `${portfolio.projects.length} project records found.`; }
    else if (command.startsWith("open ") || command.startsWith("./projects/")) {
      const slug = command.replace("open ", "").replace("./projects/", "");
      targetProject = portfolio.projects.find((item) => item.slug === slug) ?? null;
      if (targetProject) { target = "projects"; message = `Executing ./projects/${slug}`; }
      else message = `No project named “${slug}”. Try ‘projects’.`;
    }
    else if (["experience", "log", "career"].includes(command)) { target = "experience"; message = "Reading ~/career.log"; }
    else if (["skills", "toolbox", "stack"].includes(command)) { target = "skills"; message = "Toolchain mounted."; }
    else if (["contact", "sudo hire-me"].includes(command)) { target = "contact"; message = command.startsWith("sudo") ? "Permission granted. Opening secure channel." : "Opening contact channel."; }
    else if (["status", "system status"].includes(command)) { message = "ONLINE · open to collaborations · response channel available"; }
    else if (command === "help") { message = "whoami · about · projects · open <project> · experience · skills · contact · status · theme green|amber · fx on|off · clear"; }
    else if (command === "theme green" || command === "theme amber") { const next = command.endsWith("amber") ? "amber" : "green"; setThemeAndSave(next); message = `${next.toUpperCase()} phosphor profile applied.`; }
    else if (command === "fx on" || command === "fx off") { const next = command.endsWith("on"); setFxAndSave(next); message = `CRT effects ${next ? "enabled" : "disabled"}.`; }
    else if (command === "clear") { setLog([]); setInput(""); return; }

    setLog((items) => [...items.slice(-4), { command, message }]);
    if (target) navigate(target, targetProject);
    setInput("");
  }, [navigate]);

  const submit = (event: FormEvent) => { event.preventDefault(); execute(input); };

  const keyDown = (event: KeyboardEvent<HTMLInputElement>) => {
    if (event.key === "ArrowUp") {
      event.preventDefault();
      const next = Math.min(historyIndex + 1, history.length - 1);
      setHistoryIndex(next);
      if (history[next]) setInput(history[history.length - 1 - next]);
    } else if (event.key === "ArrowDown") {
      event.preventDefault();
      const next = historyIndex - 1;
      setHistoryIndex(next);
      setInput(next < 0 ? "" : history[history.length - 1 - next] ?? "");
    } else if (event.key === "Tab") {
      event.preventDefault();
      const match = commandNames.find((name) => name.startsWith(input.toLowerCase()));
      if (match) setInput(match);
    }
  };

  useEffect(() => {
    const shortcut = (event: globalThis.KeyboardEvent) => {
      if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === "l") {
        event.preventDefault();
        setLog([]);
        setInput("");
        inputRef.current?.focus();
      }
      if (event.key === "Escape" && booting) setBooting(false);
    };
    window.addEventListener("keydown", shortcut);
    return () => window.removeEventListener("keydown", shortcut);
  }, [booting]);

  const copyEmail = async () => {
    try {
      await navigator.clipboard.writeText(portfolio.owner.email);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 1800);
    } catch {
      window.location.href = `mailto:${portfolio.owner.email}`;
    }
  };

  const renderView = () => {
    if (project) return (
      <section className="view case-study" aria-labelledby="project-title">
        <button className="back-button" onClick={() => navigate("projects")}>← BACK TO /PROJECTS</button>
        <p className="eyebrow">RUNNING ./PROJECTS/{project.slug.toUpperCase()}</p>
        <h2 id="project-title">{project.name}</h2>
        <p className="large-copy">{project.description}</p>
        <div className="case-grid">
          <div><span>01 / PROBLEM</span><p>{project.problem}</p></div>
          <div><span>02 / BUILT</span><p>{project.built}</p></div>
          <div><span>03 / OUTCOME</span><p>{project.result}</p></div>
        </div>
        <div className="case-footer">
          <div className="tag-row">{project.stack.map((item) => <span key={item}>{item}</span>)}</div>
          <a className="primary-button" href={project.source} target="_blank" rel="noreferrer">VIEW ON GITHUB ↗</a>
        </div>
      </section>
    );

    if (view === "home") return (
      <section className="view hero" aria-labelledby="hero-title">
        <p className="eyebrow">SYS://IDENTITY · VERIFIED</p>
        <p className="prompt-line"><span>guest@portfolio</span>:~$ whoami</p>
        <h1 id="hero-title">{portfolio.owner.name}<span className="cursor" aria-hidden="true">_</span></h1>
        <p className="role">{portfolio.owner.role}</p>
        <p className="manifesto">{portfolio.owner.statement}</p>
        <div className="identity-grid">
          <div><span>BASED</span><strong>{portfolio.owner.location}</strong></div>
          <div><span>STATUS</span><strong className="status-copy">● {portfolio.owner.status}</strong></div>
        </div>
        <div className="hero-actions">
          <button className="primary-button" onClick={() => navigate("projects")}>VIEW PROJECTS <span>↗</span></button>
          <button className="secondary-button" onClick={() => navigate("contact")}>START A CONVERSATION</button>
        </div>
        <p className="hint">TIP: TYPE <button onClick={() => { setInput("help"); inputRef.current?.focus(); }}>HELP</button> OR USE THE LAUNCHER</p>
      </section>
    );

    if (view === "about") return (
      <section className="view" aria-labelledby="about-title">
        <p className="eyebrow">/USR/HAMSHAMB/ABOUT.TXT</p>
        <h2 id="about-title">Built for the person<br />on the other side.</h2>
        <div className="prose-block">{portfolio.owner.bio.map((line) => <p key={line}>{line}</p>)}</div>
        <blockquote>“Good tooling should make the powerful path feel like the obvious one.”</blockquote>
      </section>
    );

    if (view === "projects") return (
      <section className="view" aria-labelledby="projects-title">
        <p className="eyebrow">LS -LA ~/PROJECTS</p>
        <div className="section-heading"><h2 id="projects-title">Selected work.</h2><span>{String(portfolio.projects.length).padStart(2, "0")} ENTRIES</span></div>
        <div className="project-list">{portfolio.projects.map((item) => <ProjectCard key={item.slug} project={item} onOpen={() => navigate("projects", item)} />)}</div>
      </section>
    );

    if (view === "experience") return (
      <section className="view" aria-labelledby="log-title">
        <p className="eyebrow">TAIL -N 10 ~/CAREER.LOG</p>
        <h2 id="log-title">Build log.</h2>
        <div className="timeline">{portfolio.timeline.map((item) => <article key={item.date + item.title}><time>{item.date}</time><div><h3>{item.title}</h3><p>{item.detail}</p></div></article>)}</div>
      </section>
    );

    if (view === "skills") return (
      <section className="view" aria-labelledby="skills-title">
        <p className="eyebrow">MOUNT /DEV/TOOLBOX</p>
        <h2 id="skills-title">Working set.</h2>
        <div className="skills-grid">{portfolio.skills.map((set) => <article key={set.group}><span>{set.group}</span>{set.items.map((item) => <p key={item}>+ {item}</p>)}</article>)}</div>
      </section>
    );

    return (
      <section className="view contact" aria-labelledby="contact-title">
        <p className="eyebrow">./CONTACT --OPEN</p>
        <h2 id="contact-title">Let’s make something<br />worth shipping.</h2>
        <p className="large-copy">Have an ambitious tool, product, or strange little idea? Send the context.</p>
        <div className="contact-links">
          <a href={`mailto:${portfolio.owner.email}`}><span>EMAIL</span>{portfolio.owner.email}<b>↗</b></a>
          <a href={portfolio.owner.github} target="_blank" rel="noreferrer"><span>GITHUB</span>{portfolio.owner.handle}<b>↗</b></a>
        </div>
        <button className="secondary-button" onClick={copyEmail}>{copied ? "COPIED TO CLIPBOARD ✓" : "COPY EMAIL"}</button>
      </section>
    );
  };

  if (booting) return (
    <main className="boot-screen" data-theme={theme}>
      <div className="boot-mark">H<span>/</span>OS</div>
      <div className="boot-copy"><p>PORTFOLIO/OS v1.0</p><p>CHECKING MEMORY ........ OK</p><p>MOUNTING PROJECTS ..... OK</p><p>CALIBRATING PHOSPHOR .. OK</p></div>
      <button onClick={() => setBooting(false)}>SKIP BOOT [ESC]</button>
    </main>
  );

  return (
    <main className={`os-shell${fx ? " fx-on" : " fx-off"}`} data-theme={theme}>
      <a className="skip-link" href="#main-content">Skip to portfolio content</a>
      <div className="crt-overlay" aria-hidden="true" />
      <header className="system-bar">
        <div className="system-brand"><span className="brand-block">H/</span><b>PORTFOLIO/OS</b><span>v1.0.0</span></div>
        <div className="system-actions">
          <span className="online"><i /> ONLINE</span>
          <button onClick={() => setThemeAndSave(theme === "green" ? "amber" : "green")} aria-label="Toggle green and amber theme">PHOSPHOR: {theme.toUpperCase()}</button>
          <button onClick={() => setFxAndSave(!fx)}>FX: {fx ? "ON" : "OFF"}</button>
          <time>{clock} IST</time>
        </div>
      </header>
      <div className="os-body">
        <aside className="launcher" aria-label="Portfolio launcher">
          <p>LAUNCHER</p>
          <nav>{viewLabels.map((item) => <button key={item.id} className={view === item.id && !project ? "active" : ""} onClick={() => navigate(item.id)}><span>{item.shortcut}</span>{item.label}<kbd>↵</kbd></button>)}</nav>
          <div className="launcher-foot"><span>MEM</span><i><b /></i><small>64K OK</small></div>
        </aside>
        <section className="terminal-window" aria-label="Interactive portfolio terminal">
          <div className="window-chrome"><div><span /><span /><span /></div><p>guest@portfolio: ~/{project ? `projects/${project.slug}` : view}</p><b>80 × 24</b></div>
          <div id="main-content" className="window-content" tabIndex={-1}>{renderView()}</div>
          <div className="terminal-log" role="log" aria-live="polite" aria-label="Terminal command output">
            {log.slice(-2).map((entry, index) => <div key={`${entry.command}-${index}`}><p><span>guest@portfolio</span>:~$ {entry.command}</p><small>{entry.message}</small></div>)}
          </div>
          <form className="command-bar" onSubmit={submit} data-testid="command-form">
            <label htmlFor="command-input"><span>guest@portfolio</span>:~$</label>
            <input id="command-input" ref={inputRef} value={input} onChange={(event) => setInput(event.target.value)} onKeyDown={keyDown} autoComplete="off" spellCheck={false} aria-describedby="command-help" placeholder="type a command…" />
            <button type="submit" aria-label="Run command">RUN ↵</button>
          </form>
          <p id="command-help" className="sr-only">Type help for available commands. Use up and down arrow keys for command history and Tab for completion.</p>
        </section>
      </div>
      <footer className="status-bar"><span>MODE: <b>NORMAL</b></span><span className="footer-hint">↑↓ HISTORY&nbsp;&nbsp; TAB COMPLETE&nbsp;&nbsp; CTRL+L CLEAR</span><span>© 2026 HAMSHAMB</span></footer>
    </main>
  );
}
