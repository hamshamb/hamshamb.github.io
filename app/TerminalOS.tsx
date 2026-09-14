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
  futureWriting,
  latestProject,
  portfolio,
  releaseLog,
  type Project,
} from "./portfolio-data";

type View = "home" | "about" | "projects" | "log" | "stuff" | "writing" | "stack" | "contact" | "now";
type Theme = "green" | "amber" | "cyan";
type LogEntry = { command: string; message: string };
type StaggerStyle = CSSProperties & { "--stagger": string };

const viewLabels: { id: Exclude<View, "now">; label: string; shortcut: string }[] = [
  { id: "home", label: "HOME", shortcut: "01" },
  { id: "about", label: "ABOUT", shortcut: "02" },
  { id: "projects", label: "PROJECTS", shortcut: "03" },
  { id: "log", label: "LOG", shortcut: "04" },
  { id: "stuff", label: "STUFF", shortcut: "05" },
  { id: "writing", label: "WRITING", shortcut: "06" },
  { id: "stack", label: "STACK", shortcut: "07" },
  { id: "contact", label: "CONTACT", shortcut: "08" },
];

const themes: Theme[] = ["green", "amber", "cyan"];
const stagger = (index: number): StaggerStyle => ({ "--stagger": String(index * 55) + "ms" });

function ProjectCard({
  project,
  index,
  onOpen,
}: {
  project: Project;
  index: number;
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
        </div>
        <p className="eyebrow">{project.eyebrow}</p>
        <h3>{project.name}</h3>
        <p className="project-hook">{project.intro[0]}</p>
        <p>{project.intro[1]}</p>
        <div className="tag-row" aria-label="Technologies">
          {project.stack.slice(0, 5).map((item) => <span key={item}>{item}</span>)}
        </div>
      </div>
      <div className="project-card-actions">
        <button onClick={onOpen} aria-label={"Open " + project.name + " project page"}>
          <span>MORE</span><b aria-hidden="true">→</b>
        </button>
        <a href={project.source} target="_blank" rel="noopener noreferrer">
          <span>CODE</span><b aria-hidden="true">↗</b>
        </a>
        {project.live && (
          <a className="live-action" href={project.live} target="_blank" rel="noopener noreferrer">
            <span>TRY IT</span><b aria-hidden="true">↗</b>
          </a>
        )}
      </div>
    </article>
  );
}

