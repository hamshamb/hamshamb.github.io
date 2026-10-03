import { AppLink as Link } from "@/components/ui/AppLink";

export default function NotFound() {
  return (
    <main id="main" tabIndex={-1} className="not-found">
      <div className="container">
        <p className="section-label mono"><b>404</b><span>not found</span></p>
        <h1>this page doesn&rsquo;t exist. probably one of the abandoned things.</h1>
        <p>try the homepage, or press <kbd>/</kbd> to jump somewhere.</p>
        <Link className="button button-primary" href="/">go home <span className="arrow" aria-hidden="true">→</span></Link>
      </div>
    </main>
  );
}
