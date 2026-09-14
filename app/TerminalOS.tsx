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
import {
  commandNames,
  latestPost,
  latestProject,
  portfolio,
  releaseLog,
  type BlogPost,
  type Project,
} from "./portfolio-data";

type View = "home" | "about" | "projects" | "log" | "blog" | "skills" | "contact";
type Theme = "green" | "amber" | "cyan";
type LogEntry = { command: string; message: string };
type StaggerStyle = CSSProperties & { "--stagger": string };

const viewLabels: { id: View; label: string; shortcut: string }[] = [
  { id: "home", label: "HOME", shortcut: "01" },
  { id: "about", label: "IDENTITY", shortcut: "02" },
  { id: "projects", label: "PROJECTS", shortcut: "03" },
  { id: "log", label: "LOGBOOK", shortcut: "04" },
  { id: "blog", label: "FIELD NOTES", shortcut: "05" },
  { id: "skills", label: "STACK", shortcut: "06" },
  { id: "contact", label: "CONTACT", shortcut: "07" },
];

const themeOrder: Theme[] = ["green", "amber", "cyan"];
const stagger = (index: number): StaggerStyle => ({ "--stagger": String(index * 65) + "ms" });

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
  return (
    <article className={"project-card phase-" + project.phase} style={stagger(index)}>
      <div className="project-sigil" aria-hidden="true">
        <strong>{project.sigil}</strong>
        <span>{String(index + 1).padStart(2, "0")}</span>
      </div>
      <div className="project-card-main">
        <div className="project-meta">
          <span className={"phase-pill " + project.phase}>● {project.availability}</span>
          <time dateTime={project.releasedOn}>{project.releaseLabel}</time>
          {isLatest && <b>LATEST</b>}
        </div>
        <p className="eyebrow">{project.eyebrow}</p>
        <h3>{project.name}</h3>
        <p>{project.description}</p>
        <div className="tag-row" aria-label="Technologies">
          {project.stack.slice(0, 5).map((item) => <span key={item}>{item}</span>)}
        </div>
      </div>
      <div className="project-card-actions">
        <button onClick={onOpen} aria-label={"Inspect " + project.name}>
          <span>INSPECT RECORD</span><b aria-hidden="true">→</b>
        </button>
        <a href={project.source} target="_blank" rel="noopener noreferrer">
          <span>SOURCE</span><b aria-hidden="true">↗</b>
        </a>
        {project.live && (
          <a className="live-action" href={project.live} target="_blank" rel="noopener noreferrer">
            <span>LAUNCH</span><b aria-hidden="true">↗</b>
          </a>
        )}
      </div>
    </article>
  );
}

function NoteCard({ post, index, onOpen }: { post: BlogPost; index: number; onOpen: () => void }) {
  return (
    <article className="note-card" style={stagger(index)}>
      <div className="note-card-top">
        <span>{post.category}</span>
        <time dateTime={post.publishedOn}>{post.dateLabel}</time>
      </div>
      <h3>{post.title}</h3>
      <p>{post.excerpt}</p>
      <button onClick={onOpen}>READ NOTE <span aria-hidden="true">→</span></button>
      <small>{post.readTime} READ</small>
    </article>
  );
}

