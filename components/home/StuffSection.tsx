import { AppLink as Link } from "../ui/AppLink";
import { Reveal } from "../motion/Reveal";
import { CubeFace } from "./CubeFace";
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

export function StuffSection() {
  return (
    <section className="section" id="stuff" aria-labelledby="stuff-title">
      <div className="container">
        <SectionHead
          index="06"
          label="ls ~/stuff"
          titleId="stuff-title"
          title="stuff."
          intro="this page has no professional purpose. it’s just stuff i like."
        />

        <ul className="stuff-grid">
          <li className="stuff-wide">
            <Reveal className="stuff-card stuff-wide">
              <div className="stuff-art"><PixelScene /></div>
              <div>
                <span className="stuff-path">~/stuff/minecraft</span>
                <h3>minecraft</h3>
                <p>been playing this for ages.</p>
                <p>at some point “playing minecraft” became “installing mods” became “making mods” became “why am i reading networking documentation for minecraft”.</p>
                <p><Link className="text-link" href="/work/nexus">Nexus</Link> exists because of this.</p>
                <small>probably not the intended educational outcome of the game.</small>
              </div>
            </Reveal>
          </li>

          <li>
            <Reveal className="stuff-card" delay={0.06}>
              <div className="stuff-art"><CubeFace /></div>
              <div>
                <span className="stuff-path">~/stuff/cubing</span>
                <h3>cubing</h3>
                <p>newer obsession. currently doing 3x3.</p>
                <p>i don’t have a smart cube, which immediately made me wonder if i could analyse solves without one.</p>
                <small>apparently i cannot have normal hobbies.</small>
              </div>
            </Reveal>
          </li>

          <li>
            <Reveal className="stuff-card">
              <div className="stuff-art"><MapArt /></div>
              <div>
                <span className="stuff-path">~/stuff/maps</span>
                <h3>maps</h3>
                <p>i open maps a lot.</p>
                <p>sometimes for osint. sometimes for geopolitics. sometimes literally just to look at places.</p>
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
                <p>this folder should probably be larger than my projects section.</p>
                <small>no. i will not be explaining this one.</small>
              </div>
            </Reveal>
          </li>
        </ul>
      </div>
    </section>
  );
}
