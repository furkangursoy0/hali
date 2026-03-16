import React, { useEffect, useMemo, useRef, useState, useCallback } from 'react';
import { View, Text, Pressable, ScrollView, StyleSheet, Platform, useWindowDimensions, Image, Linking } from 'react-native';
// Note: ScrollView kept in import for non-web fallback but web uses native overflow scroll
import { COLORS, SPACING, RADIUS } from '../constants/theme';
import { getAllPosts, getBlogPostBySlug } from '../services/blog-storage';
import { parseMarkdownToSections } from '../services/markdown-parser';
import type { BlogSection } from '../data/blog-posts';

const isWeb = Platform.OS === 'web';
const SITE_URL = 'https://halidene.com';

/* ─── Markdown helpers ─── */
function renderMarkdownText(text: string) {
  const parts: React.ReactNode[] = [];
  const regex = /(\*\*(.+?)\*\*|\[(.+?)\]\((.+?)\))/g;
  let lastIndex = 0;
  let match: RegExpExecArray | null;
  let key = 0;

  while ((match = regex.exec(text)) !== null) {
    if (match.index > lastIndex) {
      parts.push(text.slice(lastIndex, match.index));
    }
    if (match[2]) {
      parts.push(<Text key={key++} style={{ fontWeight: '700', color: COLORS.text }}>{match[2]}</Text>);
    } else if (match[3] && match[4]) {
      const url = match[4];
      parts.push(
        <Text
          key={key++}
          style={{ color: COLORS.primary, textDecorationLine: 'underline' }}
          onPress={() => { if (isWeb) window.open(url, '_blank'); else Linking.openURL(url); }}
        >
          {match[3]}
        </Text>
      );
    }
    lastIndex = match.index + match[0].length;
  }
  if (lastIndex < text.length) {
    parts.push(text.slice(lastIndex));
  }
  return parts.length === 1 && typeof parts[0] === 'string' ? text : parts;
}

/* ─── SEO helpers ─── */
function setMetaTag(property: string, content: string, isProperty = false) {
  if (!isWeb) return;
  const attr = isProperty ? 'property' : 'name';
  let el = document.querySelector(`meta[${attr}="${property}"]`) as HTMLMetaElement | null;
  if (!el) {
    el = document.createElement('meta');
    el.setAttribute(attr, property);
    document.head.appendChild(el);
  }
  el.content = content;
}

function setCanonical(url: string) {
  if (!isWeb) return;
  let el = document.querySelector('link[rel="canonical"]') as HTMLLinkElement | null;
  if (!el) {
    el = document.createElement('link');
    el.rel = 'canonical';
    document.head.appendChild(el);
  }
  el.href = url;
}

function setJsonLd(data: object) {
  if (!isWeb) return;
  let el = document.querySelector('script[type="application/ld+json"][data-blog]') as HTMLScriptElement | null;
  if (!el) {
    el = document.createElement('script');
    el.type = 'application/ld+json';
    el.setAttribute('data-blog', 'true');
    document.head.appendChild(el);
  }
  el.textContent = JSON.stringify(data);
}

/* ─── Scroll to heading (web) ─── */
function scrollToHeading(id: string) {
  if (!isWeb) return;
  const el = document.getElementById(id);
  if (el) {
    el.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }
}

