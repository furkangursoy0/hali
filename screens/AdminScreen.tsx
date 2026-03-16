import React, { useMemo, useState, useCallback } from 'react';
import { Alert, Platform, Pressable, ScrollView, StatusBar, StyleSheet, Text, TextInput, View, useWindowDimensions, Image } from 'react-native';
import { COLORS, RADIUS, SPACING } from '../constants/theme';
import { useAuth, UserRole } from '../contexts/AuthContext';
import { getAllPosts, savePost, deletePost as deleteStoredPost, generateSlug } from '../services/blog-storage';
import { sectionsToMarkdown } from '../services/markdown-parser';
import type { BlogPost, BlogSection } from '../data/blog-posts';

interface AdminScreenProps {
  navigation: any;
}

const isWeb = Platform.OS === 'web';

type AdminTab = 'users' | 'blog';

/* ─── Empty blog post template ─── */
function emptyPost(): BlogPost {
  return {
    slug: '',
    title: '',
    metaDescription: '',
    summary: '',
    content: '',
    date: new Date().toISOString().split('T')[0],
    author: { name: 'Halı Dene Ekibi' },
    sections: [],
    published: false,
  };
}

export default function AdminScreen({ navigation }: AdminScreenProps) {
  const { width } = useWindowDimensions();
  const isCompactWeb = isWeb && width < 760;
  const { user, isAdmin, users, createUser, updateUserPassword, updateUserCredit, deleteUser } = useAuth();

  // Tab
  const [activeTab, setActiveTab] = useState<AdminTab>('users');

  // User management state
  const [fullName, setFullName] = useState('');
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [credit, setCredit] = useState('20');
  const [role, setRole] = useState<UserRole>('STAFF');
  const [passwordDrafts, setPasswordDrafts] = useState<Record<string, string>>({});
  const [creditDrafts, setCreditDrafts] = useState<Record<string, string>>({});
  const [feedbackMessage, setFeedbackMessage] = useState<string>('');

  // Blog management state
  const [blogRefreshKey, setBlogRefreshKey] = useState(0);
  const [editingPost, setEditingPost] = useState<BlogPost | null>(null);
  const [blogFeedback, setBlogFeedback] = useState('');

  const sortedUsers = useMemo(() => {
    return [...users].sort((a, b) => b.createdAt.localeCompare(a.createdAt));
  }, [users]);

  const allBlogPosts = useMemo(() => getAllPosts(true), [blogRefreshKey]);

  // User handlers
  const handleCreateUser = async () => {
    const parsedCredit = Number(credit);
    const result = await createUser({
      fullName, username, password, role,
      credit: Number.isFinite(parsedCredit) ? parsedCredit : 0,
    });
    if (!result.ok) {
      setFeedbackMessage(`Hata: ${result.message}`);
      Alert.alert('Hata', result.message);
      return;
    }
    setFullName(''); setUsername(''); setPassword(''); setCredit('20'); setRole('STAFF');
    setFeedbackMessage('Kullanıcı başarıyla eklendi.');
    Alert.alert('Başarılı', 'Kullanıcı eklendi.');
  };

  const handlePasswordUpdate = async (userId: string) => {
    const nextPassword = (passwordDrafts[userId] || '').trim();
    const result = await updateUserPassword(userId, nextPassword);
    if (!result.ok) { setFeedbackMessage(`Hata: ${result.message}`); Alert.alert('Hata', result.message); return; }
    setPasswordDrafts((prev) => ({ ...prev, [userId]: '' }));
    setFeedbackMessage('Şifre güncellendi.'); Alert.alert('Başarılı', 'Şifre güncellendi.');
  };

  const handleCreditUpdate = async (userId: string) => {
    const nextCredit = Number(creditDrafts[userId] || '0');
    const result = await updateUserCredit(userId, Number.isFinite(nextCredit) ? nextCredit : 0);
    if (!result.ok) { setFeedbackMessage(`Hata: ${result.message}`); Alert.alert('Hata', result.message); return; }
    setCreditDrafts((prev) => { const next = { ...prev }; delete next[userId]; return next; });
    setFeedbackMessage('Kredi güncellendi.'); Alert.alert('Başarılı', 'Kredi güncellendi.');
  };

  const handleDelete = async (userId: string) => {
    const result = await deleteUser(userId);
    if (!result.ok) { setFeedbackMessage(`Hata: ${result.message}`); Alert.alert('Hata', result.message); return; }
    setFeedbackMessage('Kullanıcı silindi.'); Alert.alert('Silindi', 'Kullanıcı kaldırıldı.');
  };

  // Blog handlers
  const handleNewPost = () => setEditingPost(emptyPost());

  const handleEditPost = (post: BlogPost) => {
    // Convert sections to markdown content if no content field
    const content = post.content || sectionsToMarkdown(post.sections);
    setEditingPost({ ...post, content });
  };

  const handleDeletePost = (slug: string) => {
    deleteStoredPost(slug);
    setBlogRefreshKey(k => k + 1);
    setBlogFeedback('Yazı silindi.');
  };

  const handleSavePost = (post: BlogPost, published: boolean) => {
    const finalPost = { ...post, published };
    if (!finalPost.title.trim()) { setBlogFeedback('Başlık gerekli.'); return; }
    if (!finalPost.slug.trim()) finalPost.slug = generateSlug(finalPost.title);
    savePost(finalPost);
    setEditingPost(null);
    setBlogRefreshKey(k => k + 1);
    setBlogFeedback(published ? 'Yazı yayınlandı.' : 'Taslak kaydedildi.');
  };

  if (!isAdmin) {
    return (
      <View style={styles.container}>
        <StatusBar barStyle="light-content" backgroundColor={COLORS.background} />
        <View style={styles.blockedWrap}>
          <Text style={styles.blockedTitle}>Bu sayfa sadece admin için</Text>
          <Pressable style={styles.primaryBtn} onPress={() => navigation.goBack()}>
            <Text style={styles.primaryBtnText}>Geri Dön</Text>
          </Pressable>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor={COLORS.background} />
      <ScrollView
        style={[styles.scroll, isWeb && ({ overflowY: 'auto', maxHeight: '100dvh', WebkitOverflowScrolling: 'touch' } as any)]}
        contentContainerStyle={[styles.content, isWeb && styles.contentWeb, isCompactWeb && styles.contentCompactWeb]}
        showsVerticalScrollIndicator
        keyboardShouldPersistTaps="handled"
      >
        <Pressable style={styles.backBtn} onPress={() => navigation.goBack()}>
          <Text style={styles.backBtnText}>← Geri</Text>
        </Pressable>

        <Text style={styles.title}>Admin Panel</Text>
        <Text style={styles.adminMeta}>Giriş: {user?.fullName} ({user?.username || user?.email})</Text>

        {/* Tab bar */}
        <View style={styles.tabBar}>
          <Pressable
            style={[styles.tabBtn, activeTab === 'users' && styles.tabBtnActive]}
            onPress={() => setActiveTab('users')}
          >
            <Text style={[styles.tabBtnText, activeTab === 'users' && styles.tabBtnTextActive]}>Kullanıcılar</Text>
          </Pressable>
          <Pressable
            style={[styles.tabBtn, activeTab === 'blog' && styles.tabBtnActive]}
            onPress={() => setActiveTab('blog')}
          >
            <Text style={[styles.tabBtnText, activeTab === 'blog' && styles.tabBtnTextActive]}>Blog Yönetimi</Text>
          </Pressable>
        </View>

        {activeTab === 'users' && (
          <>
            {!!feedbackMessage && (
              <View style={styles.feedbackBox}>
                <Text style={styles.feedbackText}>{feedbackMessage}</Text>
              </View>
            )}

            <View style={styles.formCard}>
              <Text style={styles.sectionTitle}>Yeni Kullanıcı</Text>
              <TextInput style={[styles.input, isWeb && styles.inputWeb]} placeholder="Ad Soyad" placeholderTextColor={COLORS.textMuted} value={fullName} onChangeText={setFullName} />
              <TextInput style={[styles.input, isWeb && styles.inputWeb]} placeholder="Kullanıcı adı" placeholderTextColor={COLORS.textMuted} value={username} onChangeText={setUsername} autoCapitalize="none" />
              <TextInput style={[styles.input, isWeb && styles.inputWeb]} placeholder="Şifre" placeholderTextColor={COLORS.textMuted} value={password} onChangeText={setPassword} />
              <TextInput style={[styles.input, isWeb && styles.inputWeb]} placeholder="Başlangıç kredi" placeholderTextColor={COLORS.textMuted} value={credit} onChangeText={setCredit} keyboardType="number-pad" />
              <View style={[styles.roleRow, isCompactWeb && styles.compactStack]}>
                <Pressable style={[styles.roleBtn, role === 'STAFF' && styles.roleBtnActive]} onPress={() => setRole('STAFF')}>
                  <Text style={[styles.roleBtnText, role === 'STAFF' && styles.roleBtnTextActive]}>STAFF</Text>
                </Pressable>
                <Pressable style={[styles.roleBtn, role === 'ADMIN' && styles.roleBtnActive]} onPress={() => setRole('ADMIN')}>
                  <Text style={[styles.roleBtnText, role === 'ADMIN' && styles.roleBtnTextActive]}>ADMIN</Text>
                </Pressable>
              </View>
              <Pressable style={styles.primaryBtn} onPress={handleCreateUser}>
                <Text style={styles.primaryBtnText}>Kullanıcı Ekle</Text>
              </Pressable>
            </View>

            <View style={styles.listCard}>
              <Text style={styles.sectionTitle}>Kullanıcılar ({sortedUsers.length})</Text>
              {sortedUsers.map((item) => (
                <View key={item.id} style={styles.userCard}>
                  <View style={styles.userTopRow}>
                    <View style={{ flex: 1 }}>
                      <Text style={styles.userName}>{item.fullName}</Text>
                      <Text style={styles.userEmail}>{item.username || item.email}</Text>
                    </View>
                    <View style={styles.roleChip}><Text style={styles.roleChipText}>{item.role}</Text></View>
                  </View>
                  <Text style={styles.userMeta}>Şifre: Güvenlik nedeniyle gösterilmez</Text>
                  <Text style={styles.userMeta}>Kredi: {item.credit}</Text>
                  <TextInput
                    style={[styles.input, isWeb && styles.inputWeb]}
                    placeholder="Yeni şifre"
                    placeholderTextColor={COLORS.textMuted}
                    value={passwordDrafts[item.id] || ''}
                    onChangeText={(val) => setPasswordDrafts((prev) => ({ ...prev, [item.id]: val }))}
                  />
                  <View style={[styles.inlineRow, isCompactWeb && styles.compactStack]}>
                    <TextInput
                      style={[styles.input, styles.creditInput, isWeb && styles.inputWeb]}
                      placeholder="Kredi"
                      placeholderTextColor={COLORS.textMuted}
                      value={creditDrafts[item.id] ?? String(item.credit)}
                      onChangeText={(val) => setCreditDrafts((prev) => ({ ...prev, [item.id]: val }))}
                      keyboardType="number-pad"
                    />
                    <Pressable style={styles.inlineBtn} onPress={() => handleCreditUpdate(item.id)}>
                      <Text style={styles.inlineBtnText}>Kredi Güncelle</Text>
                    </Pressable>
                  </View>
                  <View style={[styles.inlineRow, isCompactWeb && styles.compactStack]}>
                    <Pressable style={styles.inlineBtn} onPress={() => handlePasswordUpdate(item.id)}>
                      <Text style={styles.inlineBtnText}>Şifre Güncelle</Text>
                    </Pressable>
                    <Pressable style={[styles.inlineBtn, styles.deleteBtn]} onPress={() => handleDelete(item.id)}>
                      <Text style={styles.inlineBtnText}>Kullanıcı Sil</Text>
                    </Pressable>
                  </View>
                </View>
              ))}
            </View>
          </>
        )}

        {activeTab === 'blog' && (
          <>
            {!!blogFeedback && (
              <View style={styles.feedbackBox}>
                <Text style={styles.feedbackText}>{blogFeedback}</Text>
              </View>
            )}

            {editingPost ? (
              <BlogEditor
                post={editingPost}
                isCompactWeb={isCompactWeb}
                onSave={handleSavePost}
                onCancel={() => setEditingPost(null)}
              />
            ) : (
              <BlogList
                posts={allBlogPosts}
                isCompactWeb={isCompactWeb}
                onNew={handleNewPost}
                onEdit={handleEditPost}
                onDelete={handleDeletePost}
              />
            )}
          </>
        )}
      </ScrollView>
    </View>
  );
}

/* ─── Blog List Component ─── */
function BlogList({ posts, isCompactWeb, onNew, onEdit, onDelete }: {
  posts: BlogPost[];
  isCompactWeb: boolean;
  onNew: () => void;
  onEdit: (post: BlogPost) => void;
  onDelete: (slug: string) => void;
}) {
  return (
    <View style={styles.formCard}>
      <View style={styles.blogListHeader}>
        <Text style={styles.sectionTitle}>Blog Yazıları ({posts.length})</Text>
        <Pressable style={styles.newPostBtn} onPress={onNew}>
          <Text style={styles.newPostBtnText}>+ Yeni Yazı</Text>
        </Pressable>
      </View>

      {posts.length === 0 && (
        <Text style={styles.emptyText}>Henüz blog yazısı yok.</Text>
      )}

      {posts.map((post) => (
        <View key={post.slug} style={styles.blogPostCard}>
          <View style={{ flex: 1 }}>
            <View style={styles.blogPostTitleRow}>
              <Text style={styles.blogPostTitle} numberOfLines={1}>{post.title}</Text>
              <View style={[styles.statusBadge, post.published ? styles.statusPublished : styles.statusDraft]}>
                <Text style={[styles.statusBadgeText, post.published ? styles.statusPublishedText : styles.statusDraftText]}>
                  {post.published ? 'Yayında' : 'Taslak'}
                </Text>
              </View>
            </View>
            <Text style={styles.blogPostMeta}>/{post.slug} · {post.date}</Text>
          </View>
          <View style={[styles.inlineRow, isCompactWeb && styles.compactStack, { marginTop: 8 }]}>
            <Pressable style={styles.inlineBtn} onPress={() => onEdit(post)}>
              <Text style={styles.inlineBtnText}>Düzenle</Text>
            </Pressable>
            <Pressable style={[styles.inlineBtn, styles.deleteBtn]} onPress={() => onDelete(post.slug)}>
              <Text style={styles.inlineBtnText}>Sil</Text>
            </Pressable>
          </View>
        </View>
      ))}
    </View>
  );
}

/* ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
 * WordPress Gutenberg-Style Markdown Blog Editor
 * ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ */
function BlogEditor({ post, isCompactWeb, onSave, onCancel }: {
  post: BlogPost;
  isCompactWeb: boolean;
  onSave: (post: BlogPost, published: boolean) => void;
  onCancel: () => void;
}) {
  const [title, setTitle] = useState(post.title);
  const [slug, setSlug] = useState(post.slug);
  const [slugEdited, setSlugEdited] = useState(!!post.slug);
  const [content, setContent] = useState(post.content || sectionsToMarkdown(post.sections));
  const [metaDescription, setMetaDescription] = useState(post.metaDescription);
  const [summary, setSummary] = useState(post.summary);
  const [authorName, setAuthorName] = useState(post.author.name);
  const [authorAvatar, setAuthorAvatar] = useState(post.author.avatar || '');
  const [date, setDate] = useState(post.date);
  const [featuredImage, setFeaturedImage] = useState(post.featuredImage || '');
  const [featuredImageAlt, setFeaturedImageAlt] = useState(post.featuredImageAlt || '');
  const [showImageInput, setShowImageInput] = useState(false);
  const [showSeo, setShowSeo] = useState(false);
  const [showPreview, setShowPreview] = useState(false);

  const handleTitleChange = (text: string) => {
    setTitle(text);
    if (!slugEdited) {
      setSlug(generateSlug(text));
    }
  };

  const buildPost = (): BlogPost => ({
    ...post,
    title,
    slug: slug || generateSlug(title),
    content,
    metaDescription,
    summary,
    date,
    author: { name: authorName, avatar: authorAvatar || undefined },
    featuredImage: featuredImage || undefined,
    featuredImageAlt: featuredImageAlt || undefined,
    sections: [], // Sections will be parsed from content at render time
  });

  return (
    <View style={styles.editorCard}>
      {/* ── Top Action Bar ── */}
      <View style={styles.edTopBar}>
        <Pressable style={styles.edBackBtn} onPress={onCancel}>
          <Text style={styles.edBackBtnText}>← Geri</Text>
        </Pressable>
        <View style={styles.edTopBarRight}>
          <Pressable
            style={[styles.edPreviewBtn, showPreview && styles.edPreviewBtnActive]}
            onPress={() => setShowPreview(!showPreview)}
          >
            <Text style={[styles.edPreviewBtnText, showPreview && styles.edPreviewBtnTextActive]}>
              {showPreview ? 'Düzenle' : 'Önizleme'}
            </Text>
          </Pressable>
          <Pressable style={styles.edDraftBtn} onPress={() => onSave(buildPost(), false)}>
            <Text style={styles.edDraftBtnText}>Taslak</Text>
          </Pressable>
          <Pressable style={styles.edPublishBtn} onPress={() => onSave(buildPost(), true)}>
            <Text style={styles.edPublishBtnText}>Yayınla</Text>
          </Pressable>
        </View>
      </View>

      {/* ── Title ── */}
      <TextInput
        style={[styles.edTitleInput, isWeb && styles.inputWeb]}
        placeholder="Başlığı girin..."
        placeholderTextColor={COLORS.textMuted}
        value={title}
        onChangeText={handleTitleChange}
        multiline={false}
      />
      <Text style={styles.edSlugPreview}>
        halidene.com/blog/<Text style={{ color: COLORS.primary }}>{slug || 'url-slug'}</Text>
      </Text>

      {/* ── Featured Image ── */}
      <View style={styles.edFeaturedArea}>
        {featuredImage ? (
          <View style={styles.edFeaturedWrap}>
            <Image source={{ uri: featuredImage }} style={styles.edFeaturedImg} resizeMode="cover" />
            <View style={styles.edFeaturedOverlay}>
              <Pressable
                style={styles.edFeaturedRemoveBtn}
                onPress={() => { setFeaturedImage(''); setFeaturedImageAlt(''); }}
              >
                <Text style={styles.edFeaturedRemoveText}>✕</Text>
              </Pressable>
            </View>
            <View style={styles.edFeaturedAltRow}>
              <TextInput
                style={[styles.edFeaturedAltInput, isWeb && styles.inputWeb]}
                placeholder="Görsel alt metni (SEO)..."
                placeholderTextColor={COLORS.textMuted}
                value={featuredImageAlt}
                onChangeText={setFeaturedImageAlt}
              />
            </View>
          </View>
        ) : (
          <View>
            <Pressable
              style={styles.edFeaturedEmpty}
              onPress={() => setShowImageInput(!showImageInput)}
            >
              <Text style={styles.edFeaturedIcon}>📷</Text>
              <Text style={styles.edFeaturedLabel}>Ana Görsel Ekle</Text>
              <Text style={styles.edFeaturedHint}>Önerilen boyut: 1200 x 630 px (16:9 oran)</Text>
              <Text style={styles.edFeaturedHint2}>Blog kartları ve sosyal medya paylaşımlarında kullanılır</Text>
            </Pressable>
            {showImageInput && (
              <View style={styles.edFeaturedInputArea}>
                <TextInput
                  style={[styles.input, isWeb && styles.inputWeb]}
                  placeholder="Görsel URL yapıştırın..."
                  placeholderTextColor={COLORS.textMuted}
                  value={featuredImage}
                  onChangeText={setFeaturedImage}
                  autoCapitalize="none"
                />
                <TextInput
                  style={[styles.input, isWeb && styles.inputWeb, { marginTop: 6 }]}
                  placeholder="Alt metin (SEO için)..."
                  placeholderTextColor={COLORS.textMuted}
                  value={featuredImageAlt}
                  onChangeText={setFeaturedImageAlt}
                />
              </View>
            )}
          </View>
        )}
      </View>

      {/* ── Content Area ── */}
      {showPreview ? (
        <View style={styles.edPreviewArea}>
          <Text style={styles.edPreviewLabel}>Önizleme</Text>
          <MarkdownPreview content={content} />
        </View>
      ) : (
        <View style={styles.edContentArea}>
          {/* Toolbar hints */}
          <View style={styles.edToolbarHints}>
            <Text style={styles.edToolbarHintText}>
              <Text style={{ fontWeight: '700', color: COLORS.textSecondary }}>##</Text> Başlık{'   '}
              <Text style={{ fontWeight: '700', color: COLORS.textSecondary }}>###</Text> Alt Başlık{'   '}
              <Text style={{ fontWeight: '700', color: COLORS.textSecondary }}>**metin**</Text> Kalın{'   '}
              <Text style={{ fontWeight: '700', color: COLORS.textSecondary }}>- madde</Text> Liste{'   '}
              <Text style={{ fontWeight: '700', color: COLORS.textSecondary }}>[metin](url)</Text> Link
            </Text>
          </View>
          <TextInput
            style={[styles.edContentInput, isWeb && styles.edContentInputWeb]}
            placeholder={`İçeriğinizi buraya yazın...

## Başlık

Paragraf metni. **Kalın** ve [link](url) kullanabilirsiniz.

### Alt Başlık

- Madde 1
- Madde 2

1. Sıralı madde
2. Sıralı madde

![Görsel açıklaması](gorsel-url.jpg)
*Görsel alt yazısı*

| Sütun 1 | Sütun 2 | Sütun 3 |
| --- | --- | --- |
| Veri 1 | Veri 2 | Veri 3 |`}
            placeholderTextColor={COLORS.textMuted}
            value={content}
            onChangeText={setContent}
            multiline
            textAlignVertical="top"
          />
        </View>
      )}

      {/* ── SEO & Meta Panel (Collapsible) ── */}
      <Pressable style={styles.edSeoToggle} onPress={() => setShowSeo(!showSeo)}>
        <Text style={styles.edSeoToggleText}>SEO & Meta Ayarları</Text>
        <Text style={styles.edSeoToggleArrow}>{showSeo ? '▼' : '▸'}</Text>
      </Pressable>

      {showSeo && (
        <View style={styles.edSeoPanel}>
          <Text style={styles.edFieldLabel}>URL Slug</Text>
          <TextInput
            style={[styles.input, isWeb && styles.inputWeb]}
            placeholder="url-slug"
            placeholderTextColor={COLORS.textMuted}
            value={slug}
            onChangeText={(text) => { setSlug(text); setSlugEdited(true); }}
            autoCapitalize="none"
          />

          <Text style={styles.edFieldLabel}>Meta Açıklama <Text style={styles.edCharCount}>({metaDescription.length}/160)</Text></Text>
          <TextInput
            style={[styles.input, styles.textArea, isWeb && styles.inputWeb]}
            placeholder="Arama sonuçlarında görünecek açıklama..."
            placeholderTextColor={COLORS.textMuted}
            value={metaDescription}
            onChangeText={setMetaDescription}
            multiline
            maxLength={160}
          />

          <Text style={styles.edFieldLabel}>Özet</Text>
          <TextInput
            style={[styles.input, styles.textArea, isWeb && styles.inputWeb]}
            placeholder="Blog listesinde gösterilecek kısa özet..."
            placeholderTextColor={COLORS.textMuted}
            value={summary}
            onChangeText={setSummary}
            multiline
          />

          <View style={[styles.edSeoRow, isCompactWeb && styles.compactStack]}>
            <View style={{ flex: 1 }}>
              <Text style={styles.edFieldLabel}>Yazar</Text>
              <TextInput
                style={[styles.input, isWeb && styles.inputWeb]}
                placeholder="Yazar adı"
                placeholderTextColor={COLORS.textMuted}
                value={authorName}
                onChangeText={setAuthorName}
              />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.edFieldLabel}>Yazar Avatar URL</Text>
              <TextInput
                style={[styles.input, isWeb && styles.inputWeb]}
                placeholder="Avatar URL (opsiyonel)"
                placeholderTextColor={COLORS.textMuted}
                value={authorAvatar}
                onChangeText={setAuthorAvatar}
                autoCapitalize="none"
              />
            </View>
          </View>

          <Text style={styles.edFieldLabel}>Yayın Tarihi</Text>
          <TextInput
            style={[styles.input, isWeb && styles.inputWeb]}
            placeholder="YYYY-MM-DD"
            placeholderTextColor={COLORS.textMuted}
            value={date}
            onChangeText={setDate}
          />
        </View>
      )}
    </View>
  );
}

