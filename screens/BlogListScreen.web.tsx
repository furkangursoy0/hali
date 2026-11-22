import React from 'react';
import { BlogCards, BlogContact, BlogLayout, useBlogHead } from '../components/landing/BlogLayout.web';
import { getAllPosts } from '../services/blog-storage';

export default function BlogListScreen() {
  useBlogHead(
    'Blog | Halı Dene - Halı Ölçüleri ve Seçim Rehberleri',
    'Halı ölçüleri, boyutları ve seçim rehberleri. Odasına uygun halıyı seçmek isteyenler için faydalı bilgiler.',
    '/blog',
  );

  return (
    <BlogLayout isIndex>
      <header className="hd-blog-hero">
        <div className="hd-container">
          <h1>Blog</h1>
          <p>Halı ölçüleri, seçim rehberleri ve dekorasyon ipuçları</p>
        </div>
      </header>
      <div className="hd-container hd-blog-list">
        <BlogCards posts={getAllPosts()} />
      </div>
      <BlogContact />
    </BlogLayout>
  );
}