/* ─── Component ─── */
export default function BlogPostScreen({ navigation, route }: any) {
  const { slug } = route.params || {};
  const post = getBlogPostBySlug(slug);
  const { width: viewportWidth } = useWindowDimensions();
  const isWide = isWeb && viewportWidth >= 1000;
  const [activeTocId, setActiveTocId] = useState('');

  const otherPosts = useMemo(() => getAllPosts().filter(p => p.slug !== slug).slice(0, 4), [slug]);

  // Resolve sections: prefer markdown content, fallback to sections array
  const resolvedSections = useMemo(() => {
    if (!post) return [];
    if (post.content && post.content.trim()) {
      return parseMarkdownToSections(post.content);
    }
    return post.sections;
  }, [post]);

  // Table of contents from headings
  const tocItems = useMemo(() => {
    return resolvedSections
      .filter((s): s is Extract<BlogSection, { type: 'heading' }> => s.type === 'heading')
      .map((s, i) => ({
        id: `toc-heading-${i}`,
        text: s.text,
        level: s.level || 2,
      }));
  }, [resolvedSections]);

  // Intersection observer for ToC active state
  useEffect(() => {
    if (!isWeb || tocItems.length < 2) return;
    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting) {
            setActiveTocId(entry.target.id);
          }
        }
      },
      { rootMargin: '-80px 0px -60% 0px', threshold: 0 }
    );
    // Observe after a short delay to let DOM render
    const timeout = setTimeout(() => {
      tocItems.forEach(item => {
        const el = document.getElementById(item.id);
        if (el) observer.observe(el);
      });
    }, 500);
    return () => {
      clearTimeout(timeout);
      observer.disconnect();
    };
  }, [tocItems]);

  // SEO
  useEffect(() => {
    if (!post) return;
    navigation.setOptions({ title: post.title });
    if (!isWeb) return;
    const canonical = `${SITE_URL}/blog/${post.slug}`;
    document.title = post.title;
    setMetaTag('description', post.metaDescription);
    setCanonical(canonical);
    setMetaTag('og:title', post.title, true);
    setMetaTag('og:description', post.metaDescription, true);
    setMetaTag('og:url', canonical, true);
    setMetaTag('og:type', 'article', true);
    if (post.featuredImage) setMetaTag('og:image', post.featuredImage, true);
    setMetaTag('twitter:card', post.featuredImage ? 'summary_large_image' : 'summary');
    setMetaTag('twitter:title', post.title);
    setMetaTag('twitter:description', post.metaDescription);
    if (post.featuredImage) setMetaTag('twitter:image', post.featuredImage);
    const jsonLd: any = {
      '@context': 'https://schema.org',
      '@type': 'Article',
      headline: post.title,
      description: post.metaDescription,
      url: canonical,
      datePublished: post.date,
      author: { '@type': 'Person', name: post.author.name },
      publisher: { '@type': 'Organization', name: 'Halı Dene', url: SITE_URL },
    };
    if (post.updatedDate) jsonLd.dateModified = post.updatedDate;
    if (post.featuredImage) jsonLd.image = post.featuredImage;
    if (post.author.avatar) jsonLd.author.image = post.author.avatar;
    setJsonLd(jsonLd);

    return () => {
      const el = document.querySelector('script[type="application/ld+json"][data-blog]');
      if (el) el.remove();
    };
  }, [post]);

  if (!post) {
    return (
      <View style={styles.container}>
        <View style={styles.notFound}>
          <Text style={styles.notFoundTitle}>Yazı Bulunamadı</Text>
          <Pressable
            style={({ hovered }: any) => [styles.ctaBtn, hovered && styles.ctaBtnHover]}
            onPress={() => navigation.navigate('Blog')}
          >
            <Text style={styles.ctaBtnText}>Blog'a Dön →</Text>
          </Pressable>
        </View>
      </View>
    );
  }

  let headingIndex = 0;

  function renderSection(section: BlogSection, index: number) {
    switch (section.type) {
      case 'heading': {
        const currentIdx = headingIndex++;
        const tocId = `toc-heading-${currentIdx}`;
        const isH3 = section.level === 3;
        return (
          <View key={index} nativeID={tocId}>
            <Text style={[styles.sectionHeading, isH3 && styles.sectionHeadingH3]}>
              {section.text}
            </Text>
          </View>
        );
      }
      case 'paragraph':
        return (
          <Text key={index} style={styles.sectionParagraph}>
            {renderMarkdownText(section.text)}
          </Text>
        );
      case 'image':
        return (
          <View key={index} style={styles.imageWrapper}>
            <Image
              source={{ uri: section.url }}
              style={styles.sectionImage}
              resizeMode="cover"
              accessibilityLabel={section.alt}
            />
            {section.caption && (
              <Text style={styles.imageCaption}>{section.caption}</Text>
            )}
          </View>
        );
      case 'list':
        return (
          <View key={index} style={styles.listWrapper}>
            {section.items.map((item, li) => (
              <View key={li} style={styles.listItem}>
                <Text style={styles.listBullet}>
                  {section.ordered ? `${li + 1}.` : '•'}
                </Text>
                <Text style={styles.listItemText}>{renderMarkdownText(item)}</Text>
              </View>
            ))}
          </View>
        );
      case 'table':
        if (!section.rows || section.rows.length === 0) return null;
        const [header, ...rows] = section.rows;
        return (
          <View key={index} style={styles.table}>
            <View style={styles.tableHeaderRow}>
              {header.map((cell, ci) => (
                <View key={ci} style={[styles.tableCell, ci === 0 && styles.tableCellFirst]}>
                  <Text style={styles.tableHeaderText}>{cell}</Text>
                </View>
              ))}
            </View>
            {rows.map((row, ri) => (
              <View key={ri} style={[styles.tableRow, ri % 2 === 0 && styles.tableRowAlt]}>
                {row.map((cell, ci) => (
                  <View key={ci} style={[styles.tableCell, ci === 0 && styles.tableCellFirst]}>
                    <Text style={styles.tableCellText}>{cell}</Text>
                  </View>
                ))}
              </View>
            ))}
          </View>
        );
      default:
        return null;
    }
  }

  const showToc = tocItems.length >= 2;

  return (
    <View style={styles.container}>
      {/* Navbar */}
      <View style={[
        styles.navbar,
        isWeb && ({
          position: 'sticky', top: 0, zIndex: 100,
          backdropFilter: 'blur(16px)', WebkitBackdropFilter: 'blur(16px)',
        } as any),
      ]}>
        <View style={styles.navInner}>
          <Pressable style={styles.brandRow} onPress={() => navigation.navigate('Login')}>
            <Text style={styles.logo}>HALI</Text>
            <View style={styles.logoBadge}>
              <Text style={styles.logoBadgeText}>DENE</Text>
            </View>
          </Pressable>
          <View style={styles.navRight}>
            <Pressable
              style={({ hovered }: any) => [styles.navGhostBtn, hovered && styles.navGhostBtnHover]}
              onPress={() => navigation.navigate('Blog')}
            >
              <Text style={styles.navGhostBtnText}>Blog</Text>
            </Pressable>
            <Pressable
              style={({ hovered }: any) => [styles.navPrimaryBtn, hovered && styles.navPrimaryBtnHover]}
              onPress={() => navigation.navigate('Login')}
            >
              <Text style={styles.navPrimaryBtnText}>{isWide ? 'Giriş Yap' : 'Giriş'}</Text>
            </Pressable>
          </View>
        </View>
      </View>

      <View
        style={[
          styles.scroll,
          isWeb && ({
            overflowY: 'auto',
            overflowX: 'hidden',
            height: 'calc(100dvh - 57px)',
            flex: 'none',
            WebkitOverflowScrolling: 'touch',
          } as any),
        ]}
      >
        {/* Hero header section — full width background */}
        <View style={styles.heroSection}>
          <View style={[styles.heroInner, !isWide && styles.heroInnerMobile]}>
            {/* Breadcrumb */}
            <View style={styles.breadcrumb}>
              <Pressable onPress={() => navigation.navigate('Login')}>
                <Text style={styles.breadcrumbLink}>Ana Sayfa</Text>
              </Pressable>
              <Text style={styles.breadcrumbSep}>›</Text>
              <Pressable onPress={() => navigation.navigate('Blog')}>
                <Text style={styles.breadcrumbLink}>Blog</Text>
              </Pressable>
              <Text style={styles.breadcrumbSep}>›</Text>
              <Text style={styles.breadcrumbCurrent} numberOfLines={1}>
                {post.title.split('|')[0].trim()}
              </Text>
            </View>

            {/* Title */}
            <Text style={[styles.articleTitle, !isWide && styles.articleTitleMobile]}>
              {post.title.split('|')[0].trim()}
            </Text>

            {/* Summary */}
            {post.summary && (
              <Text style={styles.articleSummary}>{post.summary}</Text>
            )}

            {/* Author + Date row */}
            <View style={styles.authorRow}>
              {post.author.avatar ? (
                <Image source={{ uri: post.author.avatar }} style={styles.authorAvatar} />
              ) : (
                <View style={styles.authorAvatarPlaceholder}>
                  <Text style={styles.authorAvatarLetter}>
                    {post.author.name.charAt(0).toUpperCase()}
                  </Text>
                </View>
              )}
              <View style={{ flex: 1 }}>
                <Text style={styles.authorName}>{post.author.name}</Text>
                <Text style={styles.articleDate}>
                  {formatDate(post.date)}
                  {post.updatedDate && ` · Güncellendi: ${formatDate(post.updatedDate)}`}
                </Text>
              </View>
            </View>
          </View>
        </View>

        {/* Featured Image — wider than content */}
        {post.featuredImage && (
          <View style={styles.featuredImageOuter}>
            <View style={[styles.featuredImageWrapper, !isWide && styles.featuredImageWrapperMobile]}>
              <Image
                source={{ uri: post.featuredImage }}
                style={[styles.featuredImage, !isWide && styles.featuredImageMobile]}
                resizeMode="cover"
                accessibilityLabel={post.featuredImageAlt || post.title}
              />
            </View>
          </View>
        )}

        {/* Main content: sidebar ToC + article */}
        <View style={[styles.mainContent, isWide && styles.mainContentWide]}>
          {/* Sticky ToC sidebar (desktop only) */}
          {showToc && isWide && (
            <View style={[
              styles.tocSidebar,
              isWeb && ({ position: 'sticky', top: 76 } as any),
            ]}>
              <Text style={styles.tocTitle}>İçindekiler</Text>
              <View style={styles.tocDivider} />
              {tocItems.map((item) => (
                <Pressable
                  key={item.id}
                  style={({ hovered }: any) => [
                    styles.tocItem,
                    item.level === 3 && styles.tocItemIndent,
                    hovered && styles.tocItemHover,
                    activeTocId === item.id && styles.tocItemActive,
                  ]}
                  onPress={() => {
                    setActiveTocId(item.id);
                    scrollToHeading(item.id);
                  }}
                >
                  <View style={[styles.tocItemIndicator, activeTocId === item.id && styles.tocItemIndicatorActive]} />
                  <Text style={[
                    styles.tocItemText,
                    activeTocId === item.id && styles.tocItemTextActive,
                  ]}>
                    {item.text}
                  </Text>
                </Pressable>
              ))}
            </View>
          )}

          {/* Article Body */}
          <View style={[styles.articleBody, !isWide && styles.articleBodyMobile]}>
            {/* Inline ToC for mobile */}
            {showToc && !isWide && (
              <View style={styles.tocInline}>
                <Text style={styles.tocTitle}>İçindekiler</Text>
                <View style={styles.tocDivider} />
                {tocItems.map((item) => (
                  <Pressable
                    key={item.id}
                    style={({ hovered }: any) => [
                      styles.tocItem,
                      item.level === 3 && styles.tocItemIndent,
                      hovered && styles.tocItemHover,
                    ]}
                    onPress={() => scrollToHeading(item.id)}
                  >
                    <Text style={styles.tocItemText}>{item.text}</Text>
                  </Pressable>
                ))}
              </View>
            )}

            {resolvedSections.map((section, i) => renderSection(section, i))}
          </View>
        </View>

        {/* Divider */}
        <View style={styles.divider} />

        {/* Other Posts */}
        {otherPosts.length > 0 && (
          <View style={[styles.otherSection, !isWide && styles.otherSectionMobile]}>
            <Text style={styles.otherTitle}>Diğer Yazılar</Text>
            <View style={[styles.otherGrid, isWide && styles.otherGridWide]}>
              {otherPosts.map((p) => (
                <Pressable
                  key={p.slug}
                  style={({ hovered }: any) => [styles.otherCard, hovered && styles.otherCardHover]}
                  onPress={() => navigation.navigate('BlogPost', { slug: p.slug })}
                >
                  <Text style={styles.otherCardTitle}>{p.title.split('|')[0].trim()}</Text>
                  <Text style={styles.otherCardSummary} numberOfLines={2}>{p.summary}</Text>
                  <Text style={styles.otherCardLink}>Devamını Oku →</Text>
                </Pressable>
              ))}
            </View>
          </View>
        )}

        {/* CTA Banner */}
        <View style={styles.ctaBanner}>
          <View style={[styles.ctaBannerInner, !isWide && styles.ctaBannerInnerMobile]}>
            <View style={{ flex: 1 }}>
              <Text style={styles.ctaBannerTitle}>Halıyı Odanızda Deneyin</Text>
              <Text style={styles.ctaBannerSub}>Yapay zeka ile 3700+ halıyı odanızda görün. Ücretsiz deneyin.</Text>
            </View>
            <Pressable
              style={({ hovered }: any) => [styles.ctaBtn, hovered && styles.ctaBtnHover]}
              onPress={() => navigation.navigate('Login')}
            >
              <Text style={styles.ctaBtnText}>Ücretsiz Dene →</Text>
            </Pressable>
          </View>
        </View>

        {/* Footer */}
        <View style={styles.footer}>
          <View style={styles.footerBrand}>
            <Text style={styles.footerLogo}>HALI</Text>
            <View style={styles.footerBadge}>
              <Text style={styles.footerBadgeText}>DENE</Text>
            </View>
          </View>
          <Text style={styles.footerText}>Yapay zeka destekli halı deneme platformu</Text>
          <Text style={styles.footerCopy}>halidene.com · {new Date().getFullYear()}</Text>
        </View>
      </View>
    </View>
  );
}