/* ─── Markdown Preview Component ─── */
function MarkdownPreview({ content }: { content: string }) {
  const lines = content.split('\n');
  const elements: React.ReactNode[] = [];
  let i = 0;
  let key = 0;

  while (i < lines.length) {
    const line = lines[i];
    const trimmed = line.trim();

    if (!trimmed) { i++; continue; }

    // Heading ###
    if (trimmed.startsWith('### ')) {
      elements.push(
        <Text key={key++} style={styles.prevH3}>{trimmed.slice(4)}</Text>
      );
      i++; continue;
    }

    // Heading ##
    if (trimmed.startsWith('## ')) {
      elements.push(
        <Text key={key++} style={styles.prevH2}>{trimmed.slice(3)}</Text>
      );
      i++; continue;
    }

    // Image
    const imgMatch = trimmed.match(/^!\[([^\]]*)\]\(([^)]+)\)$/);
    if (imgMatch) {
      let caption = '';
      if (i + 1 < lines.length) {
        const next = lines[i + 1].trim();
        if (next.startsWith('*') && next.endsWith('*') && next.length > 2) {
          caption = next.slice(1, -1);
          i++;
        }
      }
      elements.push(
        <View key={key++} style={styles.prevImageWrap}>
          <Image source={{ uri: imgMatch[2] }} style={styles.prevImage} resizeMode="cover" />
          {!!caption && <Text style={styles.prevImageCaption}>{caption}</Text>}
        </View>
      );
      i++; continue;
    }

    // Unordered list
    if (trimmed.match(/^[-*]\s/)) {
      const items: string[] = [];
      while (i < lines.length && lines[i].trim().match(/^[-*]\s/)) {
        items.push(lines[i].trim().replace(/^[-*]\s/, ''));
        i++;
      }
      elements.push(
        <View key={key++} style={styles.prevList}>
          {items.map((item, idx) => (
            <View key={idx} style={styles.prevListItem}>
              <Text style={styles.prevListBullet}>•</Text>
              <Text style={styles.prevListText}>{renderInlineMarkdown(item)}</Text>
            </View>
          ))}
        </View>
      );
      continue;
    }

    // Ordered list
    if (trimmed.match(/^\d+\.\s/)) {
      const items: string[] = [];
      while (i < lines.length && lines[i].trim().match(/^\d+\.\s/)) {
        items.push(lines[i].trim().replace(/^\d+\.\s/, ''));
        i++;
      }
      elements.push(
        <View key={key++} style={styles.prevList}>
          {items.map((item, idx) => (
            <View key={idx} style={styles.prevListItem}>
              <Text style={styles.prevListBullet}>{idx + 1}.</Text>
              <Text style={styles.prevListText}>{renderInlineMarkdown(item)}</Text>
            </View>
          ))}
        </View>
      );
      continue;
    }

    // Table
    if (trimmed.startsWith('|') && trimmed.endsWith('|')) {
      const rows: string[][] = [];
      while (i < lines.length && lines[i].trim().startsWith('|') && lines[i].trim().endsWith('|')) {
        const row = lines[i].trim();
        if (!row.match(/^\|[\s\-:]+(\|[\s\-:]+)+\|$/)) {
          const cells = row.slice(1, -1).split('|').map(c => c.trim());
          if (cells.some(c => c.length > 0)) rows.push(cells);
        }
        i++;
      }
      if (rows.length > 0) {
        const [header, ...dataRows] = rows;
        elements.push(
          <View key={key++} style={styles.prevTable}>
            <View style={styles.prevTableHeaderRow}>
              {header.map((cell, ci) => (
                <View key={ci} style={styles.prevTableCell}>
                  <Text style={styles.prevTableHeaderText}>{cell}</Text>
                </View>
              ))}
            </View>
            {dataRows.map((row, ri) => (
              <View key={ri} style={[styles.prevTableRow, ri % 2 === 0 && styles.prevTableRowAlt]}>
                {row.map((cell, ci) => (
                  <View key={ci} style={styles.prevTableCell}>
                    <Text style={styles.prevTableCellText}>{cell}</Text>
                  </View>
                ))}
              </View>
            ))}
          </View>
        );
      }
      continue;
    }

    // Paragraph
    let text = trimmed;
    i++;
    while (i < lines.length) {
      const next = lines[i].trim();
      if (!next || next.startsWith('## ') || next.startsWith('### ') ||
          next.match(/^[-*]\s/) || next.match(/^\d+\.\s/) ||
          next.match(/^!\[/) || (next.startsWith('|') && next.endsWith('|'))) break;
      text += ' ' + next;
      i++;
    }
    elements.push(
      <Text key={key++} style={styles.prevParagraph}>{renderInlineMarkdown(text)}</Text>
    );
  }

  if (elements.length === 0) {
    return <Text style={styles.prevEmpty}>İçerik önizlemesi burada görünecek...</Text>;
  }

  return <View>{elements}</View>;
}

