import { formatHours, liveSocials, personal } from "@/content/personal";
import { ScrambleCard } from "../cube/ScrambleCard";
import { Reveal } from "../motion/Reveal";
import { AppLink as Link } from "../ui/AppLink";
import { CopyHandle } from "../ui/CopyHandle";
import { GameShelf } from "./GameShelf";
import { SectionHead } from "./SectionHead";

function PixelScene() {
  return (
    <div className="pixel-scene" aria-hidden="true">
      <svg viewBox="0 0 48 36" preserveAspectRatio="xMidYMax slice" shapeRendering="crispEdges">
        <rect className="sky" width="48" height="36" />
        <rect className="sun" x="38" y="4" width="5" height="5" />
        <path className="soft" d="M5 8h9v2H5zM7 6h4v2H7zM23 11h8v2h-8zM25 9h3v2h-3z" />
        <rect className="leaves" x="4" y="13" width="10" height="7" />
        <rect className="trunk" x="8" y="20" width="2" height="7" />
        <rect className="grass" x="30" y="23" width="12" height="2" />
        <rect className="dirt" x="30" y="25" width="12" height="2" />
        <rect className="grass" x="0" y="27" width="48" height="2" />
        <rect className="dirt" x="0" y="29" width="48" height="7" />
        <rect className="skin" x="20" y="17" width="3" height="3" />
        <rect className="eye" x="20" y="18" width="1" height="1" />
        <rect className="eye" x="22" y="18" width="1" height="1" />
        <rect className="shirt" x="20" y="20" width="3" height="4" />
        <rect className="pants" x="20" y="24" width="3" height="3" />
      </svg>
    </div>
  );
}

function MapArt() {
  return (
    <svg className="map-art" viewBox="0 0 320 168" aria-hidden="true" focusable="false">
      <path d="M8 120C50 72 86 136 126 86S206 34 248 88s74 48 66 -30" />
      <path d="M20 40c60 32 64-20 130 16s92 84 162 58" />
      <path d="M0 150c80-20 140 10 210-12s80-30 110-22" />
      <path className="route" d="M126 86C160 70 200 110 248 88" />
      <circle cx="126" cy="86" r="6" />
      <circle cx="248" cy="88" r="6" />
    </svg>
  );
}

/** Facts only appear when they exist. Nothing here ever shows a placeholder number. */
function Facts({ items }: { items: [string, string | string[] | undefined][] }) {
  const known = items.filter((item): item is [string, string | string[]] => Boolean(item[1] && item[1].length));
  if (!known.length) return null;
  return (
    <dl className="stuff-facts">
      {known.map(([label, value]) => (
        <div key={label}>
          <dt className="mono">{label}</dt>
          <dd>{Array.isArray(value) ? value.map((line) => <span key={line}>{line}</span>) : value}</dd>
        </div>
      ))}
    </dl>
  );
}

