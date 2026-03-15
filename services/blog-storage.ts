import { Platform } from 'react-native';
import { staticBlogPosts, BlogPost } from '../data/blog-posts';

const STORAGE_KEY = 'halidene_blog_posts';
const isWeb = Platform.OS === 'web';

function loadFromStorage(): BlogPost[] {
  if (!isWeb) return [];
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    return JSON.parse(raw) as BlogPost[];
  } catch {
    return [];
  }
}

function saveToStorage(posts: BlogPost[]): void {
  if (!isWeb) return;
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(posts));
  } catch {
    // storage full or unavailable
  }
}

/** All posts: static + user-created, sorted by date descending */
export function getAllPosts(includeUnpublished = false): BlogPost[] {
  const userPosts = loadFromStorage();
  // User posts override static posts with the same slug
  const userSlugs = new Set(userPosts.map(p => p.slug));
  const merged = [
    ...userPosts,
    ...staticBlogPosts.filter(p => !userSlugs.has(p.slug)),
  ];
  const filtered = includeUnpublished ? merged : merged.filter(p => p.published);
  return filtered.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
}

/** Published posts only (for public blog pages) */
export const blogPosts = getAllPosts(false);

export function getBlogPostBySlug(slug: string): BlogPost | undefined {
  const userPosts = loadFromStorage();
  const fromUser = userPosts.find(p => p.slug === slug);
  if (fromUser) return fromUser;
  return staticBlogPosts.find(p => p.slug === slug);
}

export function savePost(post: BlogPost): void {
  const userPosts = loadFromStorage();
  const idx = userPosts.findIndex(p => p.slug === post.slug);
  if (idx >= 0) {
    userPosts[idx] = post;
  } else {
    userPosts.push(post);
  }
  saveToStorage(userPosts);
}

export function deletePost(slug: string): void {
  const userPosts = loadFromStorage();
  saveToStorage(userPosts.filter(p => p.slug !== slug));
}

export function generateSlug(title: string): string {
  const turkishMap: Record<string, string> = {
    'ç': 'c', 'ğ': 'g', 'ı': 'i', 'ö': 'o', 'ş': 's', 'ü': 'u',
    'Ç': 'c', 'Ğ': 'g', 'İ': 'i', 'Ö': 'o', 'Ş': 's', 'Ü': 'u',
  };
  return title
    .toLowerCase()
    .split('')
    .map(c => turkishMap[c] || c)
    .join('')
    .replace(/[^a-z0-9\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '')
    .substring(0, 80);
}
