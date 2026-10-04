import { AppLink as Link } from "../ui/AppLink";
import { portfolio, sections } from "@/content/portfolio";
import { LocalTime } from "../ui/LocalTime";

export function SiteFooter() {
  const { owner } = portfolio;

  return (
    <footer className="site-footer">
      <div className="container">
        <div className="footer-grid">
          <div className="footer-brand">
            <Link href="/" className="brand">
              <span className="brand-mark" aria-hidden="true">h/</span>
              <span>{owner.name}</span>
            </Link>
            <p className="footer-since mono">coding since 2021</p>
            <p>somewhere between a good idea and a repository.</p>
          </div>

          <nav className="footer-col" aria-label="Footer">
            <h2 className="mono">site</h2>
            <ul>
              {sections.map((section) => (
                <li key={section.id}><a href={`/#${section.id}`}>{section.label}</a></li>
              ))}
              <li><Link href="/#now">/now</Link></li>
            </ul>
          </nav>

          <div className="footer-col">
            <h2 className="mono">elsewhere</h2>
            <ul>
              <li><a href={`mailto:${owner.email}`}>{owner.email}</a></li>
              <li><a href={owner.github} target="_blank" rel="noopener noreferrer">github <span aria-hidden="true">↗</span></a></li>
            </ul>
          </div>
        </div>

        <div className="footer-base mono">
          <span>© 2026 {owner.name}</span>
          <span>{owner.location.toLowerCase()}, <LocalTime /></span>
          <a className="to-top" href="#top">back to top <span className="arrow" aria-hidden="true">↑</span></a>
        </div>
      </div>
    </footer>
  );
}