function formatDate(dateStr: string): string {
  const d = new Date(dateStr);
  const months = ['Ocak', 'Şubat', 'Mart', 'Nisan', 'Mayıs', 'Haziran', 'Temmuz', 'Ağustos', 'Eylül', 'Ekim', 'Kasım', 'Aralık'];
  return `${d.getDate()} ${months[d.getMonth()]} ${d.getFullYear()}`;
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },
  // Navbar
  navbar: {
    backgroundColor: 'rgba(15, 15, 15, 0.85)',
    borderBottomWidth: 1, borderBottomColor: COLORS.border, paddingHorizontal: SPACING.md,
  },
  navInner: {
    maxWidth: 1100, width: '100%', alignSelf: 'center', height: 56,
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
  },
  brandRow: { flexDirection: 'row', alignItems: 'center' },
  logo: { fontSize: 18, fontWeight: '800', color: COLORS.text, letterSpacing: 0.5 },
  logoBadge: {
    marginLeft: 6, backgroundColor: 'rgba(200, 134, 10, 0.16)',
    borderWidth: 1, borderColor: 'rgba(200, 134, 10, 0.45)', borderRadius: 6,
    paddingHorizontal: 6, paddingVertical: 1,
  },
  logoBadgeText: { fontSize: 9, fontWeight: '800', color: COLORS.primaryLight, letterSpacing: 0.4, textTransform: 'uppercase' },
  navRight: { flexDirection: 'row', alignItems: 'center', gap: SPACING.sm },
  navGhostBtn: { borderWidth: 1, borderColor: COLORS.border, borderRadius: RADIUS.md, paddingHorizontal: 16, paddingVertical: 8 },
  navGhostBtnHover: { borderColor: COLORS.primaryGlowStrong, backgroundColor: COLORS.surfaceElevated },
  navGhostBtnText: { color: COLORS.textSecondary, fontSize: 13, fontWeight: '600' },
  navPrimaryBtn: { backgroundColor: COLORS.primary, borderRadius: RADIUS.md, paddingHorizontal: 18, paddingVertical: 8 },
  navPrimaryBtnHover: { backgroundColor: COLORS.primaryLight },
  navPrimaryBtnText: { color: COLORS.white, fontSize: 13, fontWeight: '700' },
  // Scroll
  scroll: { flex: 1 },
  scrollContent: {},
  // Not found
  notFound: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingTop: 120 },
  notFoundTitle: { fontSize: 24, fontWeight: '700', color: COLORS.text, marginBottom: SPACING.lg },
  // Hero section
  heroSection: {
    backgroundColor: COLORS.surface,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
    paddingTop: SPACING.xl,
    paddingBottom: SPACING.xl,
  },
  heroInner: {
    maxWidth: 760, width: '100%', alignSelf: 'center', paddingHorizontal: SPACING.xl,
  },
  heroInnerMobile: { paddingHorizontal: SPACING.md },
  // Breadcrumb
  breadcrumb: { flexDirection: 'row', alignItems: 'center', marginBottom: SPACING.lg, flexWrap: 'wrap', gap: 6 },
  breadcrumbLink: { fontSize: 13, color: COLORS.primary, fontWeight: '600' },
  breadcrumbSep: { fontSize: 13, color: COLORS.textMuted },
  breadcrumbCurrent: { fontSize: 13, color: COLORS.textMuted, flex: 1 },
  // Article header
  articleTitle: { fontSize: 40, fontWeight: '800', color: COLORS.text, lineHeight: 52, marginBottom: SPACING.md },
  articleTitleMobile: { fontSize: 28, lineHeight: 38 },
  articleSummary: { fontSize: 18, color: COLORS.textSecondary, lineHeight: 28, marginBottom: SPACING.lg },
  // Author
  authorRow: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  authorAvatar: { width: 48, height: 48, borderRadius: 24 },
  authorAvatarPlaceholder: {
    width: 48, height: 48, borderRadius: 24,
    backgroundColor: COLORS.primaryGlow, borderWidth: 1.5, borderColor: COLORS.primaryGlowStrong,
    alignItems: 'center', justifyContent: 'center',
  },
  authorAvatarLetter: { fontSize: 20, fontWeight: '700', color: COLORS.primary },
  authorName: { fontSize: 15, fontWeight: '700', color: COLORS.text },
  articleDate: { fontSize: 13, color: COLORS.textMuted, marginTop: 2 },
  // Featured image
  featuredImageOuter: { alignItems: 'center', paddingHorizontal: SPACING.md, marginTop: -1 },
  featuredImageWrapper: { maxWidth: 900, width: '100%', marginTop: SPACING.xl },
  featuredImageWrapperMobile: { maxWidth: '100%' },
  featuredImage: { width: '100%', height: 420, borderRadius: RADIUS.xl },
  featuredImageMobile: { height: 220, borderRadius: RADIUS.lg },
  // Main content area
  mainContent: {
    maxWidth: 760, width: '100%', alignSelf: 'center',
    paddingTop: SPACING.xl,
  },
  mainContentWide: {
    maxWidth: 1100, flexDirection: 'row', gap: SPACING.xxl,
    paddingHorizontal: SPACING.xl,
  },
  // ToC sidebar (desktop)
  tocSidebar: {
    width: 240, alignSelf: 'flex-start', paddingTop: SPACING.sm,
  },
  tocTitle: { fontSize: 13, fontWeight: '700', color: COLORS.textMuted, textTransform: 'uppercase', letterSpacing: 1 },
  tocDivider: { height: 1, backgroundColor: COLORS.border, marginTop: SPACING.sm, marginBottom: SPACING.sm },
  tocItem: {
    flexDirection: 'row', alignItems: 'flex-start',
    paddingVertical: 7, paddingHorizontal: 0, borderRadius: 0,
    gap: 10,
  },
  tocItemIndent: { paddingLeft: 16 },
  tocItemHover: { opacity: 0.8 },
  tocItemActive: {},
  tocItemIndicator: {
    width: 3, minHeight: 16, borderRadius: 2, backgroundColor: 'transparent', marginTop: 2,
  },
  tocItemIndicatorActive: { backgroundColor: COLORS.primary },
  tocItemText: { fontSize: 14, color: COLORS.textMuted, lineHeight: 20, flex: 1 },
  tocItemTextActive: { color: COLORS.text, fontWeight: '600' },
  // ToC inline (mobile)
  tocInline: {
    backgroundColor: COLORS.surface, borderRadius: RADIUS.lg,
    borderWidth: 1, borderColor: COLORS.border,
    padding: SPACING.md, marginBottom: SPACING.xl,
  },
  // Article body
  articleBody: { flex: 1, paddingHorizontal: SPACING.xl, paddingBottom: SPACING.xxl },
  articleBodyMobile: { paddingHorizontal: SPACING.md },
  // Sections
  sectionHeading: {
    fontSize: 26, fontWeight: '700', color: COLORS.text,
    marginTop: SPACING.xxl, marginBottom: SPACING.sm, lineHeight: 34,
  },
  sectionHeadingH3: { fontSize: 20, marginTop: SPACING.xl, lineHeight: 28 },
  sectionParagraph: {
    fontSize: 17, color: COLORS.textSecondary, lineHeight: 30, marginBottom: SPACING.md,
  },
  // Image sections
  imageWrapper: { marginVertical: SPACING.lg, borderRadius: RADIUS.lg, overflow: 'hidden' },
  sectionImage: { width: '100%', height: 320, borderRadius: RADIUS.lg },
  imageCaption: { fontSize: 13, color: COLORS.textMuted, textAlign: 'center', marginTop: SPACING.sm, fontStyle: 'italic' },
  // Lists
  listWrapper: { marginBottom: SPACING.lg, paddingLeft: 4 },
  listItem: { flexDirection: 'row', marginBottom: 10, paddingRight: SPACING.md },
  listBullet: { fontSize: 17, color: COLORS.primary, fontWeight: '700', width: 28, lineHeight: 30 },
  listItemText: { flex: 1, fontSize: 17, color: COLORS.textSecondary, lineHeight: 30 },
  // Table
  table: {
    borderWidth: 1, borderColor: COLORS.border, borderRadius: RADIUS.lg,
    overflow: 'hidden', marginVertical: SPACING.lg,
  },
  tableHeaderRow: {
    flexDirection: 'row', backgroundColor: COLORS.surfaceElevated,
    borderBottomWidth: 1, borderBottomColor: COLORS.border,
  },
  tableRow: { flexDirection: 'row', borderBottomWidth: 1, borderBottomColor: COLORS.border },
  tableRowAlt: { backgroundColor: 'rgba(26, 26, 26, 0.5)' },
  tableCell: { flex: 1, paddingHorizontal: 14, paddingVertical: 12 },
  tableCellFirst: { flex: 0.8 },
  tableHeaderText: { fontSize: 14, fontWeight: '700', color: COLORS.text },
  tableCellText: { fontSize: 14, color: COLORS.textSecondary, lineHeight: 22 },
  // Divider
  divider: { height: 1, backgroundColor: COLORS.border, maxWidth: 760, width: '100%', alignSelf: 'center' },
  // Other posts
  otherSection: {
    maxWidth: 760, width: '100%', alignSelf: 'center',
    paddingHorizontal: SPACING.xl, paddingTop: SPACING.xxl, paddingBottom: SPACING.lg,
  },
  otherSectionMobile: { paddingHorizontal: SPACING.md },
  otherTitle: { fontSize: 22, fontWeight: '700', color: COLORS.text, marginBottom: SPACING.md },
  otherGrid: { gap: SPACING.sm },
  otherGridWide: { flexDirection: 'row', flexWrap: 'wrap' },
  otherCard: {
    backgroundColor: COLORS.surface, borderRadius: RADIUS.lg,
    borderWidth: 1, borderColor: COLORS.border, padding: SPACING.lg, flex: 1, minWidth: 280,
  },
  otherCardHover: { borderColor: COLORS.primaryGlowStrong, backgroundColor: COLORS.surfaceElevated },
  otherCardTitle: { fontSize: 16, fontWeight: '700', color: COLORS.text, marginBottom: SPACING.xs, lineHeight: 24 },
  otherCardSummary: { fontSize: 14, color: COLORS.textMuted, lineHeight: 22, marginBottom: SPACING.sm },
  otherCardLink: { fontSize: 13, fontWeight: '700', color: COLORS.primary },
  // CTA Banner
  ctaBanner: {
    backgroundColor: COLORS.surface, borderTopWidth: 1, borderTopColor: COLORS.border,
    borderBottomWidth: 1, borderBottomColor: COLORS.border, paddingVertical: SPACING.xxl,
  },
  ctaBannerInner: {
    maxWidth: 760, width: '100%', alignSelf: 'center', paddingHorizontal: SPACING.xl,
    flexDirection: 'row', alignItems: 'center', gap: SPACING.xl,
  },
  ctaBannerInnerMobile: { flexDirection: 'column', paddingHorizontal: SPACING.md, alignItems: 'stretch' },
  ctaBannerTitle: { fontSize: 24, fontWeight: '800', color: COLORS.text, marginBottom: SPACING.xs },
  ctaBannerSub: { fontSize: 15, color: COLORS.textSecondary, lineHeight: 22 },
  ctaBtn: { backgroundColor: COLORS.primary, borderRadius: RADIUS.xl, paddingHorizontal: 32, paddingVertical: 14, alignItems: 'center' },
  ctaBtnHover: { backgroundColor: COLORS.primaryLight },
  ctaBtnText: { color: COLORS.white, fontSize: 16, fontWeight: '700' },
  // Footer
  footer: { paddingVertical: SPACING.xl, alignItems: 'center' },
  footerBrand: { flexDirection: 'row', alignItems: 'center', marginBottom: SPACING.sm },
  footerLogo: { fontSize: 16, fontWeight: '800', color: COLORS.text },
  footerBadge: {
    marginLeft: 5, backgroundColor: 'rgba(200, 134, 10, 0.16)',
    borderWidth: 1, borderColor: 'rgba(200, 134, 10, 0.45)', borderRadius: 5,
    paddingHorizontal: 5, paddingVertical: 1,
  },
  footerBadgeText: { fontSize: 8, fontWeight: '800', color: COLORS.primaryLight, letterSpacing: 0.3, textTransform: 'uppercase' },
  footerText: { fontSize: 13, color: COLORS.textMuted, marginBottom: 4 },
  footerCopy: { fontSize: 12, color: COLORS.textMuted },
});