export function TerminalOS() {
  const [view, setView] = useState<View>("home");
  const [project, setProject] = useState<Project | null>(null);
  const [post, setPost] = useState<BlogPost | null>(null);
  const [input, setInput] = useState("");
  const [history, setHistory] = useState<string[]>([]);
  const [historyIndex, setHistoryIndex] = useState(-1);
  const [log, setLog] = useState<LogEntry[]>([
    { command: "./boot --portfolio", message: "System ready. Type help or use the launcher." },
  ]);
  const [theme, setTheme] = useState<Theme>("green");
  const [fx, setFx] = useState(true);
  const [booting, setBooting] = useState(true);
  const [clock, setClock] = useState("--:--");
  const [copied, setCopied] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const contentRef = useRef<HTMLDivElement>(null);
  const focusContent = useRef(false);

  const setRoute = useCallback((
    nextView: View,
    nextProject: Project | null = null,
    nextPost: BlogPost | null = null,
    shouldFocus = true,
  ) => {
    focusContent.current = shouldFocus;
    setView(nextView);
    setProject(nextProject);
    setPost(nextPost);
    let hash = nextView;
    if (nextProject) hash = "project-" + nextProject.slug;
    if (nextPost) hash = "note-" + nextPost.slug;
    window.history.pushState({}, "", "#" + hash);
  }, []);

  useEffect(() => {
    const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const visited = window.sessionStorage.getItem("portfolio-booted");
    const savedTheme = window.localStorage.getItem("portfolio-theme");
    const savedFx = window.localStorage.getItem("portfolio-fx");

    if (savedTheme === "green" || savedTheme === "amber" || savedTheme === "cyan") {
      setTheme(savedTheme);
    }
    if (savedFx === "off") setFx(false);

    const finishBoot = () => {
      window.sessionStorage.setItem("portfolio-booted", "true");
      setBooting(false);
    };
    const timer = window.setTimeout(finishBoot, reduceMotion || visited ? 0 : 1450);
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
      focusContent.current = false;
      const hash = window.location.hash.replace("#", "");
      if (hash.startsWith("project-")) {
        const match = portfolio.projects.find((item) => item.slug === hash.replace("project-", ""));
        if (match) {
          setProject(match);
          setPost(null);
          setView("projects");
          return;
        }
      }
      if (hash.startsWith("note-")) {
        const match = portfolio.blog.find((item) => item.slug === hash.replace("note-", ""));
        if (match) {
          setPost(match);
          setProject(null);
          setView("blog");
          return;
        }
      }
      const destination = viewLabels.find((item) => item.id === hash);
      if (destination) {
        setProject(null);
        setPost(null);
        setView(destination.id);
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
    if (!focusContent.current) return;
    const frame = window.requestAnimationFrame(() => {
      content.querySelector<HTMLElement>("h1, h2")?.focus();
      focusContent.current = false;
    });
    return () => window.cancelAnimationFrame(frame);
  }, [view, project, post]);

  const applyTheme = (next: Theme) => {
    setTheme(next);
    window.localStorage.setItem("portfolio-theme", next);
  };

  const cycleTheme = () => {
    const next = themeOrder[(themeOrder.indexOf(theme) + 1) % themeOrder.length];
    applyTheme(next);
  };

  const applyFx = (next: boolean) => {
    setFx(next);
    window.localStorage.setItem("portfolio-fx", next ? "on" : "off");
  };

  const execute = useCallback((raw: string, shouldFocus = false) => {
    const command = raw.trim().toLowerCase().replace(/\s+/g, " ");
    if (!command) return;

    setHistory((items) => [...items.slice(-24), command]);
    setHistoryIndex(-1);
    let message = "Command not found. Type help to list commands.";
    let nextView: View | null = null;
    let nextProject: Project | null = null;
    let nextPost: BlogPost | null = null;

    if (["whoami", "home"].includes(command)) {
      nextView = "home";
      message = "Identity record loaded.";
    } else if (command === "about" || command === "identity") {
      nextView = "about";
      message = "Opening /usr/hamshamb/identity.txt";
    } else if (["projects", "ls", "ls projects"].includes(command)) {
      nextView = "projects";
      message = String(portfolio.projects.length) + " original public project records found. Forks excluded.";
    } else if (["latest", "open latest"].includes(command)) {
      nextView = "projects";
      nextProject = latestProject;
      message = "Latest build: " + latestProject.name + " · " + latestProject.releaseLabel;
    } else if (command.startsWith("open ") || command.startsWith("./projects/")) {
      const slug = command.replace("open ", "").replace("./projects/", "");
      nextProject = portfolio.projects.find((item) => item.slug === slug) ?? null;
      if (nextProject) {
        nextView = "projects";
        message = "Executing ./projects/" + slug;
      } else {
        message = "No original project named " + slug + ". Try projects.";
      }
    } else if (["log", "logbook", "releases"].includes(command)) {
      nextView = "log";
      message = "Reading ~/release.log · " + String(releaseLog.length) + " entries";
    } else if (["blog", "notes", "field notes"].includes(command)) {
      nextView = "blog";
      message = "Mounted /notes · " + String(portfolio.blog.length) + " essays";
    } else if (command.startsWith("read ")) {
      const slug = command.replace("read ", "");
      nextPost = portfolio.blog.find((item) => item.slug === slug) ?? null;
      if (nextPost) {
        nextView = "blog";
        message = "Opening /notes/" + slug + ".md";
      } else {
        message = "No note named " + slug + ". Try blog.";
      }
    } else if (["skills", "stack", "toolbox", "interests"].includes(command)) {
      nextView = command === "interests" ? "about" : "skills";
      message = command === "interests" ? "Interest graph loaded." : "Toolchain mounted.";
    } else if (command === "contact" || command === "sudo collaborate") {
      nextView = "contact";
      message = "Opening public collaboration channel.";
    } else if (command === "status" || command === "system status") {
      message = "ONLINE · " + String(portfolio.projects.length) + " original builds · " + String(portfolio.blog.length) + " field notes · learning in public";
    } else if (command === "help") {
      message = "whoami · projects · latest · open <project> · log · blog · read <note> · skills · interests · contact · status · theme green|amber|cyan · fx on|off · clear";
    } else if (command === "theme green" || command === "theme amber" || command === "theme cyan") {
      const next = command.replace("theme ", "") as Theme;
      applyTheme(next);
      message = next.toUpperCase() + " phosphor profile applied.";
    } else if (command === "fx on" || command === "fx off") {
      const next = command.endsWith("on");
      applyFx(next);
      message = "CRT effects " + (next ? "enabled." : "disabled.");
    } else if (command === "clear") {
      setLog([]);
      setInput("");
      return;
    }

    setLog((items) => [...items.slice(-4), { command, message }]);
    if (nextView) setRoute(nextView, nextProject, nextPost, shouldFocus);
    setInput("");
  }, [setRoute]);

  const submit = (event: FormEvent) => {
    event.preventDefault();
    execute(input, true);
  };

  const keyDown = (event: KeyboardEvent<HTMLInputElement>) => {
    if (event.key === "ArrowUp") {
      event.preventDefault();
      if (!history.length) return;
      const next = Math.min(historyIndex + 1, history.length - 1);
      setHistoryIndex(next);
      setInput(history[history.length - 1 - next]);
    } else if (event.key === "ArrowDown") {
      event.preventDefault();
      if (historyIndex <= 0) {
        setHistoryIndex(-1);
        setInput("");
      } else {
        const next = historyIndex - 1;
        setHistoryIndex(next);
        setInput(history[history.length - 1 - next]);
      }
    } else if (event.key === "Tab") {
      event.preventDefault();
      const match = commandNames.find((name) => name.startsWith(input.toLowerCase()));
      if (match) setInput(match);
    }
  };

  useEffect(() => {
    const shortcut = (event: globalThis.KeyboardEvent) => {
      const target = event.target as HTMLElement;
      const isTyping = target.tagName === "INPUT" || target.tagName === "TEXTAREA";
      if (event.key === "Escape" && booting) {
        setBooting(false);
      } else if (event.key === "/" && !isTyping) {
        event.preventDefault();
        inputRef.current?.focus();
      } else if (event.altKey && /^[1-7]$/.test(event.key)) {
        event.preventDefault();
        const destination = viewLabels[Number(event.key) - 1];
        if (destination) setRoute(destination.id);
      } else if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === "l" && !isTyping) {
        event.preventDefault();
        setLog([]);
      }
    };
    window.addEventListener("keydown", shortcut);
    return () => window.removeEventListener("keydown", shortcut);
  }, [booting, setRoute]);

  const copyPageLink = async () => {
    try {
      await navigator.clipboard.writeText(window.location.href);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 1600);
    } catch {
      setCopied(false);
    }
  };

  const renderProject = (item: Project) => {
    const currentIndex = portfolio.projects.findIndex((entry) => entry.slug === item.slug);
    const previous = portfolio.projects[(currentIndex - 1 + portfolio.projects.length) % portfolio.projects.length];
    const next = portfolio.projects[(currentIndex + 1) % portfolio.projects.length];

    return (
      <section className="view detail-view" aria-labelledby="project-title">
        <button className="back-button" onClick={() => setRoute("projects")}>← BACK TO /PROJECTS</button>
        <div className="detail-header-grid">
          <div className={"detail-sigil phase-" + item.phase}>{item.sigil}</div>
          <div>
            <p className="eyebrow">RUNNING ./PROJECTS/{item.slug.toUpperCase()}</p>
            <h2 id="project-title" tabIndex={-1}>{item.name}</h2>
            <p className="large-copy">{item.description}</p>
          </div>
        </div>
        <div className="case-meta" aria-label="Project details">
          <div><span>RELEASED</span><time dateTime={item.releasedOn}>{item.releaseLabel}</time></div>
          <div><span>STATUS</span><strong className={"phase-text " + item.phase}>● {item.availability}</strong></div>
          <div><span>ROLE</span><b>{item.role}</b></div>
        </div>
        <div className="metric-grid">
          {item.metrics.map((metric) => <div key={metric.label}><strong>{metric.value}</strong><span>{metric.label}</span></div>)}
        </div>
        <div className="case-narrative">
          <article className="story-wide"><span>01 / WHY</span><h3>The problem behind the build.</h3><p>{item.problem}</p></article>
          <article><span>02 / SYSTEM</span><h3>What I made.</h3><p>{item.built}</p></article>
          <article><span>03 / OUTCOME</span><h3>What is true now.</h3><p>{item.result}</p></article>
        </div>
        <section className="feature-section" aria-labelledby="features-title">
          <div className="section-heading compact">
            <div><p className="eyebrow">SYSTEM INVENTORY</p><h3 id="features-title">Inside the build.</h3></div>
            <span>{String(item.highlights.length).padStart(2, "0")} VERIFIED NOTES</span>
          </div>
          <ul className="feature-grid">
            {item.highlights.map((feature, index) => <li key={feature} style={stagger(index)}><span>{String(index + 1).padStart(2, "0")}</span>{feature}</li>)}
          </ul>
        </section>
        {item.note && <p className="case-note"><span>LIMIT / CONTEXT</span>{item.note}</p>}
        <div className="detail-footer">
          <div className="tag-row">{item.stack.map((tech) => <span key={tech}>{tech}</span>)}</div>
          <div className="case-links">
            {item.live && <a className="primary-button" href={item.live} target="_blank" rel="noopener noreferrer">LAUNCH ↗</a>}
            <a className="secondary-button" href={item.source} target="_blank" rel="noopener noreferrer">SOURCE ↗</a>
            <button className="secondary-button" onClick={copyPageLink}>{copied ? "COPIED ✓" : "COPY LINK"}</button>
          </div>
        </div>
        <nav className="record-switcher" aria-label="Browse project records">
          <button onClick={() => setRoute("projects", previous)}><span>← PREVIOUS RECORD</span><strong>{previous.name}</strong></button>
          <button onClick={() => setRoute("projects", next)}><span>NEXT RECORD →</span><strong>{next.name}</strong></button>
        </nav>
      </section>
    );
  };

  const renderPost = (item: BlogPost) => (
    <article className="view article-view" aria-labelledby="article-title">
      <button className="back-button" onClick={() => setRoute("blog")}>← BACK TO /FIELD-NOTES</button>
      <header className="article-header">
        <p className="eyebrow">CAT /NOTES/{item.slug.toUpperCase()}.MD</p>
        <h2 id="article-title" tabIndex={-1}>{item.title}</h2>
        <div className="article-meta"><span>{item.category}</span><time dateTime={item.publishedOn}>{item.dateLabel}</time><span>{item.readTime} READ</span></div>
        <p className="article-thesis">{item.thesis}</p>
      </header>
      <div className="article-body">
        {item.sections.map((section, index) => (
          <section key={section.heading}>
            <span>{String(index + 1).padStart(2, "0")}</span>
            <div><h3>{section.heading}</h3><p>{section.body}</p></div>
          </section>
        ))}
      </div>
      <footer className="article-footer">
        <p>END OF FILE · <button onClick={copyPageLink}>{copied ? "LINK COPIED ✓" : "COPY PERMALINK"}</button></p>
      </footer>
    </article>
  );

  const renderView = () => {
    if (project) return renderProject(project);
    if (post) return renderPost(post);

    if (view === "home") return (
      <section className="view hero" aria-labelledby="hero-title">
        <div className="hero-grid">
          <div className="hero-copy">
            <p className="eyebrow">SYS://IDENTITY · PUBLIC BUILD</p>
            <p className="prompt-line"><span>guest@hamshamb</span>:~$ whoami --verbose</p>
            <h1 id="hero-title" tabIndex={-1}>I follow signals.<br /><em>I build systems.</em><span className="cursor" aria-hidden="true">_</span></h1>
            <p className="role">{portfolio.owner.role}</p>
            <p className="manifesto">{portfolio.owner.statement}</p>
            <div className="hero-actions">
              <button className="primary-button" onClick={() => setRoute("projects")}>EXPLORE ORIGINAL WORK <span>→</span></button>
              <button className="secondary-button" onClick={() => setRoute("blog")}>READ FIELD NOTES</button>
            </div>
          </div>
          <aside className="system-dossier" aria-label="Identity summary">
            <div className="dossier-head"><span>IDENTITY.DAT</span><b>VERIFIED</b></div>
            <dl>
              <div><dt>HANDLE</dt><dd>{portfolio.owner.handle}</dd></div>
              <div><dt>BASED</dt><dd>{portfolio.owner.location}</dd></div>
              <div><dt>MODE</dt><dd>{portfolio.owner.status}</dd></div>
              <div><dt>FOCUS</dt><dd>OSINT / OSS / GEOPOLITICS</dd></div>
            </dl>
            <div className="signal-map" aria-hidden="true">
              <i /><i /><i /><i /><span />
            </div>
          </aside>
        </div>

        <div className="stat-strip" aria-label="Portfolio facts">
          <div><strong>{String(portfolio.projects.length).padStart(2, "0")}</strong><span>ORIGINAL PUBLIC BUILDS</span></div>
          <div><strong>07</strong><span>PROGRAMMING LANGUAGES</span></div>
          <div><strong>{String(portfolio.blog.length).padStart(2, "0")}</strong><span>FIELD NOTES</span></div>
          <div><strong>00</strong><span>FORKS IN PORTFOLIO</span></div>
        </div>

        <div className="home-feeds">
          <button className="feed-panel" onClick={() => setRoute("projects", latestProject)}>
            <span><i /> LATEST BUILD</span><strong>{latestProject.name}</strong><small>{latestProject.description}</small><b>INSPECT →</b>
          </button>
          <button className="feed-panel note-feed" onClick={() => setRoute("blog", null, latestPost)}>
            <span>NEWEST NOTE</span><strong>{latestPost.title}</strong><small>{latestPost.excerpt}</small><b>READ →</b>
          </button>
        </div>
      </section>
    );

    if (view === "about") return (
      <section className="view" aria-labelledby="about-title">
        <p className="eyebrow">/USR/HAMSHAMB/IDENTITY.TXT</p>
        <div className="section-heading">
          <div><h2 id="about-title" tabIndex={-1}>Curiosity is the<br />operating system.</h2><p>A student developer building, investigating, and learning in public.</p></div>
          <span>PROFILE / 2026</span>
        </div>
        <div className="about-layout">
          <div className="prose-block">{portfolio.owner.bio.map((line) => <p key={line}>{line}</p>)}</div>
          <aside className="about-index"><span>CURRENT INDEX</span>{portfolio.owner.interests.map((item) => <p key={item.code}><b>{item.code}</b>{item.title}</p>)}</aside>
        </div>
        <div className="interest-grid">
          {portfolio.owner.interests.map((item, index) => (
            <article key={item.title} style={stagger(index)}><span>{item.code}</span><h3>{item.title}</h3><p>{item.detail}</p></article>
          ))}
        </div>
        <div className="principle-grid">
          {portfolio.owner.principles.map((item, index) => (
            <article key={item.title} style={stagger(index)}><span>RULE {String(index + 1).padStart(2, "0")}</span><h3>{item.title}</h3><p>{item.detail}</p></article>
          ))}
        </div>
      </section>
    );

    if (view === "projects") return (
      <section className="view" aria-labelledby="projects-title">
        <p className="eyebrow">FIND ~/PROJECTS -ORIGINAL -PUBLIC -NOT -FORK</p>
        <div className="section-heading">
          <div><h2 id="projects-title" tabIndex={-1}>Original work.<br />No borrowed signal.</h2><p>Every card below is a public repository created by me. Forks are intentionally filtered out.</p></div>
          <span>{String(portfolio.projects.length).padStart(2, "0")} RECORDS / 00 FORKS</span>
        </div>
        <div className="project-list">
          {portfolio.projects.map((item, index) => (
            <ProjectCard key={item.slug} project={item} index={index} isLatest={item.slug === latestProject.slug} onOpen={() => setRoute("projects", item)} />
          ))}
        </div>
      </section>
    );

    if (view === "log") return (
      <section className="view" aria-labelledby="log-title">
        <p className="eyebrow">TAIL -N {releaseLog.length} ~/RELEASE.LOG</p>
        <div className="section-heading">
          <div><h2 id="log-title" tabIndex={-1}>Build log.</h2><p>Finished products, public experiments, and their exact status—newest first.</p></div>
          <span>CHRONOLOGICAL TRACE</span>
        </div>
        <div className="timeline">
          {releaseLog.map((item, index) => (
            <article key={item.slug} style={stagger(index)}>
              <div className="timeline-date"><i /><time dateTime={item.releasedOn}>{item.releaseLabel}</time><span>{item.phase.toUpperCase()}</span></div>
              <button className="timeline-entry" onClick={() => setRoute("projects", item)}>
                <code>$ release inspect {item.slug}</code>
                <h3>{item.name}</h3>
                <p>{item.releaseNote}</p>
                <b>OPEN RECORD →</b>
              </button>
            </article>
          ))}
        </div>
      </section>
    );

    if (view === "blog") return (
      <section className="view" aria-labelledby="blog-title">
        <p className="eyebrow">LS /NOTES --SORT=NEWEST</p>
        <div className="section-heading">
          <div><h2 id="blog-title" tabIndex={-1}>Field notes.</h2><p>Short essays from the intersection of code, open information, and the systems shaping the world.</p></div>
          <span>{String(portfolio.blog.length).padStart(2, "0")} FILES / MARKDOWN</span>
        </div>
        <div className="blog-feature">
          <span>NEWEST ENTRY</span><h3>{latestPost.title}</h3><p>{latestPost.thesis}</p>
          <button onClick={() => setRoute("blog", null, latestPost)}>READ LATEST NOTE →</button>
        </div>
        <div className="notes-grid">
          {portfolio.blog.map((item, index) => <NoteCard key={item.slug} post={item} index={index} onOpen={() => setRoute("blog", null, item)} />)}
        </div>
      </section>
    );

    if (view === "skills") return (
      <section className="view" aria-labelledby="skills-title">
        <p className="eyebrow">MOUNT /DEV/STACK --ALL</p>
        <div className="section-heading">
          <div><h2 id="skills-title" tabIndex={-1}>Tools are evidence<br />only when used.</h2><p>This is my current working set—not a claim of knowing everything inside each language.</p></div>
          <span>BUILD / WEB / RESEARCH</span>
        </div>
        <div className="skills-grid">
          {portfolio.skills.map((set, index) => (
            <article key={set.group} style={stagger(index)}>
              <div><span>{String(index + 1).padStart(2, "0")}</span><h3>{set.group}</h3></div>
              <ul>{set.items.map((item) => <li key={item}>{item}</li>)}</ul>
            </article>
          ))}
        </div>
        <div className="stack-statement"><span>DEFAULT MODE</span><p>Understand the system. Verify the claim. Choose the smallest reliable architecture. Document the limit. Ship the useful version.</p></div>
      </section>
    );

    return (
      <section className="view contact-view" aria-labelledby="contact-title">
        <p className="eyebrow">./CONTACT --PUBLIC-CHANNEL</p>
        <h2 id="contact-title" tabIndex={-1}>Bring an interesting<br />problem.</h2>
        <p className="large-copy">Open source, OSINT, developer tools, learning systems, unusual interfaces, or a question that crosses boundaries—I am always interested in thoughtful collaboration.</p>
        <div className="contact-grid">
          <a className="contact-card" href={"mailto:" + portfolio.owner.email}>
            <span>EMAIL</span><strong>{portfolio.owner.email}</strong><p>For thoughtful collaboration, project questions, and ideas worth exploring.</p><b>WRITE A MESSAGE ↗</b>
          </a>
          <a className="contact-card" href={portfolio.owner.github} target="_blank" rel="noopener noreferrer">
            <span>GITHUB</span><strong>github.com/hamshamb</strong><p>Explore the repositories, open a relevant issue, or start from the work itself.</p><b>OPEN GITHUB ↗</b>
          </a>
        </div>
        <p className="privacy-note"><span>CONTACT</span>This portfolio uses a dedicated developer email address.</p>
      </section>
    );
  };

  return (
    <main className={"os-shell " + (fx ? "fx-on" : "fx-off")} data-theme={theme}>
      <a className="skip-link" href="#main-content">Skip to portfolio content</a>
      <div className="crt-overlay" aria-hidden="true" />

      {booting && (
        <div className="boot-overlay" role="dialog" aria-label="Portfolio operating system booting">
          <div className="boot-core">
            <div className="boot-mark">H<span>/</span>OS</div>
            <div className="boot-copy">
              <p>PORTFOLIO/OS v3.0</p>
              <p>VERIFYING IDENTITY ........ OK</p>
              <p>FILTERING FORKS ........... 00 LOADED</p>
              <p>INDEXING ORIGINAL WORK .... {String(portfolio.projects.length).padStart(2, "0")} FOUND</p>
              <p>MOUNTING FIELD NOTES ...... {String(portfolio.blog.length).padStart(2, "0")} FOUND</p>
              <p>CALIBRATING PHOSPHOR ...... OK</p>
            </div>
            <button onClick={() => setBooting(false)}>SKIP BOOT [ESC]</button>
          </div>
        </div>
      )}

      <header className="system-bar">
        <div className="system-brand"><span className="brand-block">H/</span><b>PORTFOLIO/OS</b><span>v3.0.0</span></div>
        <div className="system-actions">
          <span className="online"><i /> ONLINE</span>
          <button onClick={cycleTheme} aria-label="Cycle phosphor colour theme">PHOSPHOR: {theme.toUpperCase()}</button>
          <button onClick={() => applyFx(!fx)} aria-pressed={fx}>FX: {fx ? "ON" : "OFF"}</button>
          <time dateTime={clock}>{clock} IST</time>
        </div>
      </header>

      <div className="os-body">
        <aside className="launcher" aria-label="Portfolio launcher">
          <p>APPS <span>ALT + 1–7</span></p>
          <nav>
            {viewLabels.map((item) => {
              const active = view === item.id && !project && !post;
              return (
                <button key={item.id} className={active ? "active" : ""} aria-current={active ? "page" : undefined} onClick={() => setRoute(item.id)}>
                  <span>{item.shortcut}</span><b>{item.label}</b><kbd>↵</kbd>
                </button>
              );
            })}
          </nav>
          <div className="launcher-foot">
            <span>PUBLIC INDEX</span><i><b /></i><small>{String(portfolio.projects.length).padStart(2, "0")} ORIGINAL / 00 FORKS</small>
          </div>
        </aside>

        <section className="terminal-window" aria-label="Interactive portfolio terminal">
          <div className="window-chrome">
            <div><span /><span /><span /></div>
            <p>guest@hamshamb: ~/{project ? "projects/" + project.slug : post ? "notes/" + post.slug : view}</p>
            <b>96 × 32</b>
          </div>
          <div id="main-content" ref={contentRef} className="window-content" tabIndex={-1}>
            <div key={view + ":" + (project?.slug ?? post?.slug ?? "index")} className="view-stage">{renderView()}</div>
          </div>
          <div className="terminal-log" role="log" aria-live="polite" aria-label="Terminal command output">
            {log.slice(-2).map((entry, index) => <div key={entry.command + "-" + String(index)}><p><span>guest@hamshamb</span>:~$ {entry.command}</p><small>{entry.message}</small></div>)}
          </div>
          <form className="command-bar" onSubmit={submit}>
            <label htmlFor="command-input"><span>guest@hamshamb</span>:~$</label>
            <input id="command-input" ref={inputRef} value={input} onChange={(event) => setInput(event.target.value)} onKeyDown={keyDown} autoComplete="off" spellCheck={false} aria-describedby="command-help" placeholder="type help, projects, blog…" />
            <button type="submit">RUN ↵</button>
          </form>
          <p id="command-help" className="sr-only">Type help for commands. Use arrow keys for history and Tab for completion.</p>
        </section>
      </div>

      <footer className="status-bar">
        <span>MODE: <b>CURIOUS</b></span>
        <span className="footer-hint">/ FOCUS&nbsp;&nbsp; ↑↓ HISTORY&nbsp;&nbsp; TAB COMPLETE&nbsp;&nbsp; ALT+1–7 NAVIGATE&nbsp;&nbsp; CTRL+L CLEAR</span>
        <span>© 2026 HAMSHAMB</span>
      </footer>
    </main>
  );
}
