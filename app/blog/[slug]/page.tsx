import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { ArticleBody } from "@/components/blog/ArticleBody";
import { AppLink as Link } from "@/components/ui/AppLink";
import { getPost, posts, readingMinutes } from "@/content/blog";
import { portfolio, siteUrl } from "@/content/portfolio";

type Params = { slug: string };

export const dynamicParams = false;

export function generateStaticParams(): Params[] {
  return posts.map((post) => ({ slug: post.slug }));
}

export async function generateMetadata({ params }: { params: Promise<Params> }): Promise<Metadata> {
  const { slug } = await params;
  const post = getPost(slug);
  if (!post) return {};
  return {
    title: post.title.replace(/\.$/, ""),
    description: post.description,
    alternates: { canonical: `/blog/${post.slug}` },
    authors: [{ name: "hamshamb", url: portfolio.owner.github }],
    openGraph: {
      title: `${post.title} · hamshamb`,
      description: post.description,
      type: "article",
      url: `/blog/${post.slug}`,
      publishedTime: post.publishedOn,
      ...(post.updatedOn ? { modifiedTime: post.updatedOn } : {}),
      authors: ["hamshamb"],
      tags: post.tags,
      images: [{ url: "/og.png", alt: "hamshamb: i build things i wish existed." }],
    },
    twitter: { card: "summary_large_image", title: `${post.title} · hamshamb`, description: post.description, images: ["/og.png"] },
  };
}

const dateLabel = new Intl.DateTimeFormat("en-GB", { day: "numeric", month: "long", year: "numeric", timeZone: "UTC" });

export default async function PostPage({ params }: { params: Promise<Params> }) {
  const { slug } = await params;
  const post = getPost(slug);
  if (!post) notFound();
  const minutes = readingMinutes(post);
  const project = post.project ? portfolio.projects.find((item) => item.slug === post.project) : undefined;

  const schema = {
    "@context": "https://schema.org",
    "@type": "BlogPosting",
    headline: post.title,
    description: post.description,
    datePublished: post.publishedOn,
    ...(post.updatedOn ? { dateModified: post.updatedOn } : {}),
    url: `${siteUrl}/blog/${post.slug}`,
    keywords: post.tags.join(", "),
    author: { "@type": "Person", name: "hamshamb", url: portfolio.owner.github },
  };

  return (
    <main id="main" tabIndex={-1} className="post">
      <article className="container" aria-labelledby="post-title">
        <Link className="case-back" href="/blog">
          <span className="arrow" aria-hidden="true">←</span> all writing
        </Link>

        <header className="post-head">
          <p className="post-eyebrow mono">{post.eyebrow}</p>
          <h1 id="post-title" className="post-title">{post.title}</h1>
          <p className="post-dek">{post.dek}</p>
          <p className="post-meta mono">
            <span>by hamshamb</span>
            <time dateTime={post.publishedOn}>{dateLabel.format(new Date(`${post.publishedOn}T00:00:00Z`)).toLowerCase()}</time>
            <span>{minutes} min read</span>
          </p>
          <ul className="post-tags mono" aria-label="Tags">{post.tags.map((tag) => <li key={tag}>{tag}</li>)}</ul>
        </header>

        <div className="post-body">
          <ArticleBody blocks={post.blocks} />
        </div>

        {project && (
          <footer className="post-foot">
            <p className="mono">the project</p>
            <Link className="post-foot-link" href={`/work/${project.slug}`}>
              <strong>see the {project.name} case study <span className="arrow" aria-hidden="true">→</span></strong>
              <span>{project.hook}</span>
            </Link>
          </footer>
        )}
      </article>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }} />
    </main>
  );
}
