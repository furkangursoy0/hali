import React, { useEffect, useMemo, useRef, useState } from 'react';
import { BlogByline, BlogCards, BlogContact, BlogLayout, blogTitle, useBlogHead } from '../components/landing/BlogLayout.web';
import type { BlogPost, BlogSection } from '../data/blog-posts';
import { getAllPosts, getBlogPostBySlug } from '../services/blog-storage';
import { parseMarkdownToSections } from '../services/markdown-parser';

function inlineMarkdown(text: string) {
  const parts: React.ReactNode[] = [];
  let offset = 0;
  for (const match of text.matchAll(/\*\*(.+?)\*\*|\[(.+?)\]\((.+?)\)/g)) {
    const index = match.index ?? 0;
    parts.push(text.slice(offset, index));
    parts.push(match[1]
      ? <strong key={index}>{match[1]}</strong>
      : <a key={index} href={match[3]} target="_blank" rel="noopener noreferrer">{match[2]}</a>);
    offset = index + match[0].length;
  }
  return [...parts, text.slice(offset)];
}

function ArticleSection({ section, id }: { section: BlogSection; id: string }) {
  switch (section.type) {
    case 'heading': {
      const Heading = section.level === 3 ? 'h3' : 'h2';
      return <Heading id={id}>{section.text}</Heading>;
    }
    case 'paragraph':
      return <p>{inlineMarkdown(section.text)}</p>;
    case 'list': {
      const List = section.ordered ? 'ol' : 'ul';
      return <List>{section.items.map((item, index) => <li key={index}>{inlineMarkdown(item)}</li>)}</List>;
    }
    case 'image':
      return (
        <figure>
          <img src={section.url} alt={section.alt} loading="lazy" />
          {section.caption && <figcaption>{section.caption}</figcaption>}
        </figure>
      );
    case 'table': {
      const [header, ...rows] = section.rows;
      if (!header) return null;
      return (
        <div className="hd-blog-table" role="region" aria-label="Halı ölçü tablosu" tabIndex={0}>
          <table>
            <thead><tr>{header.map((cell, index) => <th key={index} scope="col">{inlineMarkdown(cell)}</th>)}</tr></thead>
            <tbody>
              {rows.map((row, index) => (
                <tr key={index}>{row.map((cell, cellIndex) => <td key={cellIndex}>{inlineMarkdown(cell)}</td>)}</tr>
              ))}
            </tbody>
          </table>
        </div>
      );
    }
  }
}

function BlogArticle({ post }: { post: BlogPost }) {
  useBlogHead(post.title, post.metaDescription, `/blog/${post.slug}`, post);

  const sections = useMemo(() => {
    const content = post.content?.trim();
    let headingIndex = 0;
    return (content ? parseMarkdownToSections(content) : post.sections).map(section => ({
      section,
      id: section.type === 'heading' ? `toc-heading-${headingIndex++}` : '',
    }));
  }, [post]);
  const headings = sections.flatMap(({ section, id }) => section.type === 'heading' ? [{ ...section, id }] : []);
  const showContents = headings.length > 1;
  const related = getAllPosts().filter(item => item.slug !== post.slug).slice(0, 4);
  const [activeHeading, setActiveHeading] = useState('');
  const body = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!showContents || !body.current || typeof IntersectionObserver === 'undefined') return;
    const observer = new IntersectionObserver(entries => {
      const entry = entries.find(item => item.isIntersecting);
      if (entry) setActiveHeading(entry.target.id);
    }, { root: body.current.closest('.hd-blog'), rootMargin: '-92px 0px -60% 0px' });
    body.current.querySelectorAll('h2[id], h3[id]').forEach(heading => observer.observe(heading));
    return () => observer.disconnect();
  }, [sections, showContents]);

  return (
    <BlogLayout>
      <article>
        <header className="hd-blog-hero">
          <div className="hd-container">
            <nav className="hd-blog-breadcrumb" aria-label="Sayfa yolu">
              <a href="/">Ana Sayfa</a><span aria-hidden="true">›</span>
              <a href="/blog">Blog</a><span aria-hidden="true">›</span>
              <span aria-current="page">{blogTitle(post)}</span>
            </nav>
            <h1>{blogTitle(post)}</h1>
            {post.summary && <p>{post.summary}</p>}
            <BlogByline post={post} showUpdate />
          </div>
        </header>
        {post.featuredImage && (
          <div className="hd-container">
            <img className="hd-blog-featured" src={post.featuredImage} alt={post.featuredImageAlt || blogTitle(post)} />
          </div>
        )}
        <div className={`hd-container hd-blog-article${showContents ? ' hd-blog-with-toc' : ''}`}>
          {showContents && (
            <nav className="hd-blog-toc" aria-label="İçindekiler">
              <p>İçindekiler</p>
              <ul>
                {headings.map(heading => (
                  <li key={heading.id} className={heading.level === 3 ? 'hd-blog-toc-subheading' : undefined}>
                    <a href={`#${heading.id}`} aria-current={activeHeading === heading.id ? 'location' : undefined}>{heading.text}</a>
                  </li>
                ))}
              </ul>
            </nav>
          )}
          <div className="hd-blog-body" ref={body}>
            {sections.map(({ section, id }, index) => <ArticleSection key={index} section={section} id={id} />)}
          </div>
        </div>
      </article>
      {related.length > 0 && (
        <section className="hd-container hd-blog-related">
          <h2>Diğer Yazılar</h2>
          <BlogCards posts={related} related />
        </section>
      )}
      <BlogContact />
    </BlogLayout>
  );
}

export default function BlogPostScreen({ route }: { route: { params?: { slug?: string } } }) {
  const slug = route.params?.slug;
  const post = useMemo(() => slug ? getBlogPostBySlug(slug) : undefined, [slug]);

  if (!post) {
    return (
      <BlogLayout>
        <header className="hd-blog-hero hd-blog-not-found">
          <div className="hd-container">
            <h1>Yazı Bulunamadı</h1>
            <a className="hd-button hd-button-primary" href="/blog">Blog’a dön</a>
          </div>
        </header>
      </BlogLayout>
    );
  }

  return <BlogArticle key={post.slug} post={post} />;
}