/* ─── Inline markdown renderer (bold + links) ─── */
function renderInlineMarkdown(text: string): React.ReactNode {
  const parts: React.ReactNode[] = [];
  const regex = /(\*\*(.+?)\*\*|\[(.+?)\]\((.+?)\))/g;
  let lastIndex = 0;
  let match: RegExpExecArray | null;
  let k = 0;

  while ((match = regex.exec(text)) !== null) {
    if (match.index > lastIndex) {
      parts.push(text.slice(lastIndex, match.index));
    }
    if (match[2]) {
      parts.push(<Text key={k++} style={{ fontWeight: '700', color: COLORS.text }}>{match[2]}</Text>);
    } else if (match[3] && match[4]) {
      parts.push(
        <Text key={k++} style={{ color: COLORS.primary, textDecorationLine: 'underline' }}>
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

/* ━━━━━━━━━━━━━━━━ STYLES ━━━━━━━━━━━━━━━━ */
const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background, minHeight: 0 },
  scroll: { flex: 1, minHeight: 0 },
  content: {
    paddingHorizontal: SPACING.md,
    paddingTop: isWeb ? SPACING.lg : SPACING.xxl + SPACING.sm,
    paddingBottom: SPACING.xxl,
  },
  contentWeb: { paddingBottom: SPACING.xxl + 80, maxWidth: 980, alignSelf: 'center', width: '100%' },
  contentCompactWeb: { maxWidth: 520, paddingBottom: SPACING.xxl + 40 },
  backBtn: { alignSelf: 'flex-start', marginBottom: SPACING.md },
  backBtnText: { color: COLORS.primary, fontSize: 16, fontWeight: '600' },
  title: { color: COLORS.text, fontSize: 28, fontWeight: '800' },
  adminMeta: { color: COLORS.textMuted, marginTop: SPACING.xs, marginBottom: SPACING.md, fontSize: 12 },
  // Tabs
  tabBar: { flexDirection: 'row', gap: SPACING.sm, marginBottom: SPACING.md },
  tabBtn: {
    flex: 1, borderRadius: RADIUS.md, borderWidth: 1, borderColor: COLORS.border,
    backgroundColor: COLORS.surfaceElevated, alignItems: 'center', paddingVertical: SPACING.sm + 2,
  },
  tabBtnActive: { borderColor: COLORS.primary, backgroundColor: 'rgba(200, 134, 10, 0.15)' },
  tabBtnText: { color: COLORS.textSecondary, fontWeight: '700', fontSize: 14 },
  tabBtnTextActive: { color: COLORS.primaryLight },
  // Common
  formCard: {
    backgroundColor: COLORS.surface, borderRadius: RADIUS.xxl,
    borderWidth: 1, borderColor: COLORS.border, padding: SPACING.md, marginBottom: SPACING.md, gap: SPACING.sm,
  },
  listCard: {
    backgroundColor: COLORS.surface, borderRadius: RADIUS.xxl,
    borderWidth: 1, borderColor: COLORS.border, padding: SPACING.md, gap: SPACING.sm,
  },
  feedbackBox: {
    borderWidth: 1, borderColor: 'rgba(200, 134, 10, 0.45)', borderRadius: RADIUS.md,
    backgroundColor: 'rgba(200, 134, 10, 0.12)', paddingHorizontal: SPACING.md, paddingVertical: SPACING.sm, marginBottom: SPACING.sm,
  },
  feedbackText: { color: COLORS.primaryLight, fontSize: 13, fontWeight: '600' },
  sectionTitle: { color: COLORS.text, fontSize: 17, fontWeight: '700', marginBottom: SPACING.xs },
  input: {
    backgroundColor: COLORS.surfaceElevated, borderRadius: RADIUS.md, borderWidth: 1,
    borderColor: COLORS.border, color: COLORS.text, paddingHorizontal: SPACING.md, paddingVertical: SPACING.sm + 2, fontSize: 14,
  },
  inputWeb: { fontSize: 16, outlineStyle: 'none', outlineWidth: 0 } as any,
  textArea: { minHeight: 80, textAlignVertical: 'top' },
  roleRow: { flexDirection: 'row', gap: SPACING.sm },
  compactStack: { flexDirection: 'column' },
  roleBtn: {
    flex: 1, borderRadius: RADIUS.md, borderWidth: 1, borderColor: COLORS.border,
    backgroundColor: COLORS.surfaceElevated, alignItems: 'center', paddingVertical: SPACING.sm,
  },
  roleBtnActive: { borderColor: COLORS.primary, backgroundColor: 'rgba(200, 134, 10, 0.15)' },
  roleBtnText: { color: COLORS.textSecondary, fontWeight: '700', fontSize: 12 },
  roleBtnTextActive: { color: COLORS.primaryLight },
  primaryBtn: {
    backgroundColor: COLORS.primary, borderRadius: RADIUS.md,
    alignItems: 'center', paddingVertical: SPACING.sm + 4, marginTop: SPACING.xs,
  },
  primaryBtnText: { color: COLORS.white, fontSize: 15, fontWeight: '700' },
  userCard: {
    borderWidth: 1, borderColor: COLORS.border, borderRadius: RADIUS.xl,
    padding: SPACING.sm, gap: SPACING.xs, backgroundColor: COLORS.surfaceElevated,
  },
  userTopRow: { flexDirection: 'row', alignItems: 'center', gap: SPACING.sm },
  userName: { color: COLORS.text, fontSize: 15, fontWeight: '700' },
  userEmail: { color: COLORS.textSecondary, fontSize: 12 },
  roleChip: { borderRadius: RADIUS.sm, borderWidth: 1, borderColor: COLORS.border, paddingHorizontal: 8, paddingVertical: 4 },
  roleChipText: { color: COLORS.primary, fontSize: 11, fontWeight: '700' },
  userMeta: { color: COLORS.textMuted, fontSize: 12 },
  inlineRow: { flexDirection: 'row', gap: SPACING.xs, alignItems: 'center' },
  creditInput: { flex: 1 },
  inlineBtn: {
    flex: 1, borderRadius: RADIUS.md, borderWidth: 1, borderColor: COLORS.border,
    backgroundColor: COLORS.surface, alignItems: 'center', paddingVertical: SPACING.sm,
  },
  inlineBtnText: { color: COLORS.textSecondary, fontSize: 12, fontWeight: '700' },
  deleteBtn: { borderColor: '#6A2A2A', backgroundColor: '#2A1717' },
  blockedWrap: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: SPACING.lg, gap: SPACING.md },
  blockedTitle: { color: COLORS.text, fontSize: 20, fontWeight: '800', textAlign: 'center' },
  // Blog list
  blogListHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  newPostBtn: {
    backgroundColor: COLORS.primary, borderRadius: RADIUS.md,
    paddingHorizontal: 14, paddingVertical: 8,
  },
  newPostBtnText: { color: COLORS.white, fontSize: 13, fontWeight: '700' },
  emptyText: { color: COLORS.textMuted, fontSize: 14 },
  blogPostCard: {
    borderWidth: 1, borderColor: COLORS.border, borderRadius: RADIUS.lg,
    padding: SPACING.sm, backgroundColor: COLORS.surfaceElevated,
  },
  blogPostTitleRow: { flexDirection: 'row', alignItems: 'center', gap: SPACING.sm },
  blogPostTitle: { color: COLORS.text, fontSize: 14, fontWeight: '700', flex: 1 },
  blogPostMeta: { color: COLORS.textMuted, fontSize: 12, marginTop: 2 },
  statusBadge: { borderRadius: RADIUS.sm, paddingHorizontal: 8, paddingVertical: 2 },
  statusPublished: { backgroundColor: 'rgba(76, 175, 80, 0.15)' },
  statusDraft: { backgroundColor: 'rgba(200, 134, 10, 0.12)' },
  statusBadgeText: { fontSize: 11, fontWeight: '700' },
  statusPublishedText: { color: COLORS.success },
  statusDraftText: { color: COLORS.primaryLight },

  /* ━━━━━━ Blog Editor ━━━━━━ */
  editorCard: {
    backgroundColor: COLORS.surface, borderRadius: RADIUS.xxl,
    borderWidth: 1, borderColor: COLORS.border, padding: SPACING.lg, marginBottom: SPACING.md,
  },
  // Top bar
  edTopBar: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    paddingBottom: SPACING.md, borderBottomWidth: 1, borderBottomColor: COLORS.border, marginBottom: SPACING.lg,
  },
  edBackBtn: { paddingVertical: 6 },
  edBackBtnText: { color: COLORS.primary, fontSize: 14, fontWeight: '600' },
  edTopBarRight: { flexDirection: 'row', gap: SPACING.sm, alignItems: 'center' },
  edPreviewBtn: {
    borderWidth: 1, borderColor: COLORS.border, borderRadius: RADIUS.md,
    paddingHorizontal: 14, paddingVertical: 7,
  },
  edPreviewBtnActive: { borderColor: COLORS.primary, backgroundColor: 'rgba(200, 134, 10, 0.12)' },
  edPreviewBtnText: { color: COLORS.textSecondary, fontSize: 13, fontWeight: '600' },
  edPreviewBtnTextActive: { color: COLORS.primaryLight },
  edDraftBtn: {
    borderWidth: 1, borderColor: COLORS.border, borderRadius: RADIUS.md,
    paddingHorizontal: 14, paddingVertical: 7,
  },
  edDraftBtnText: { color: COLORS.textSecondary, fontSize: 13, fontWeight: '600' },
  edPublishBtn: {
    backgroundColor: COLORS.primary, borderRadius: RADIUS.md,
    paddingHorizontal: 18, paddingVertical: 8,
  },
  edPublishBtnText: { color: COLORS.white, fontSize: 13, fontWeight: '700' },
  // Title
  edTitleInput: {
    fontSize: 28, fontWeight: '800', color: COLORS.text, paddingVertical: SPACING.sm,
    borderWidth: 0, backgroundColor: 'transparent',
  } as any,
  edSlugPreview: { color: COLORS.textMuted, fontSize: 12, marginBottom: SPACING.lg },
  // Featured Image
  edFeaturedArea: {
    marginBottom: SPACING.lg, borderBottomWidth: 1, borderBottomColor: COLORS.border, paddingBottom: SPACING.lg,
  },
  edFeaturedWrap: { borderRadius: RADIUS.xl, overflow: 'hidden', position: 'relative' as any },
  edFeaturedImg: { width: '100%', height: 260, borderRadius: RADIUS.xl },
  edFeaturedOverlay: { position: 'absolute' as any, top: 10, right: 10 },
  edFeaturedRemoveBtn: {
    width: 36, height: 36, borderRadius: 18, backgroundColor: 'rgba(0,0,0,0.6)',
    alignItems: 'center', justifyContent: 'center',
  },
  edFeaturedRemoveText: { color: '#fff', fontSize: 18, fontWeight: '700' },
  edFeaturedAltRow: { padding: SPACING.sm },
  edFeaturedAltInput: {
    backgroundColor: COLORS.surfaceElevated, borderRadius: RADIUS.md, borderWidth: 1,
    borderColor: COLORS.border, color: COLORS.text, paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.sm, fontSize: 13,
  },
  edFeaturedEmpty: {
    borderWidth: 2, borderColor: COLORS.border, borderStyle: 'dashed' as any,
    borderRadius: RADIUS.xl, paddingVertical: 48, alignItems: 'center', justifyContent: 'center',
    backgroundColor: COLORS.surfaceElevated,
  },
  edFeaturedIcon: { fontSize: 40, marginBottom: 8 },
  edFeaturedLabel: { color: COLORS.textSecondary, fontSize: 16, fontWeight: '700' },
  edFeaturedHint: { color: COLORS.textMuted, fontSize: 13, marginTop: 4 },
  edFeaturedHint2: { color: COLORS.textMuted, fontSize: 12, marginTop: 2, fontStyle: 'italic' },
  edFeaturedInputArea: { marginTop: SPACING.sm, gap: 0 },
  // Content
  edContentArea: {
    marginBottom: SPACING.lg,
  },
  edToolbarHints: {
    backgroundColor: COLORS.surfaceElevated, borderRadius: RADIUS.md,
    borderWidth: 1, borderColor: COLORS.border,
    paddingHorizontal: SPACING.md, paddingVertical: SPACING.sm, marginBottom: SPACING.sm,
  },
  edToolbarHintText: { color: COLORS.textMuted, fontSize: 12, lineHeight: 20 },
  edContentInput: {
    color: COLORS.text, fontSize: 15, lineHeight: 26,
    minHeight: 400, textAlignVertical: 'top',
    backgroundColor: COLORS.surfaceElevated, borderRadius: RADIUS.lg,
    borderWidth: 1, borderColor: COLORS.border,
    paddingHorizontal: SPACING.md, paddingVertical: SPACING.md,
  } as any,
  edContentInputWeb: {
    outlineStyle: 'none', outlineWidth: 0,
    fontFamily: 'ui-monospace, "SF Mono", "Cascadia Code", "Segoe UI Mono", monospace',
    fontSize: 14, lineHeight: 24, minHeight: 500,
    resize: 'vertical',
  } as any,
  // Preview
  edPreviewArea: {
    backgroundColor: COLORS.surfaceElevated, borderRadius: RADIUS.lg,
    borderWidth: 1, borderColor: COLORS.border,
    padding: SPACING.lg, marginBottom: SPACING.lg, minHeight: 300,
  },
  edPreviewLabel: {
    color: COLORS.textMuted, fontSize: 11, fontWeight: '700', textTransform: 'uppercase',
    letterSpacing: 1, marginBottom: SPACING.md,
  },
  // SEO Panel
  edSeoToggle: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    borderTopWidth: 1, borderTopColor: COLORS.border, paddingTop: SPACING.md,
    paddingVertical: SPACING.sm,
  },
  edSeoToggleText: { color: COLORS.textSecondary, fontSize: 14, fontWeight: '600' },
  edSeoToggleArrow: { color: COLORS.textMuted, fontSize: 12 },
  edSeoPanel: { gap: SPACING.sm, paddingTop: SPACING.sm },
  edSeoRow: { flexDirection: 'row', gap: SPACING.sm },
  edFieldLabel: { color: COLORS.textSecondary, fontSize: 13, fontWeight: '600', marginTop: SPACING.xs },
  edCharCount: { color: COLORS.textMuted, fontWeight: '400' },

  /* ━━━━━━ Preview Styles ━━━━━━ */
  prevH2: {
    fontSize: 22, fontWeight: '700', color: COLORS.text,
    marginTop: SPACING.xl, marginBottom: SPACING.sm, lineHeight: 30,
  },
  prevH3: {
    fontSize: 18, fontWeight: '700', color: COLORS.text,
    marginTop: SPACING.lg, marginBottom: SPACING.sm, lineHeight: 26,
  },
  prevParagraph: {
    fontSize: 15, color: COLORS.textSecondary, lineHeight: 26, marginBottom: SPACING.md,
  },
  prevList: { marginBottom: SPACING.md, paddingLeft: 4 },
  prevListItem: { flexDirection: 'row', marginBottom: 6 },
  prevListBullet: { color: COLORS.primary, fontWeight: '700', width: 24, fontSize: 15, lineHeight: 26 },
  prevListText: { flex: 1, fontSize: 15, color: COLORS.textSecondary, lineHeight: 26 },
  prevImageWrap: { marginVertical: SPACING.md, borderRadius: RADIUS.lg, overflow: 'hidden' },
  prevImage: { width: '100%', height: 240, borderRadius: RADIUS.lg },
  prevImageCaption: { fontSize: 13, color: COLORS.textMuted, textAlign: 'center', marginTop: SPACING.sm, fontStyle: 'italic' },
  prevTable: {
    borderWidth: 1, borderColor: COLORS.border, borderRadius: RADIUS.lg,
    overflow: 'hidden', marginVertical: SPACING.md,
  },
  prevTableHeaderRow: {
    flexDirection: 'row', backgroundColor: COLORS.surfaceElevated,
    borderBottomWidth: 1, borderBottomColor: COLORS.border,
  },
  prevTableRow: { flexDirection: 'row', borderBottomWidth: 1, borderBottomColor: COLORS.border },
  prevTableRowAlt: { backgroundColor: 'rgba(26, 26, 26, 0.5)' },
  prevTableCell: { flex: 1, paddingHorizontal: 12, paddingVertical: 10 },
  prevTableHeaderText: { fontSize: 13, fontWeight: '700', color: COLORS.text },
  prevTableCellText: { fontSize: 13, color: COLORS.textSecondary, lineHeight: 20 },
  prevEmpty: { color: COLORS.textMuted, fontSize: 14, fontStyle: 'italic' },
});