export function StuffSection() {
  const { minecraft, cubing, games } = personal;
  const minecraftHours = formatHours(minecraft.playtimeHours);

  return (
    <section className="section" id="stuff" aria-labelledby="stuff-title">
      <div className="container">
        <SectionHead
          index="06"
          label="ls ~/stuff"
          titleId="stuff-title"
          title="stuff."
          intro="this part has no professional purpose. that is probably why it belongs here."
        />

        <ul className="stuff-grid">
          <li className="stuff-wide">
            <Reveal className="stuff-card stuff-wide">
              <div className="stuff-art stuff-shot">
                {minecraft.screenshot ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={minecraft.screenshot}
                    width={1200}
                    height={631}
                    loading="lazy"
                    decoding="async"
                    alt="My Minecraft storage hall: a wooden corridor lined with chests, a cake on an emerald block, a framed sword, my wolf, and a friend in armour at the far end."
                  />
                ) : (
                  <PixelScene />
                )}
              </div>
              <div>
                <span className="stuff-path">~/stuff/minecraft</span>
                <h3>minecraft</h3>
                {minecraftHours && (
                  <p className="stuff-flex">
                    <b className="mono">{minecraftHours}</b>
                    <span>and somehow this eventually became a networking project.</span>
                  </p>
                )}
                <p className="stuff-meta mono">
                  {[
                    minecraft.since && `playing since ${minecraft.since}`,
                    minecraft.edition?.join(", "),
                    minecraft.favoriteStyle?.length && `mostly ${minecraft.favoriteStyle.join(", ")}`,
                  ].filter(Boolean).map((line) => <span key={String(line)}>{line}</span>)}
                </p>
                <p>been playing this for long enough that &ldquo;playing minecraft&rdquo; became &ldquo;installing mods&rdquo; became &ldquo;making mods&rdquo; became &ldquo;why am i reading networking documentation for minecraft&rdquo;.</p>
                <p><Link className="text-link" href="/work/nexus">Nexus</Link> is partly the result.</p>
                <small>probably not the intended educational outcome of the game.</small>
              </div>
            </Reveal>
          </li>

          <li className="stuff-wide">
            <Reveal className="stuff-card stuff-wide stuff-cubing">
              <div className="stuff-art"><ScrambleCard /></div>
              <div>
                <span className="stuff-path">~/stuff/cubing</span>
                <h3>cubing</h3>
                <p>newer obsession. a 3x3 is a remarkably efficient way to turn half a minute into several hours of trying to save another second.</p>
                <p>i don&rsquo;t have a smart cube, which immediately made me wonder if i could analyse solves without one. for now it has a scrambler and a cube you can spin.</p>
                <Facts items={[["pb", cubing.pb && `${cubing.pb}s`], ["avg", cubing.average && `${cubing.average}s`], ["cubes", cubing.cubes]]} />
                <Link className="stuff-link" href="/stuff/cubing">open the cube lab <span className="arrow" aria-hidden="true">→</span></Link>
              </div>
            </Reveal>
          </li>

          <li className="stuff-wide">
            <Reveal className="stuff-card stuff-wide stuff-games">
              <div>
                <span className="stuff-path">~/stuff/games</span>
                <h3>games</h3>
                <p>games i keep coming back to. some because they are brilliant. some because physics engines are funny. some because apparently frustration is a hobby.</p>
              </div>
              <GameShelf games={games} />
            </Reveal>
          </li>

          <li>
            <Reveal className="stuff-card">
              <div className="stuff-art"><MapArt /></div>
              <div>
                <span className="stuff-path">~/stuff/maps</span>
                <h3>maps</h3>
                <p>i open maps more than any reasonable person probably should.</p>
                <p>sometimes OSINT. sometimes geopolitics. sometimes literally just looking at places.</p>
                <small>i have no better explanation.</small>
              </div>
            </Reveal>
          </li>

          <li>
            <Reveal className="stuff-card" delay={0.06}>
              <div className="stuff-art browser-art" aria-hidden="true">
                <div className="tab-strip">
                  {Array.from({ length: 14 }, (_, index) => (
                    <i key={index} className={index === 6 ? "on" : undefined}>{index === 13 ? "+" : "×"}</i>
                  ))}
                </div>
                <div className="tab-page">undersea cables - Search</div>
              </div>
              <div>
                <span className="stuff-path">~/stuff/rabbit-holes/browser</span>
                <h3>my browser</h3>
                <p>a completely healthy number of tabs.</p>
                <small>current count: i stopped counting.</small>
              </div>
            </Reveal>
          </li>

          <li>
            <Reveal className="stuff-card" delay={0.12}>
              <div className="stuff-art" aria-hidden="true">
                <div className="failed-window">
                  <div><i /><i /><i /></div>
                  <code>ERROR: good idea not found</code>
                </div>
              </div>
              <div>
                <span className="stuff-path">~/stuff/failed-projects</span>
                <h3>abandoned things</h3>
                <p>this folder is probably larger than the shipped projects.</p>
                <small>no. i will not be explaining this one.</small>
              </div>
            </Reveal>
          </li>
        </ul>

        <div className="stuff-socials">
          <span className="mono">~/stuff/elsewhere</span>
          <ul>
            {liveSocials().map((social) => (
              <li key={social.id}>
                {social.href ? (
                  <a href={social.href} {...(social.href.startsWith("http") ? { target: "_blank", rel: "noopener noreferrer" } : {})}>
                    {social.label} {social.handle && <span className="mono">{social.handle}</span>}
                    {social.href.startsWith("http") && <span aria-hidden="true">↗</span>}
                  </a>
                ) : (
                  <CopyHandle label={social.label} handle={social.handle ?? ""} />
                )}
              </li>
            ))}
          </ul>
        </div>
      </div>
    </section>
  );
}
