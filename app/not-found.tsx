import { PacketLost } from "@/components/toys/PacketLost";
import { AppLink as Link } from "@/components/ui/AppLink";

export default function NotFound() {
  return (
    <main id="main" tabIndex={-1} className="not-found">
      <div className="container">
        <p className="section-label mono"><b>404</b><span>packet lost</span></p>
        <h1>page not found. this request took a wrong turn somewhere.</h1>
        <p>the page is not here. it may never have been. the way home is right below.</p>
        <p className="not-found-actions">
          <Link className="button button-primary" href="/">return home <span className="arrow" aria-hidden="true">→</span></Link>
          <span className="mono">or press <kbd>/</kbd> to jump somewhere</span>
        </p>
        <section className="not-found-game" aria-labelledby="packet-title">
          <h2 id="packet-title" className="mono">optional: route the packet home yourself</h2>
          <PacketLost />
        </section>
      </div>
    </main>
  );
}
