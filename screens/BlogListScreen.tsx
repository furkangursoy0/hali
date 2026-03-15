import React, { useEffect, useMemo } from 'react';
import { View, Text, Pressable, ScrollView, StyleSheet, Platform, useWindowDimensions, Image } from 'react-native';
import { COLORS, SPACING, RADIUS } from '../constants/theme';
import { getAllPosts } from '../services/blog-storage';

const isWeb = Platform.OS === 'web';
const SITE_URL = 'https://halidene.com';

export default function BlogListScreen({ navigation }: any) {
  const { width: viewportWidth } = useWindowDimensions();
  const isWide = isWeb && viewportWidth >= 900;
  const posts = useMemo(() => getAllPosts(), []);

  useEffect(() => {
    if (!isWeb) return;
    document.title = 'Blog | Halı Dene - Halı Ölçüleri ve Seçim Rehberleri';
    const meta = document.querySelector('meta[name="description"]');
    if (meta) meta.setAttribute('content', 'Halı ölçüleri, boyutları ve seçim rehberleri. Odasına uygun halıyı seçmek isteyenler için faydalı bilgiler.');

    // Canonical
    let canonical = document.querySelector('link[rel="canonical"]') as HTMLLinkElement | null;
    if (!canonical) {
      canonical = document.createElement('link');
      canonical.rel = 'canonical';
      document.head.appendChild(canonical);
    }
    canonical.href = `${SITE_URL}/blog`;
  }, []);

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
            {isWide && (
              <Pressable
                style={({ hovered }: any) => [styles.navGhostBtn, hovered && styles.navGhostBtnHover]}
                onPress={() => navigation.navigate('Login')}
              >
                <Text style={styles.navGhostBtnText}>Ana Sayfa</Text>
              </Pressable>
            )}
            <Pressable
              style={({ hovered }: any) => [styles.navPrimaryBtn, hovered && styles.navPrimaryBtnHover]}
              onPress={() => navigation.navigate('Login')}
            >
              <Text style={styles.navPrimaryBtnText}>{isWide ? 'Giriş Yap' : 'Giriş'}</Text>
            </Pressable>
          </View>
        </View>
      </View>

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Header */}
        <View style={styles.header}>
          <Text style={[styles.headerTitle, !isWide && styles.headerTitleMobile]}>Blog</Text>
          <Text style={styles.headerSub}>Halı ölçüleri, seçim rehberleri ve dekorasyon ipuçları</Text>
        </View>

        {/* Post Grid */}
        <View style={[styles.grid, isWide && styles.gridWide]}>
          {posts.map((post) => (
            <Pressable
              key={post.slug}
              style={({ hovered }: any) => [
                styles.card,
                isWide && styles.cardWide,
                hovered && styles.cardHover,
              ]}
              onPress={() => navigation.navigate('BlogPost', { slug: post.slug })}
            >
              {post.featuredImage && (
                <View style={styles.cardImageWrapper}>
                  <Image
                    source={{ uri: post.featuredImage }}
                    style={styles.cardImage}
                    resizeMode="cover"
                    accessibilityLabel={post.featuredImageAlt || post.title}
                  />
                </View>
              )}
              <View style={styles.cardContent}>
                <View style={styles.cardBadge}>
                  <Text style={styles.cardBadgeText}>Rehber</Text>
                </View>
                <Text style={styles.cardTitle}>{post.title.split('|')[0].trim()}</Text>
                <Text style={styles.cardSummary} numberOfLines={3}>{post.summary}</Text>
                <View style={styles.cardFooter}>
                  <View style={styles.cardAuthorRow}>
                    {post.author.avatar ? (
                      <Image source={{ uri: post.author.avatar }} style={styles.cardAuthorAvatar} />
                    ) : (
                      <View style={styles.cardAuthorAvatarPlaceholder}>
                        <Text style={styles.cardAuthorAvatarLetter}>
                          {post.author.name.charAt(0).toUpperCase()}
                        </Text>
                      </View>
                    )}
                    <Text style={styles.cardAuthorName}>{post.author.name}</Text>
                    <Text style={styles.cardDate}>{formatDate(post.date)}</Text>
                  </View>
                  <Text style={styles.cardLink}>Devamını Oku →</Text>
                </View>
              </View>
            </Pressable>
          ))}
        </View>

        {/* CTA */}
        <View style={styles.ctaSection}>
          <Text style={styles.ctaTitle}>Halıyı Odanızda Deneyin</Text>
          <Text style={styles.ctaSub}>Yapay zeka ile 3700+ halıyı odanızda görün</Text>
          <Pressable
            style={({ hovered }: any) => [styles.ctaBtn, hovered && styles.ctaBtnHover]}
            onPress={() => navigation.navigate('Login')}
          >
            <Text style={styles.ctaBtnText}>Ücretsiz Dene →</Text>
          </Pressable>
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
      </ScrollView>
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
    maxWidth: 1060, width: '100%', alignSelf: 'center', height: 56,
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
  scrollContent: { paddingBottom: 60 },
  // Header
  header: {
    maxWidth: 800, width: '100%', alignSelf: 'center',
    paddingHorizontal: SPACING.md, paddingTop: SPACING.xxxl, paddingBottom: SPACING.xl, alignItems: 'center',
  },
  headerTitle: { fontSize: 40, fontWeight: '800', color: COLORS.text, marginBottom: SPACING.sm },
  headerTitleMobile: { fontSize: 30 },
  headerSub: { fontSize: 16, color: COLORS.textSecondary, textAlign: 'center', lineHeight: 24 },
  // Grid
  grid: {
    maxWidth: 800, width: '100%', alignSelf: 'center', paddingHorizontal: SPACING.md, gap: SPACING.md,
  },
  gridWide: { flexDirection: 'row', flexWrap: 'wrap' },
  // Card
  card: {
    backgroundColor: COLORS.surface, borderRadius: RADIUS.xl,
    borderWidth: 1, borderColor: COLORS.border, overflow: 'hidden',
  },
  cardWide: { flex: 1, minWidth: 340 },
  cardHover: { borderColor: COLORS.primaryGlowStrong, backgroundColor: COLORS.surfaceElevated },
  cardImageWrapper: { width: '100%', height: 180 },
  cardImage: { width: '100%', height: '100%' },
  cardContent: { padding: SPACING.lg },
  cardBadge: {
    alignSelf: 'flex-start', backgroundColor: COLORS.primaryGlow,
    borderRadius: RADIUS.sm, paddingHorizontal: 10, paddingVertical: 3, marginBottom: SPACING.sm,
  },
  cardBadgeText: { fontSize: 11, fontWeight: '700', color: COLORS.primary },
  cardTitle: { fontSize: 20, fontWeight: '700', color: COLORS.text, marginBottom: SPACING.sm, lineHeight: 28 },
  cardSummary: { fontSize: 14, color: COLORS.textSecondary, lineHeight: 22, marginBottom: SPACING.md },
  cardFooter: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  cardAuthorRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  cardAuthorAvatar: { width: 24, height: 24, borderRadius: 12 },
  cardAuthorAvatarPlaceholder: {
    width: 24, height: 24, borderRadius: 12,
    backgroundColor: COLORS.primaryGlow, alignItems: 'center', justifyContent: 'center',
  },
  cardAuthorAvatarLetter: { fontSize: 11, fontWeight: '700', color: COLORS.primary },
  cardAuthorName: { fontSize: 12, color: COLORS.textMuted, fontWeight: '600' },
  cardDate: { fontSize: 12, color: COLORS.textMuted },
  cardLink: { fontSize: 13, fontWeight: '700', color: COLORS.primary },
  // CTA
  ctaSection: {
    maxWidth: 800, width: '100%', alignSelf: 'center', alignItems: 'center',
    paddingHorizontal: SPACING.md, paddingVertical: SPACING.xxxl,
  },
  ctaTitle: { fontSize: 24, fontWeight: '800', color: COLORS.text, marginBottom: SPACING.sm, textAlign: 'center' },
  ctaSub: { fontSize: 15, color: COLORS.textSecondary, marginBottom: SPACING.lg, textAlign: 'center' },
  ctaBtn: { backgroundColor: COLORS.primary, borderRadius: RADIUS.xl, paddingHorizontal: 32, paddingVertical: 14 },
  ctaBtnHover: { backgroundColor: COLORS.primaryLight },
  ctaBtnText: { color: COLORS.white, fontSize: 16, fontWeight: '700' },
  // Footer
  footer: { borderTopWidth: 1, borderTopColor: COLORS.border, paddingVertical: SPACING.xl, alignItems: 'center' },
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
