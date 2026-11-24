import React from 'react';
import './components/landing/web-landing.css';
import './components/landing/web-blog.css';
import LandingScreen from './screens/LandingScreen.web';
import BlogListScreen from './screens/BlogListScreen.web';
import BlogPostScreen from './screens/BlogPostScreen.web';
import ContactScreen from './screens/ContactScreen.web';

export default function PublicWebsite() {
  const pathname = window.location.pathname.replace(/\/$/, '');
  if (pathname === '/blog') return <BlogListScreen />;
  if (pathname === '/iletisim') return <ContactScreen />;

  const article = /^\/blog\/([^/]+)$/.exec(pathname);
  if (article) {
    let slug = article[1];
    try {
      slug = decodeURIComponent(slug);
    } catch {
      return <BlogPostScreen route={{}} />;
    }
    return <BlogPostScreen route={{ params: { slug } }} />;
  }

  return <LandingScreen />;
}