export function TerminalOS({ initialView = "home" }: { initialView?: View }) {
  const [view, setView] = useState<View>(initialView);
  const [project, setProject] = useState<Project | null>(null);
  const [input, setInput] = useState("");
  const [history, setHistory] = useState<string[]>([]);
  const [historyIndex, setHistoryIndex] = useState(-1);
  const [log, setLog] = useState<LogEntry[]>([
    { command: "whoami", message: "hamshamb. student. makes stuff." },
  ]);
  const [theme, setTheme] = useState<Theme>("green");
  const [fx, setFx] = useState(true);
  const [clock, setClock] = useState("--:--");
  const [copied, setCopied] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const contentRef = useRef<HTMLDivElement>(null);
  const focusContent = useRef(false);

  const setRoute = useCallback((
    nextView: View,
    nextProject: Project | null = null,
    shouldFocus = true,
  ) => {
    focusContent.current = shouldFocus;
    setView(nextView);
    setProject(nextProject);

    if (nextProject) {
      window.history.pushState({}, "", "/#project-" + nextProject.slug);
    } else if (nextView === "now") {
      window.history.pushState({}, "", "/now/");
    } else {
      window.history.pushState({}, "", "/#" + nextView);
    }
  }, []);

  useEffect(() => {
    const savedTheme = window.localStorage.getItem("portfolio-theme");
    const savedFx = window.localStorage.getItem("portfolio-fx");
    if (savedTheme === "green" || savedTheme === "amber" || savedTheme === "cyan") setTheme(savedTheme);
    if (savedFx === "off") setFx(false);
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
    const readLocation = () => {
      focusContent.current = false;
      const hash = window.location.hash.replace("#", "");
      const path = window.location.pathname.replace(/\/+$/, "");

      if (hash.startsWith("project-")) {
        const match = portfolio.projects.find((item) => item.slug === hash.replace("project-", ""));
        if (match) {
          setProject(match);
          setView("projects");
          return;
        }
      }

      if (!hash && path === "/now") {
        setProject(null);
        setView("now");
        return;
      }

      const destination = [...viewLabels.map((item) => item.id), "now"].find((item) => item === hash) as View | undefined;
      if (destination) {
        setProject(null);
        setView(destination);
      }
    };

    readLocation();
    window.addEventListener("popstate", readLocation);
    window.addEventListener("hashchange", readLocation);
    return () => {
      window.removeEventListener("popstate", readLocation);
      window.removeEventListener("hashchange", readLocation);
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
  }, [view, project]);

  const applyTheme = (next: Theme) => {
    setTheme(next);
    window.localStorage.setItem("portfolio-theme", next);
  };

  const cycleTheme = () => {
    const next = themes[(themes.indexOf(theme) + 1) % themes.length];
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

    let message = "command not found. try help.";
    let nextView: View | null = null;
    let nextProject: Project | null = null;

    if (["whoami", "home"].includes(command)) {
      nextView = "home";
      message = "hamshamb. student. makes stuff.";
    } else if (command === "about") {
      nextView = "about";
      message = "opening about.txt";
    } else if (["projects", "ls", "ls projects"].includes(command)) {
      nextView = "projects";
      message = String(portfolio.projects.length) + " things found. forks ignored.";
    } else if (["latest", "open latest"].includes(command)) {
      nextView = "projects";
      nextProject = latestProject;
      message = "opening " + latestProject.name;
    } else if (command.startsWith("open ") || command.startsWith("./projects/")) {
      const slug = command.replace("open ", "").replace("./projects/", "");
      nextProject = portfolio.projects.find((item) => item.slug === slug) ?? null;
      if (nextProject) {
        nextView = "projects";
        message = "opening " + nextProject.name;
      } else {
        message = "can't find that. try projects.";
      }
    } else if (["log", "releases"].includes(command)) {
      nextView = "log";
      message = "reading release.log";
    } else if (["stuff", "ls ~/stuff", "interests"].includes(command)) {
      nextView = "stuff";
      message = "minecraft/ cubing/ maps/ rabbit-holes/ failed-projects/ misc/";
    } else if (["writing", "blog", "notes"].includes(command)) {
      nextView = "writing";
      message = "empty on purpose.";
    } else if (command === "now" || command === "/now") {
      nextView = "now";
      message = "what i'm doing this month.";
    } else if (["skills", "stack", "toolbox"].includes(command)) {
      nextView = "stack";
      message = "opening stack.txt";
    } else if (command === "contact") {
      nextView = "contact";
      message = "want to build something?";
    } else if (command === "status") {
      message = "online · " + String(portfolio.projects.length) + " projects · too many browser tabs";
    } else if (command === "help") {
      message = "whoami · about · projects · latest · open <project> · log · stuff · writing · now · stack · contact · theme · fx · clear";
    } else if (command === "theme green" || command === "theme amber" || command === "theme cyan") {
      const next = command.replace("theme ", "") as Theme;
      applyTheme(next);
      message = next + " selected.";
    } else if (command === "fx on" || command === "fx off") {
      const next = command.endsWith("on");
      applyFx(next);
      message = "effects " + (next ? "on." : "off.");
    } else if (command === "clear") {
      setLog([]);
      setInput("");
      return;
    }

    setLog((items) => [...items.slice(-4), { command, message }]);
    if (nextView) setRoute(nextView, nextProject, shouldFocus);
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
      if (event.key === "/" && !isTyping) {
        event.preventDefault();
        inputRef.current?.focus();
      } else if (event.altKey && /^[1-8]$/.test(event.key)) {
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
  }, [setRoute]);

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
      <section className="view detail-view human-project" aria-labelledby="project-title">
        <button className="back-button" onClick={() => setRoute("projects")}>← all projects</button>

        <div className="detail-header-grid">
          <div className={"detail-sigil phase-" + item.phase}>{item.sigil}</div>
          <div>
            <p className="eyebrow">{item.eyebrow}</p>
            <h2 id="project-title" tabIndex={-1}>{item.name}</h2>
            <div className="project-intro">
              {item.intro.map((line) => <p key={line}>{line}</p>)}
            </div>
          </div>
        </div>

        {item.image && (
          <figure className="project-shot">
            <img src={item.image} alt={item.imageAlt ?? ""} loading="lazy" />
            <figcaption>actual project media, not a stock photo.</figcaption>
          </figure>
        )}

        <p className="technical-summary">{item.description}</p>

        <div className="case-meta" aria-label="Project details">
          <div><span>WHEN</span><time dateTime={item.releasedOn}>{item.releaseLabel}</time></div>
          <div><span>STATUS</span><strong className={"phase-text " + item.phase}>● {item.availability}</strong></div>
          <div><span>WHAT I DID</span><b>{item.role}</b></div>
        </div>

        <div className="metric-grid">
          {item.metrics.map((metric) => <div key={metric.label}><strong>{metric.value}</strong><span>{metric.label}</span></div>)}
        </div>

        <div className="case-narrative">
          <article className="story-wide"><span>WHY THIS EXISTS</span><h3>the annoying bit.</h3><p>{item.problem}</p></article>
          <article><span>UNDER THE HOOD</span><h3>what i actually built.</h3><p>{item.built}</p></article>
          <article><span>WHERE IT IS NOW</span><h3>no fake launch language.</h3><p>{item.result}</p></article>
        </div>

        <section className="feature-section" aria-labelledby="features-title">
          <div className="section-heading compact">
            <div><p className="eyebrow">DETAILS</p><h3 id="features-title">the technical bits.</h3></div>
            <span>{String(item.highlights.length).padStart(2, "0")} THINGS</span>
          </div>
          <ul className="feature-grid">
            {item.highlights.map((feature, index) => <li key={feature} style={stagger(index)}><span>{String(index + 1).padStart(2, "0")}</span>{feature}</li>)}
          </ul>
        </section>

        {item.note && <p className="case-note"><span>HONEST BIT</span>{item.note}</p>}

        <div className="detail-footer">
          <div className="tag-row">{item.stack.map((tech) => <span key={tech}>{tech}</span>)}</div>
          <div className="case-links">
            {item.live && <a className="primary-button" href={item.live} target="_blank" rel="noopener noreferrer">TRY IT ↗</a>}
            <a className="secondary-button" href={item.source} target="_blank" rel="noopener noreferrer">CODE ↗</a>
            <button className="secondary-button" onClick={copyPageLink}>{copied ? "COPIED ✓" : "COPY LINK"}</button>
          </div>
        </div>

        <nav className="record-switcher" aria-label="Browse project pages">
          <button onClick={() => setRoute("projects", previous)}><span>← PREVIOUS</span><strong>{previous.name}</strong></button>
          <button onClick={() => setRoute("projects", next)}><span>NEXT →</span><strong>{next.name}</strong></button>
        </nav>
      </section>
    );
  };

  const renderStuff = () => (
    <section className="view stuff-view" aria-labelledby="stuff-title">
      <p className="eyebrow">LS ~/STUFF</p>
      <div className="section-heading">
        <div>
          <h2 id="stuff-title" tabIndex={-1}>stuff.</h2>
          <p>this page has no professional purpose. it’s just stuff i like.</p>
        </div>
        <span>minecraft/ cubing/ maps/ misc/</span>
      </div>

      <div className="stuff-grid">
        <article className="stuff-card stuff-wide">
          <div className="pixel-scene" aria-label="Small Minecraft-inspired diagram">
            <span className="pixel-sun" /><span className="pixel-cloud one" /><span className="pixel-cloud two" />
            <span className="pixel-ground" /><span className="pixel-tree" /><span className="pixel-player" />
          </div>
          <div>
            <span className="stuff-path">~/stuff/minecraft</span>
            <h3>minecraft</h3>
            <p>been playing this for ages.</p>
            <p>at some point “playing minecraft” became “installing mods” became “making mods” became “why am i reading networking documentation for minecraft”.</p>
            <p>Nexus exists because of this.</p>
            <small>probably not the intended educational outcome of the game.</small>
          </div>
        </article>

        <article className="stuff-card">
          <div className="cube-diagram" aria-label="A colourful three by three cube face">
            {["g","r","y","b","w","o","r","g","b"].map((colour, index) => <i className={colour} key={colour + index} />)}
          </div>
          <span className="stuff-path">~/stuff/cubing</span>
          <h3>cubing</h3>
          <p>newer obsession. currently doing 3x3.</p>
          <p>i don’t have a smart cube, which immediately made me wonder if i could analyse solves without one.</p>
          <small>apparently i cannot have normal hobbies.</small>
        </article>

        <article className="stuff-card">
          <div className="map-diagram" aria-label="Abstract map and route diagram">
            <svg viewBox="0 0 420 180" role="img">
              <path d="M12 128 C58 76 96 146 138 92 S224 38 268 94 350 144 408 57" />
              <path d="M28 42 C92 76 96 20 166 58 S264 146 388 118" />
              <circle cx="138" cy="92" r="7" /><circle cx="268" cy="94" r="7" />
              <line x1="138" y1="92" x2="268" y2="94" />
            </svg>
          </div>
          <span className="stuff-path">~/stuff/maps</span>
          <h3>maps</h3>
          <p>i open maps a lot.</p>
          <p>sometimes for osint. sometimes for geopolitics. sometimes literally just to look at places.</p>
          <small>i have no better explanation.</small>
        </article>

        <article className="stuff-card browser-card">
          <div className="fake-browser" aria-label="Joke browser with many open tabs">
            <div>{Array.from({ length: 14 }, (_, index) => <i key={index}>{index === 13 ? "+" : "×"}</i>)}</div>
            <p>undersea cables - Search</p>
          </div>
          <span className="stuff-path">~/stuff/rabbit-holes/browser</span>
          <h3>my browser</h3>
          <p>a completely healthy number of tabs.</p>
          <small>current count: i stopped counting.</small>
        </article>

        <article className="stuff-card abandoned-card">
          <div className="failed-window" aria-label="A fake crashed project window">
            <div><i /><i /><i /></div>
            <code>ERROR: good idea not found</code>
          </div>
          <span className="stuff-path">~/stuff/failed-projects</span>
          <h3>abandoned things</h3>
          <p>this folder should probably be larger than my projects section.</p>
          <small>no. i will not be explaining this one.</small>
        </article>

        <article className="stuff-card now-card">
          <span className="stuff-path">~/now</span>
          <h3>right now</h3>
          <ul>
            <li>getting faster at 3x3</li>
            <li>minecraft networking</li>
            <li>osint and security</li>
            <li>geopolitics</li>
            <li>making this website stop sounding like chatgpt</li>
          </ul>
          <button onClick={() => setRoute("now")}>open /now →</button>
          <small>last updated: whenever i remembered</small>
        </article>
      </div>

      <p className="real-media-note">no stock photos pretending to be mine. i’ll add my own cube photos and screenshots here when i have the right ones.</p>
    </section>
  );

  const renderView = () => {
    if (project) return renderProject(project);

    if (view === "home") return (
      <section className="view hero simple-home" aria-labelledby="hero-title">
        <p className="prompt-line"><span>guest@hamshamb</span>:~$ whoami</p>
        <h1 id="hero-title" tabIndex={-1}>hamshamb<span className="cursor" aria-hidden="true">_</span></h1>
        <p className="plain-role">{portfolio.owner.role}</p>
        <p className="plain-subtitle">{portfolio.owner.statement}</p>

        <div className="home-links" aria-label="Quick links">
          <button onClick={() => setRoute("projects")}>projects</button>
          <button onClick={() => setRoute("about")}>about</button>
          <button onClick={() => setRoute("stuff")}>stuff</button>
          <button onClick={() => setRoute("writing")}>writing</button>
          <a href={portfolio.owner.github} target="_blank" rel="noopener noreferrer">github ↗</a>
        </div>

        <div className="current-grid">
          <section>
            <span>currently</span>
            <dl>
              <div><dt>working on</dt><dd>→ Nexus</dd></div>
              <div><dt>learning</dt><dd>→ security / osint</dd></div>
              <div><dt>wasting time on</dt><dd>→ 3x3</dd></div>
            </dl>
            <button className="text-link" onClick={() => setRoute("now")}>more at /now →</button>
          </section>

          <button className="latest-human" onClick={() => setRoute("projects", latestProject)}>
            <span>latest thing i made</span>
            <strong>{latestProject.name}</strong>
            <p>{latestProject.intro[0]}</p>
            <small>it’s not finished.</small>
            <b>look at it →</b>
          </button>
        </div>
      </section>
    );

    if (view === "about") return (
      <section className="view plain-about" aria-labelledby="about-title">
        <p className="eyebrow">CAT ABOUT.TXT</p>
        <h2 id="about-title" tabIndex={-1}>about.txt</h2>
        <div className="about-copy">
          {portfolio.owner.bio.map((line, index) => index === 0
            ? <p className="about-hello" key={line}>{line}</p>
            : <p key={line}>{line}</p>
          )}
        </div>
      </section>
    );

    if (view === "projects") return (
      <section className="view" aria-labelledby="projects-title">
        <p className="eyebrow">LS ~/PROJECTS</p>
        <div className="section-heading">
          <div><h2 id="projects-title" tabIndex={-1}>things i made.</h2><p>the simple version first. the technical rabbit hole is inside each one.</p></div>
          <span>{String(portfolio.projects.length).padStart(2, "0")} MINE · 00 FORKS</span>
        </div>
        <div className="project-list">
          {portfolio.projects.map((item, index) => (
            <ProjectCard key={item.slug} project={item} index={index} onOpen={() => setRoute("projects", item)} />
          ))}
        </div>
      </section>
    );

    if (view === "log") return (
      <section className="view" aria-labelledby="log-title">
        <p className="eyebrow">TAIL ~/RELEASE.LOG</p>
        <div className="section-heading">
          <div><h2 id="log-title" tabIndex={-1}>build log.</h2><p>newest first. unfinished things are allowed to look unfinished.</p></div>
          <span>{releaseLog.length} ENTRIES</span>
        </div>
        <div className="timeline">
          {releaseLog.map((item, index) => (
            <article key={item.slug} style={stagger(index)}>
              <div className="timeline-date"><i /><time dateTime={item.releasedOn}>{item.releaseLabel}</time><span>{item.phase.toUpperCase()}</span></div>
              <button className="timeline-entry" onClick={() => setRoute("projects", item)}>
                <code>$ open {item.slug}</code>
                <h3>{item.name}</h3>
                <p>{item.releaseNote}</p>
                <b>OPEN →</b>
              </button>
            </article>
          ))}
        </div>
      </section>
    );

    if (view === "stuff") return renderStuff();

    if (view === "writing") return (
      <section className="view writing-empty" aria-labelledby="writing-title">
        <p className="eyebrow">LS ~/WRITING</p>
        <h2 id="writing-title" tabIndex={-1}>nothing here yet.</h2>
        <div className="empty-copy">
          <p>i deleted the three posts that used to be here because they sounded like chatgpt wrote them.</p>
          <p>they did.</p>
          <p>the next one will be about something i actually built.</p>
        </div>
        <div className="future-list">
          <span>things i might genuinely write</span>
          <ol>{futureWriting.map((title) => <li key={title}>{title}</li>)}</ol>
        </div>
      </section>
    );

    if (view === "stack") return (
      <section className="view" aria-labelledby="stack-title">
        <p className="eyebrow">CAT STACK.TXT</p>
        <div className="section-heading">
          <div><h2 id="stack-title" tabIndex={-1}>stuff i use.</h2><p>not claiming mastery. these have appeared in things i’ve actually tried to make.</p></div>
          <span>TOOLS, NOT PERSONALITY</span>
        </div>
        <div className="skills-grid">
          {portfolio.skills.map((set, index) => (
            <article key={set.group} style={stagger(index)}>
              <div><span>{String(index + 1).padStart(2, "0")}</span><h3>{set.group}</h3></div>
              <ul>{set.items.map((item) => <li key={item}>{item}</li>)}</ul>
            </article>
          ))}
        </div>
      </section>
    );

    if (view === "now") return (
      <section className="view now-view" aria-labelledby="now-title">
        <p className="eyebrow">CAT /NOW/INDEX.TXT</p>
        <h2 id="now-title" tabIndex={-1}>now</h2>
        <p className="now-month">{portfolio.owner.now.month}</p>
        <ul>
          {portfolio.owner.now.items.map((item) => <li key={item}>{item}</li>)}
        </ul>
        <p className="tab-count">current unnecessary browser tab count: <b>i stopped counting</b></p>
        <p className="now-updated">last updated: 14 sep 2026</p>
        <button className="secondary-button" onClick={() => setRoute("stuff")}>← BACK TO STUFF</button>
      </section>
    );

    return (
      <section className="view contact-view human-contact" aria-labelledby="contact-title">
        <p className="eyebrow">CAT CONTACT.TXT</p>
        <h2 id="contact-title" tabIndex={-1}>want to build<br />something?</h2>
        <p className="large-copy">send me weird stuff. project ideas, questions about something i made, open-source work, or a rabbit hole worth falling into.</p>
        <div className="contact-grid">
          <a className="contact-card" href={"mailto:" + portfolio.owner.email}>
            <span>EMAIL</span><strong>{portfolio.owner.email}</strong><p>probably the easiest way to reach me.</p><b>SEND MAIL ↗</b>
          </a>
          <a className="contact-card" href={portfolio.owner.github} target="_blank" rel="noopener noreferrer">
            <span>GITHUB</span><strong>github.com/hamshamb</strong><p>the code, issues, and unfinished things.</p><b>OPEN ↗</b>
          </a>
        </div>
      </section>
    );
  };

  return (
    <main className={"os-shell " + (fx ? "fx-on" : "fx-off")} data-theme={theme}>
      <a className="skip-link" href="#main-content">Skip to portfolio content</a>
      <div className="crt-overlay" aria-hidden="true" />

      <header className="system-bar">
        <div className="system-brand"><span className="brand-block">H/</span><b>hamshamb.exe</b><span>personal computer</span></div>
        <div className="system-actions">
          <span className="online"><i /> ONLINE</span>
          <button onClick={cycleTheme} aria-label="Cycle colour theme">COLOUR: {theme.toUpperCase()}</button>
          <button onClick={() => applyFx(!fx)} aria-pressed={fx}>FX: {fx ? "ON" : "OFF"}</button>
          <time dateTime={clock}>{clock} IST</time>
        </div>
      </header>

      <div className="os-body">
        <aside className="launcher" aria-label="Portfolio navigation">
          <p>FILES <span>ALT + 1–8</span></p>
          <nav>
            {viewLabels.map((item) => {
              const active = view === item.id && !project;
              return (
                <button key={item.id} className={active ? "active" : ""} aria-current={active ? "page" : undefined} onClick={() => setRoute(item.id)}>
                  <span>{item.shortcut}</span><b>{item.label}</b><kbd>↵</kbd>
                </button>
              );
            })}
          </nav>
          <div className="launcher-foot">
            <a href="/now/">/now</a><i><b /></i><small>{String(portfolio.projects.length).padStart(2, "0")} projects · 00 forks</small>
          </div>
        </aside>

        <section className="terminal-window" aria-label="Interactive portfolio terminal">
          <div className="window-chrome">
            <div><span /><span /><span /></div>
            <p>guest@hamshamb: ~/{project ? "projects/" + project.slug : view}</p>
            <b>96 × 32</b>
          </div>
          <div id="main-content" ref={contentRef} className="window-content" tabIndex={-1}>
            <div key={view + ":" + (project?.slug ?? "index")} className="view-stage">{renderView()}</div>
          </div>
          <div className="terminal-log" role="log" aria-live="polite" aria-label="Terminal command output">
            {log.slice(-2).map((entry, index) => <div key={entry.command + "-" + String(index)}><p><span>guest@hamshamb</span>:~$ {entry.command}</p><small>{entry.message}</small></div>)}
          </div>
          <form className="command-bar" onSubmit={submit}>
            <label htmlFor="command-input"><span>guest@hamshamb</span>:~$</label>
            <input id="command-input" ref={inputRef} value={input} onChange={(event) => setInput(event.target.value)} onKeyDown={keyDown} autoComplete="off" spellCheck={false} aria-describedby="command-help" placeholder="try projects, stuff, now…" />
            <button type="submit">RUN ↵</button>
          </form>
          <p id="command-help" className="sr-only">Type help for commands. Use arrow keys for history and Tab for completion.</p>
        </section>
      </div>

      <footer className="status-bar">
        <span>MODE: <b>MAKING STUFF</b></span>
        <span className="footer-hint">/ FOCUS&nbsp;&nbsp; ↑↓ HISTORY&nbsp;&nbsp; TAB COMPLETE&nbsp;&nbsp; ALT+1–8 NAVIGATE</span>
        <span>© 2026 HAMSHAMB</span>
      </footer>
    </main>
  );
}
