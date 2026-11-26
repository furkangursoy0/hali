import React, { useEffect, type ReactNode } from 'react';
import type { BlogPost } from '../../data/blog-posts';
import BrandMark from './BrandMark.web';
import PublicNavbar from './PublicNavbar.web';

const SITE_URL = 'https://halidene.com';
const dateFormat = new Intl.DateTimeFormat('tr-TR', {
  day: 'numeric', month: 'long', year: 'numeric', timeZone: 'UTC',
});

export function blogTitle(post: BlogPost) {
  return post.title.split('|')[0].trim();
}

export type BlogNavigation = { setOptions(options: { title: string }): void };

export function articleSchema(post: BlogPost) {
  return {
    '@context': 'https://schema.org',
    '@type': 'Article',
    headline: post.title,
    description: post.metaDescription,
    url: `${SITE_URL}/blog/${post.slug}`,
    datePublished: post.date,
    dateModified: post.updatedDate,
    image: post.featuredImage,
    author: { '@type': 'Person', name: post.author.name, image: post.author.avatar },
    publisher: { '@type': 'Organization', name: 'Halı Dene', url: SITE_URL },
  };
}

export function useBlogHead(title: string, description: string, path: string, post?: BlogPost, navigation?: BlogNavigation) {
  useEffect(() => {
    navigation?.setOptions({ title });
    const canonical = SITE_URL + path;
    document.title = title;

    let link = document.head.querySelector<HTMLLinkElement>('link[rel="canonical"]');
    if (!link) {
      link = document.createElement('link');
      link.rel = 'canonical';
      document.head.append(link);
    }
    link.href = canonical;

    function setMeta(attribute: 'name' | 'property', key: string, content: string) {
      let meta = document.head.querySelector<HTMLMetaElement>(`meta[${attribute}="${key}"]`);
      if (!meta) {
        meta = document.createElement('meta');
        meta.setAttribute(attribute, key);
        document.head.append(meta);
      }
      meta.content = content;
    }

    setMeta('name', 'description', description);
    setMeta('property', 'og:title', title);
    setMeta('property', 'og:description', description);
    setMeta('property', 'og:url', canonical);
    setMeta('property', 'og:type', post ? 'article' : 'website');
    setMeta('name', 'twitter:card', post ? (post.featuredImage ? 'summary_large_image' : 'summary') : 'summary_large_image');
    setMeta('name', 'twitter:title', title);
    setMeta('name', 'twitter:description', description);
    if (!post) return;

    if (post.featuredImage) {
      setMeta('property', 'og:image', post.featuredImage);
      setMeta('name', 'twitter:image', post.featuredImage);
    }

    let schema = document.head.querySelector<HTMLScriptElement>('script[data-blog]');
    if (!schema) {
      schema = document.createElement('script');
      schema.type = 'application/ld+json';
      schema.dataset.blog = 'true';
      document.head.append(schema);
    }
    schema.textContent = JSON.stringify(articleSchema(post));
    return () => schema.remove();
  }, [navigation, title, description, path, post]);
}

export function BlogLayout({ children, isIndex }: { children: ReactNode; isIndex?: boolean }) {
  return (
    <div className="hd-landing hd-blog">
      <PublicNavbar>
        <a href="/">Ana Sayfa</a>
        <a href="/blog" aria-current={isIndex ? 'page' : undefined}>Blog</a>
        <a href="/iletisim">İletişim</a>
      </PublicNavbar>
      <main>{children}</main>
      <footer className="hd-footer">
        <div className="hd-container hd-footer-inner">
          <div>
            <a href="/" aria-label="Halı Dene ana sayfa"><BrandMark /></a>
            <p>Yapay zekâ destekli halı deneme platformu</p>
          </div>
          <p>halidene.com · {new Date().getFullYear()}</p>
        </div>
      </footer>
    </div>
  );
}

function formatDate(value: string) {
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? value : dateFormat.format(date);
}

export function BlogByline({ post, showUpdate }: { post: BlogPost; showUpdate?: boolean }) {
  return (
    <div className="hd-blog-byline">
      {post.author.avatar && <img src={post.author.avatar} alt="" width={32} height={32} loading="lazy" />}
      <div>
        <span>{post.author.name}</span>
        <time dateTime={post.date}>{formatDate(post.date)}</time>
        {showUpdate && post.updatedDate && (
          <span>Güncellendi <time dateTime={post.updatedDate}>{formatDate(post.updatedDate)}</time></span>
        )}
      </div>
    </div>
  );
}

export function BlogCards({ posts, related = false }: { posts: BlogPost[]; related?: boolean }) {
  const Heading = related ? 'h3' : 'h2';
  return (
    <div className="hd-blog-grid">
      {posts.map(post => (
        <article className="hd-blog-card" key={post.slug}>
          <a href={`/blog/${post.slug}`} className="hd-blog-card-link">
            {post.featuredImage && (
              <img className="hd-blog-card-cover" src={post.featuredImage} alt={post.featuredImageAlt || blogTitle(post)} loading="lazy" />
            )}
            <div className="hd-blog-card-copy">
              <Heading>{blogTitle(post)}</Heading>
              <p>{post.summary}</p>
              {!related && <BlogByline post={post} />}
              <span className="hd-blog-read">Devamını oku <span aria-hidden="true">→</span></span>
            </div>
          </a>
        </article>
      ))}
    </div>
  );
}

export function BlogContact() {
  return (
    <section className="hd-container hd-blog-contact">
      <div>
        <h2>Halı Dene’yi mağazanızda keşfedin</h2>
        <p>3700+ halıyı müşterilerinizin odasında gösterin.</p>
      </div>
      <a className="hd-button hd-button-primary" href="/iletisim">Bilgi Alın <span aria-hidden="true"> →</span></a>
    </section>
  );
}
