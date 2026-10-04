import type { Metadata } from "next";
import { AppLink as Link } from "@/components/ui/AppLink";
import { posts, readingMinutes } from "@/content/blog";

const description = "notes from things that got complicated enough to deserve more than a README.";

export const metadata: Metadata = {
  title: "writing",
  description,
  alternates: { canonical: "/blog" },
  openGraph: { title: "writing · hamshamb", description, type: "website", url: "/blog", images: ["/og.png"] },
};

const dateLabel = new Intl.DateTimeFormat("en-GB", { day: "numeric", month: "short", year: "numeric", timeZone: "UTC" });

export default function BlogIndex() {
  const sorted = [...posts].sort((a, b) => b.publishedOn.localeCompare(a.publishedOn));
  return (
    <main id="main" tabIndex={-1} className="blog">
      <div className="container">
        <header className="blog-head">
          <p className="section-label mono"><b>~/</b><span>blog</span></p>
          <h1 className="blog-title">writing.</h1>
          <p className="blog-intro">{description}</p>
        </header>

        <ol className="post-index">
          {sorted.map((post) => (
            <li key={post.slug}>
              <Link className="post-row" href={`/blog/${post.slug}`}>
                <span className="post-row-meta mono">
                  <time dateTime={post.publishedOn}>{dateLabel.format(new Date(`${post.publishedOn}T00:00:00Z`)).toLowerCase()}</time>
                  <span>{readingMinutes(post)} min read</span>
                </span>
                <span className="post-row-main">
                  <span className="post-row-eyebrow mono">{post.eyebrow}</span>
                  <strong className="post-row-title">{post.title}</strong>
                  <span className="post-row-dek">{post.dek}</span>
                  <span className="post-tags mono">{post.tags.map((tag) => <span key={tag}>{tag}</span>)}</span>
                </span>
                <span className="arrow" aria-hidden="true">→</span>
              </Link>
            </li>
          ))}
        </ol>

        <p className="blog-foot mono">more when something else gets complicated enough.</p>
      </div>
    </main>
  );
}
