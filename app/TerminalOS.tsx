"use client";

import {
  type CSSProperties,
  type FormEvent,
  type KeyboardEvent,
  useCallback,
  useEffect,
  useRef,
  useState,
} from "react";
import { commandNames, latestProject, portfolio, releaseLog, type Project } from "./portfolio-data";

type View = "home" | "about" | "projects" | "experience" | "skills" | "contact";
type Theme = "green" | "amber";
type LogEntry = { command: string; message: string };
type StaggerStyle = CSSProperties & { "--stagger": string };

const viewLabels: { id: View; label: string; shortcut: string }[] = [
  { id: "home", label: "HOME", shortcut: "01" },
  { id: "about", label: "ABOUT", shortcut: "02" },
  { id: "projects", label: "PROJECTS", shortcut: "03" },
  { id: "experience", label: "RELEASES", shortcut: "04" },
  { id: "skills", label: "TOOLBOX", shortcut: "05" },
  { id: "contact", label: "CONTACT", shortcut: "06" },
];

const stagger = (index: number): StaggerStyle => ({ "--stagger": `${index * 70}ms` });

function ProjectCard({
  project,
  index,
  isLatest,
  onOpen,
}: {
  project: Project;
  index: number;
  isLatest: boolean;
  onOpen: () => void;
}) {
  const hiddenTags = Math.max(0, project.stack.length - 4);

  return (
    <article className="project-card" style={stagger(index)}>
      <div className="project-index" aria-hidden="true">
        <span>{String(index + 1).padStart(2, "0")}</span>
        <b>PUBLISHED</b>
      </div>
      <div className="project-card-main">
        <div className="project-meta">
          <time dateTime={project.releasedOn}>RELEASED {project.releaseLabel}</time>
          <span>{project.availability}</span>
          {isLatest && <strong>LATEST</strong>}
        </div>
        <p className="eyebrow">{project.eyebrow}</p>
        <h3>{project.name}</h3>
        <p>{project.description}</p>
        <div className="tag-row" aria-label="Technologies">
          {project.stack.slice(0, 4).map((item) => <span key={item}>{item}</span>)}
          {hiddenTags > 0 && <span>+{hiddenTags}</span>}
        </div>
      </div>
      <div className="project-card-actions">
        <button className="text-button" onClick={onOpen} aria-label={`Open ${project.name} case study`}>
          READ CASE STUDY <span aria-hidden="true">→</span>
        </button>
        {project.live && (
          <a href={project.live} target="_blank" rel="noopener noreferrer" aria-label={`Open live ${project.name} app`}>
            LIVE <span aria-hidden="true">↗</span>
          </a>
        )}
      </div>
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
  const [copiedProject, setCopiedProject] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const contentRef = useRef<HTMLDivElement>(null);
  const shouldFocusContent = useRef(false);

  const navigate = useCallback((nextView: View, nextProject: Project | null = null, focusContent = true) => {
    shouldFocusContent.current = focusContent;
    setCopiedProject(false);
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
    const timer = window.setTimeout(applySavedState, reduceMotion || visited ? 0 : 1100);
    return () => window.clearTimeout(timer);
  }, []);

  useEffect(() => {
    const updateClock = () => setClock(new Intl.DateTimeFormat("en", {
      hour: "2-digit",
      minute: "2-digit",
      hour12: false,
      timeZone: "Asia/Kolkata",
    }).format(new Date()));
    updateClock();
    const timer = window.setInterval(updateClock, 30000);
    return () => window.clearInterval(timer);
  }, []);

  useEffect(() => {
    const readHash = () => {
      shouldFocusContent.current = false;
      const hash = window.location.hash.replace("#", "");
      if (hash.startsWith("project-")) {
        const match = portfolio.projects.find((item) => item.slug === hash.replace("project-", ""));
        if (match) {
          setProject(match);
          setView("projects");
        }
      } else if (viewLabels.some((item) => item.id === hash)) {
        setProject(null);
        setView(hash as View);
      }
    };
    readHash();
    window.addEventListener("popstate", readHash);
    window.addEventListener("hashchange", readHash);
    return () => {
      window.removeEventListener("popstate", readHash);
      window.removeEventListener("hashchange", readHash);
    };
  }, []);

  useEffect(() => {
    const content = contentRef.current;
    if (!content) return;
    content.scrollTop = 0;
    if (!shouldFocusContent.current) return;
    const frame = window.requestAnimationFrame(() => {
      content.querySelector<HTMLElement>("h1, h2")?.focus();
      shouldFocusContent.current = false;
    });
    return () => window.cancelAnimationFrame(frame);
  }, [view, project]);

  const setThemeAndSave = (next: Theme) => {
    setTheme(next);
    window.localStorage.setItem("portfolio-theme", next);
  };

  const setFxAndSave = (next: boolean) => {
    setFx(next);
    window.localStorage.setItem("portfolio-fx", next ? "on" : "off");
  };

  const execute = useCallback((raw: string, focusContent = false) => {
    const command = raw.trim().toLowerCase().replace(/\s+/g, " ");
    if (!command) return;
    setHistory((items) => [...items.slice(-19), command]);
    setHistoryIndex(-1);

    let message = "Command not found. Type ‘help’ to list available commands.";
    let target: View | null = null;
    let targetProject: Project | null = null;

    if (["whoami", "home"].includes(command)) {
      target = "home";
      message = "Identity record loaded.";
    } else if (command === "about") {
      target = "about";
      message = "Opening /usr/hamshamb/about.txt";
    } else if (["projects", "ls", "ls projects"].includes(command)) {
      target = "projects";
      message = `${portfolio.projects.length} shipped project records found.`;
    } else if (["latest", "open latest"].includes(command)) {
      target = "projects";
      targetProject = latestProject;
      message = `Latest release: ${latestProject.name} · ${latestProject.releaseLabel}`;
    } else if (command.startsWith("open ") || command.startsWith("./projects/")) {
      const slug = command.replace("open ", "").replace("./projects/", "");
      targetProject = portfolio.projects.find((item) => item.slug === slug) ?? null;
      if (targetProject) {
        target = "projects";
        message = `Executing ./projects/${slug}`;
      } else {
        message = `No project named “${slug}”. Try ‘projects’.`;
      }
    } else if (["experience", "log", "career", "releases"].includes(command)) {
      target = "experience";
      message = "Reading ~/releases.log · 3 production entries";
    } else if (["skills", "toolbox", "stack"].includes(command)) {
      target = "skills";
      message = "Toolchain mounted.";
    } else if (["contact", "sudo hire-me"].includes(command)) {
      target = "contact";
      message = command.startsWith("sudo") ? "Permission granted. Opening secure channel." : "Opening contact channel.";
    } else if (["status", "system status"].includes(command)) {
      message = `ONLINE · 3 systems shipped · latest ${latestProject.name.toLowerCase()} ${latestProject.releasedOn}`;
    } else if (command === "help") {
      message = "whoami · projects · latest · releases · open <project> · about · skills · contact · status · theme green|amber · fx on|off · clear";
    } else if (command === "theme green" || command === "theme amber") {
      const next = command.endsWith("amber") ? "amber" : "green";
      setThemeAndSave(next);
      message = `${next.toUpperCase()} phosphor profile applied.`;
    } else if (command === "fx on" || command === "fx off") {
      const next = command.endsWith("on");
      setFxAndSave(next);
      message = `CRT effects ${next ? "enabled" : "disabled"}.`;
    } else if (command === "clear") {
      setLog([]);
      setInput("");
      return;
    }

    setLog((items) => [...items.slice(-4), { command, message }]);
    if (target) navigate(target, targetProject, focusContent);
    setInput("");
  }, [navigate]);

  const submit = (event: FormEvent) => {
    event.preventDefault();
    execute(input);
  };

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
      const typed = input.trim().toLowerCase();
      const match = typed ? commandNames.find((name) => name.startsWith(typed) && name !== typed) : undefined;
      if (match) {
        event.preventDefault();
        setInput(match);
      }
    }
  };

  useEffect(() => {
    const shortcut = (event: globalThis.KeyboardEvent) => {
      const target = event.target as HTMLElement | null;
      const isTyping = target?.tagName === "INPUT" || target?.tagName === "TEXTAREA";

      if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === "l") {
        event.preventDefault();
        setLog([]);
        setInput("");
        inputRef.current?.focus();
      } else if (event.key === "Escape" && booting) {
        setBooting(false);
      } else if (event.key === "/" && !isTyping) {
        event.preventDefault();
        inputRef.current?.focus();
      } else if (event.altKey && /^[1-6]$/.test(event.key)) {
        event.preventDefault();
        const destination = viewLabels[Number(event.key) - 1];
        if (destination) navigate(destination.id);
      }
    };
    window.addEventListener("keydown", shortcut);
    return () => window.removeEventListener("keydown", shortcut);
  }, [booting, navigate]);

  const copyEmail = async () => {
    try {
      await navigator.clipboard.writeText(portfolio.owner.email);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 1800);
    } catch {
      window.location.href = `mailto:${portfolio.owner.email}`;
    }
  };

  const copyProjectLink = async () => {
    try {
      await navigator.clipboard.writeText(window.location.href);
      setCopiedProject(true);
      window.setTimeout(() => setCopiedProject(false), 1800);
    } catch {
      setCopiedProject(false);
    }
  };

  const renderView = () => {
    if (project) {
      const currentIndex = portfolio.projects.findIndex((item) => item.slug === project.slug);
      const previousProject = portfolio.projects[(currentIndex - 1 + portfolio.projects.length) % portfolio.projects.length];
      const nextProject = portfolio.projects[(currentIndex + 1) % portfolio.projects.length];

      return (
        <section className="view case-study" aria-labelledby="project-title">
          <button className="back-button" onClick={() => navigate("projects")}>← BACK TO /PROJECTS</button>
          <div className="case-meta" aria-label="Project details">
            <div><span>RELEASED</span><time dateTime={project.releasedOn}>{project.releaseLabel}</time></div>
            <div><span>STATUS</span><strong>● {project.availability}</strong></div>
            <div><span>ROLE</span><b>{project.role}</b></div>
          </div>
          <p className="eyebrow">RUNNING ./PROJECTS/{project.slug.toUpperCase()}</p>
          <h2 id="project-title" tabIndex={-1}>{project.name}</h2>
          <p className="large-copy case-lede">{project.description}</p>

          <div className="metric-grid" aria-label={`${project.name} project facts`}>
            {project.metrics.map((metric) => (
              <div key={metric.label}><strong>{metric.value}</strong><span>{metric.label}</span></div>
            ))}
          </div>

          <div className="case-narrative">
            <article className="story-wide">
              <span>01 / WHY IT NEEDED TO EXIST</span>
              <p>{project.problem}</p>
            </article>
            <article>
              <span>02 / WHAT I MADE</span>
              <p>{project.built}</p>
            </article>
            <article>
              <span>03 / WHAT CHANGED</span>
              <p>{project.result}</p>
            </article>
          </div>

          <section className="feature-section" aria-labelledby="features-title">
            <div className="section-heading compact">
              <h3 id="features-title">What’s inside.</h3>
              <span>{String(project.highlights.length).padStart(2, "0")} FEATURE NOTES</span>
            </div>
            <ul className="feature-grid">
              {project.highlights.map((feature, index) => (
                <li key={feature} style={stagger(index)}><span>{String(index + 1).padStart(2, "0")}</span>{feature}</li>
              ))}
            </ul>
          </section>

          {project.note && <p className="case-note"><span>NOTE</span>{project.note}</p>}

          <div className="case-footer">
            <div className="tag-row" aria-label="Project technologies">{project.stack.map((item) => <span key={item}>{item}</span>)}</div>
            <div className="case-links">
              {project.live && <a className="primary-button" href={project.live} target="_blank" rel="noopener noreferrer">OPEN LIVE APP ↗</a>}
              <a className="secondary-button" href={project.source} target="_blank" rel="noopener noreferrer">VIEW REPOSITORY ↗</a>
              <button className="secondary-button copy-link" onClick={copyProjectLink} aria-live="polite">{copiedProject ? "LINK COPIED ✓" : "COPY CASE LINK"}</button>
            </div>
          </div>

          <nav className="project-switcher" aria-label="Browse project case studies">
            <button onClick={() => navigate("projects", previousProject)}><span>← PREVIOUS</span><strong>{previousProject.name}</strong></button>
            <button onClick={() => navigate("projects", nextProject)}><span>NEXT →</span><strong>{nextProject.name}</strong></button>
          </nav>
        </section>
      );
    }

    if (view === "home") return (
      <section className="view hero" aria-labelledby="hero-title">
        <p className="eyebrow">SYS://IDENTITY · VERIFIED</p>
        <p className="prompt-line"><span>guest@portfolio</span>:~$ whoami</p>
        <h1 id="hero-title" tabIndex={-1}>{portfolio.owner.name}<span className="cursor" aria-hidden="true">_</span></h1>
        <p className="role">{portfolio.owner.role}</p>
        <p className="manifesto">{portfolio.owner.statement}</p>

        <button className="latest-release" onClick={() => navigate("projects", latestProject)}>
          <span><i aria-hidden="true" /> LATEST RELEASE</span>
          <strong>{latestProject.name}</strong>
          <time dateTime={latestProject.releasedOn}>{latestProject.releaseLabel}</time>
          <b aria-hidden="true">OPEN →</b>
        </button>

        <div className="identity-grid">
          <div><span>BASED</span><strong>{portfolio.owner.location}</strong></div>
          <div><span>SHIPPED</span><strong>{String(portfolio.projects.length).padStart(2, "0")} PRODUCTION SYSTEMS</strong></div>
          <div><span>STATUS</span><strong className="status-copy">● {portfolio.owner.status}</strong></div>
        </div>
        <div className="hero-actions">
          <button className="primary-button" onClick={() => navigate("projects")}>EXPLORE THE WORK <span>↗</span></button>
          <button className="secondary-button" onClick={() => navigate("contact")}>START A CONVERSATION</button>
        </div>
        <div className="quick-commands" aria-label="Quick terminal commands">
          <span>TRY A COMMAND</span>
          <button onClick={() => execute("latest", true)}>latest</button>
          <button onClick={() => execute("releases", true)}>releases</button>
          <button onClick={() => { setInput("help"); inputRef.current?.focus(); }}>help</button>
        </div>
      </section>
    );

    if (view === "about") return (
      <section className="view" aria-labelledby="about-title">
        <p className="eyebrow">/USR/HAMSHAMB/ABOUT.TXT</p>
        <h2 id="about-title" tabIndex={-1}>I build around the person<br />using the thing.</h2>
        <div className="prose-block">{portfolio.owner.bio.map((line) => <p key={line}>{line}</p>)}</div>
        <div className="principle-grid" aria-label="Working principles">
          {portfolio.owner.principles.map((principle, index) => (
            <article key={principle.title} style={stagger(index)}>
              <span>{String(index + 1).padStart(2, "0")}</span>
              <h3>{principle.title}</h3>
              <p>{principle.detail}</p>
            </article>
          ))}
        </div>
        <blockquote>“The best tool does not make people feel technical. It makes the next useful step feel obvious.”</blockquote>
      </section>
    );

    if (view === "projects") return (
      <section className="view" aria-labelledby="projects-title">
        <p className="eyebrow">LS -LA ~/PROJECTS --SHIPPED</p>
        <div className="section-heading">
          <div><h2 id="projects-title" tabIndex={-1}>Work that made it<br />into the world.</h2><p>Three different products, each built around a frustrating workflow worth simplifying.</p></div>
          <span>{String(portfolio.projects.length).padStart(2, "0")} SHIPPED SYSTEMS</span>
        </div>
        <div className="project-list">
          {portfolio.projects.map((item, index) => (
            <ProjectCard
              key={item.slug}
              project={item}
              index={index}
              isLatest={item.slug === latestProject.slug}
              onOpen={() => navigate("projects", item)}
            />
          ))}
        </div>
      </section>
    );

    if (view === "experience") return (
      <section className="view" aria-labelledby="log-title">
        <p className="eyebrow">TAIL -N 03 ~/RELEASES.LOG</p>
        <div className="section-heading release-heading">
          <div><h2 id="log-title" tabIndex={-1}>Release log.</h2><p>Three shipped systems. Exact dates, real products, and what crossed the finish line.</p></div>
          <span>NEWEST FIRST</span>
        </div>
        <div className="timeline">
          {releaseLog.map((item, index) => (
            <article key={item.slug} style={stagger(index)}>
              <div className="timeline-date">
                <i aria-hidden="true" />
                <time dateTime={item.releasedOn}>{item.releaseLabel}</time>
                {index === 0 && <span>LATEST</span>}
              </div>
              <div className="timeline-entry">
                <code>$ release {item.slug} --channel production</code>
                <h3>{item.name} shipped.</h3>
                <p>{item.releaseNote}</p>
                <button onClick={() => navigate("projects", item)}>READ THE CASE STUDY <span aria-hidden="true">→</span></button>
              </div>
            </article>
          ))}
        </div>
      </section>
    );

    if (view === "skills") return (
      <section className="view" aria-labelledby="skills-title">
        <p className="eyebrow">MOUNT /DEV/TOOLBOX</p>
        <h2 id="skills-title" tabIndex={-1}>A practical working set.</h2>
        <p className="large-copy toolbox-intro">The stack changes with the problem. The through-line is product thinking, clear interaction, and enough engineering discipline to ship confidently.</p>
        <div className="skills-grid">
          {portfolio.skills.map((set, index) => (
            <article key={set.group} style={stagger(index)}>
              <span>{String(index + 1).padStart(2, "0")} / {set.group}</span>
              {set.items.map((item) => <p key={item}>+ {item}</p>)}
            </article>
          ))}
        </div>
        <p className="toolbox-note"><span>DEFAULT MODE</span> Learn the system, choose the smallest reliable architecture, keep the interface honest, then ship.</p>
      </section>
    );

    return (
      <section className="view contact" aria-labelledby="contact-title">
        <p className="eyebrow">./CONTACT --OPEN</p>
        <h2 id="contact-title" tabIndex={-1}>Let’s make something<br />worth shipping.</h2>
        <p className="large-copy">Have a useful idea or a frustrating workflow that deserves a better tool? Tell me what you’re trying to make.</p>
        <div className="contact-links">
          <a href={`mailto:${portfolio.owner.email}`}><span>EMAIL</span>{portfolio.owner.email}<b>↗</b></a>
          <a href={portfolio.owner.github} target="_blank" rel="noopener noreferrer"><span>GITHUB</span>{portfolio.owner.handle}<b>↗</b></a>
        </div>
        <button className="secondary-button" onClick={copyEmail}>{copied ? "COPIED TO CLIPBOARD ✓" : "COPY EMAIL"}</button>
        <p className="sr-only" role="status" aria-live="polite">{copied ? "Email copied to clipboard." : ""}</p>
      </section>
    );
  };

  if (booting) return (
    <main className="boot-screen" data-theme={theme}>
      <div className="boot-mark">H<span>/</span>OS</div>
      <div className="boot-copy">
        <p>PORTFOLIO/OS v2.0</p>
        <p>CHECKING MEMORY ........ OK</p>
        <p>INDEXING RELEASES ...... 03 FOUND</p>
        <p>LOADING CASE STUDIES ... OK</p>
        <p>CALIBRATING PHOSPHOR ... OK</p>
      </div>
      <button onClick={() => setBooting(false)}>SKIP BOOT [ESC]</button>
    </main>
  );

  return (
    <main className={`os-shell${fx ? " fx-on" : " fx-off"}`} data-theme={theme}>
      <a className="skip-link" href="#main-content">Skip to portfolio content</a>
      <div className="crt-overlay" aria-hidden="true" />
      <header className="system-bar">
        <div className="system-brand"><span className="brand-block">H/</span><b>PORTFOLIO/OS</b><span>v2.0.0</span></div>
        <div className="system-actions">
          <span className="online"><i /> ONLINE</span>
          <button onClick={() => setThemeAndSave(theme === "green" ? "amber" : "green")} aria-label="Toggle green and amber theme" aria-pressed={theme === "amber"}>PHOSPHOR: {theme.toUpperCase()}</button>
          <button onClick={() => setFxAndSave(!fx)} aria-pressed={fx}>FX: {fx ? "ON" : "OFF"}</button>
          <time dateTime={clock}>{clock} IST</time>
        </div>
      </header>
      <div className="os-body">
        <aside className="launcher" aria-label="Portfolio launcher">
          <p>LAUNCHER <span>ALT + 1–6</span></p>
          <nav>
            {viewLabels.map((item) => {
              const active = view === item.id && !project;
              return (
                <button key={item.id} className={active ? "active" : ""} aria-current={active ? "page" : undefined} onClick={() => navigate(item.id)}>
                  <span>{item.shortcut}</span>{item.label}<kbd>↵</kbd>
                </button>
              );
            })}
          </nav>
          <div className="launcher-foot"><span>RELEASE INDEX</span><i><b /></i><small>03 / 03 ONLINE</small></div>
        </aside>
        <section className="terminal-window" aria-label="Interactive portfolio terminal">
          <div className="window-chrome"><div><span /><span /><span /></div><p>guest@portfolio: ~/{project ? `projects/${project.slug}` : view}</p><b>80 × 24</b></div>
          <div id="main-content" ref={contentRef} className="window-content" tabIndex={-1}>
            <div key={`${view}:${project?.slug ?? "index"}`} className="view-stage">{renderView()}</div>
          </div>
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
      <footer className="status-bar"><span>MODE: <b>NORMAL</b></span><span className="footer-hint">/ FOCUS&nbsp;&nbsp; ↑↓ HISTORY&nbsp;&nbsp; TAB COMPLETE&nbsp;&nbsp; ALT+1–6 NAVIGATE&nbsp;&nbsp; CTRL+L CLEAR</span><span>© 2026 HAMSHAMB</span></footer>
    </main>
  );
}
