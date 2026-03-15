import React, { useMemo, useState, useCallback } from 'react';
import { Alert, Platform, Pressable, ScrollView, StatusBar, StyleSheet, Text, TextInput, View, useWindowDimensions, Image } from 'react-native';
import { COLORS, RADIUS, SPACING } from '../constants/theme';
import { useAuth, UserRole } from '../contexts/AuthContext';
import { getAllPosts, savePost, deletePost as deleteStoredPost, generateSlug } from '../services/blog-storage';
import type { BlogPost, BlogSection, BlogAuthor } from '../data/blog-posts';

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

  const handleEditPost = (post: BlogPost) => setEditingPost({ ...post, sections: post.sections.map(s => ({ ...s })) });

  const handleDeletePost = (slug: string) => {
    deleteStoredPost(slug);
    setBlogRefreshKey(k => k + 1);
    setBlogFeedback('Yazı silindi.');
  };

  const handleSavePost = (published: boolean) => {
    if (!editingPost) return;
    const post = { ...editingPost, published };
    if (!post.title.trim()) { setBlogFeedback('Başlık gerekli.'); return; }
    if (!post.slug.trim()) post.slug = generateSlug(post.title);
    savePost(post);
    setEditingPost(null);
    setBlogRefreshKey(k => k + 1);
    setBlogFeedback(published ? 'Yazı yayınlandı.' : 'Taslak kaydedildi.');
  };

  const updateEditingPost = useCallback((updates: Partial<BlogPost>) => {
    setEditingPost(prev => prev ? { ...prev, ...updates } : null);
  }, []);

  const updateSection = useCallback((index: number, section: BlogSection) => {
    setEditingPost(prev => {
      if (!prev) return null;
      const sections = [...prev.sections];
      sections[index] = section;
      return { ...prev, sections };
    });
  }, []);

  const removeSection = useCallback((index: number) => {
    setEditingPost(prev => {
      if (!prev) return null;
      const sections = prev.sections.filter((_, i) => i !== index);
      return { ...prev, sections };
    });
  }, []);

  const moveSection = useCallback((index: number, direction: -1 | 1) => {
    setEditingPost(prev => {
      if (!prev) return null;
      const sections = [...prev.sections];
      const target = index + direction;
      if (target < 0 || target >= sections.length) return prev;
      [sections[index], sections[target]] = [sections[target], sections[index]];
      return { ...prev, sections };
    });
  }, []);

  const addSection = useCallback((type: BlogSection['type']) => {
    setEditingPost(prev => {
      if (!prev) return null;
      let newSection: BlogSection;
      switch (type) {
        case 'paragraph': newSection = { type: 'paragraph', text: '' }; break;
        case 'heading': newSection = { type: 'heading', text: '', level: 2 }; break;
        case 'image': newSection = { type: 'image', url: '', alt: '' }; break;
        case 'table': newSection = { type: 'table', rows: [['Başlık 1', 'Başlık 2'], ['', '']] }; break;
        case 'list': newSection = { type: 'list', items: [''], ordered: false }; break;
        default: return prev;
      }
      return { ...prev, sections: [...prev.sections, newSection] };
    });
  }, []);

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
                onUpdate={updateEditingPost}
                onUpdateSection={updateSection}
                onRemoveSection={removeSection}
                onMoveSection={moveSection}
                onAddSection={addSection}
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

/* ─── Gutenberg-Style Blog Editor ─── */
function BlogEditor({ post, isCompactWeb, onUpdate, onUpdateSection, onRemoveSection, onMoveSection, onAddSection, onSave, onCancel }: {
  post: BlogPost;
  isCompactWeb: boolean;
  onUpdate: (updates: Partial<BlogPost>) => void;
  onUpdateSection: (index: number, section: BlogSection) => void;
  onRemoveSection: (index: number) => void;
  onMoveSection: (index: number, direction: -1 | 1) => void;
  onAddSection: (type: BlogSection['type']) => void;
  onSave: (published: boolean) => void;
  onCancel: () => void;
}) {
  const [showMeta, setShowMeta] = useState(false);
  const [activeBlockMenu, setActiveBlockMenu] = useState<number | null>(null);
  const [focusedBlock, setFocusedBlock] = useState<number | null>(null);

  const blockTypes: { type: BlogSection['type']; icon: string; label: string }[] = [
    { type: 'paragraph', icon: '¶', label: 'Paragraf' },
    { type: 'heading', icon: 'H', label: 'Başlık' },
    { type: 'image', icon: '🖼', label: 'Görsel' },
    { type: 'list', icon: '☰', label: 'Liste' },
    { type: 'table', icon: '▦', label: 'Tablo' },
  ];

  return (
    <View style={styles.formCard}>
      {/* ── Top Action Bar ── */}
      <View style={styles.gutTopBar}>
        <Pressable style={styles.gutBackBtn} onPress={onCancel}>
          <Text style={styles.gutBackBtnText}>← Geri</Text>
        </Pressable>
        <View style={styles.gutTopBarRight}>
          <Pressable style={styles.gutDraftBtn} onPress={() => onSave(false)}>
            <Text style={styles.gutDraftBtnText}>Taslak Kaydet</Text>
          </Pressable>
          <Pressable style={styles.gutPublishBtn} onPress={() => onSave(true)}>
            <Text style={styles.gutPublishBtnText}>Yayınla</Text>
          </Pressable>
        </View>
      </View>

      {/* ── Title (Gutenberg-style large input) ── */}
      <TextInput
        style={[styles.gutTitleInput, isWeb && styles.inputWeb]}
        placeholder="Başlık ekleyin..."
        placeholderTextColor={COLORS.textMuted}
        value={post.title}
        onChangeText={(title) => {
          const updates: Partial<BlogPost> = { title };
          if (!post.slug || post.slug === generateSlug(post.title)) {
            updates.slug = generateSlug(title);
          }
          onUpdate(updates);
        }}
      />
      {post.slug ? (
        <Text style={styles.gutSlugPreview}>halidene.com/blog/{post.slug}</Text>
      ) : null}

      {/* ── Featured Image (Ana Görsel) ── */}
      <View style={styles.gutFeaturedImageArea}>
        {post.featuredImage ? (
          <View style={styles.gutFeaturedImageWrap}>
            <Image source={{ uri: post.featuredImage }} style={styles.gutFeaturedImageImg} resizeMode="cover" />
            <View style={styles.gutFeaturedImageOverlay}>
              <Pressable
                style={styles.gutFeaturedImageRemoveBtn}
                onPress={() => onUpdate({ featuredImage: undefined, featuredImageAlt: undefined })}
              >
                <Text style={styles.gutFeaturedImageRemoveText}>×</Text>
              </Pressable>
            </View>
          </View>
        ) : (
          <View style={styles.gutFeaturedImageEmpty}>
            <Text style={styles.gutFeaturedImageIcon}>🖼</Text>
            <Text style={styles.gutFeaturedImageLabel}>Ana Görsel Ekle</Text>
            <Text style={styles.gutFeaturedImageHint}>Önerilen boyut: 1200 × 630 px (16:9)</Text>
          </View>
        )}
        <TextInput
          style={[styles.input, isWeb && styles.inputWeb, { marginTop: 8 }]}
          placeholder="Görsel URL yapıştırın..."
          placeholderTextColor={COLORS.textMuted}
          value={post.featuredImage || ''}
          onChangeText={(featuredImage) => onUpdate({ featuredImage: featuredImage || undefined })}
          autoCapitalize="none"
        />
        {post.featuredImage ? (
          <TextInput
            style={[styles.input, isWeb && styles.inputWeb, { marginTop: 4 }]}
            placeholder="Görsel alt metni (SEO için)"
            placeholderTextColor={COLORS.textMuted}
            value={post.featuredImageAlt || ''}
            onChangeText={(featuredImageAlt) => onUpdate({ featuredImageAlt: featuredImageAlt || undefined })}
          />
        ) : null}
      </View>

      {/* ── Content Blocks (Gutenberg-style) ── */}
      <View style={styles.gutBlocksArea}>
        {post.sections.length === 0 && (
          <View style={styles.gutEmptyContent}>
            <Text style={styles.gutEmptyContentText}>İçerik eklemek için aşağıdaki + butonuna tıklayın</Text>
          </View>
        )}

        {post.sections.map((section, index) => (
          <View key={index} style={styles.gutBlockWrapper}>
            {/* Block */}
            <Pressable
              style={[
                styles.gutBlock,
                focusedBlock === index && styles.gutBlockFocused,
              ]}
              onPress={() => setFocusedBlock(focusedBlock === index ? null : index)}
            >
              {/* Block toolbar (visible when focused) */}
              {focusedBlock === index && (
                <View style={styles.gutBlockToolbar}>
                  <Text style={styles.gutBlockTypeLabel}>
                    {section.type === 'paragraph' ? '¶ Paragraf' :
                     section.type === 'heading' ? `H${(section as any).level || 2} Başlık` :
                     section.type === 'image' ? '🖼 Görsel' :
                     section.type === 'list' ? '☰ Liste' :
                     section.type === 'table' ? '▦ Tablo' : section.type}
                  </Text>
                  <View style={styles.gutBlockToolbarActions}>
                    {index > 0 && (
                      <Pressable onPress={() => onMoveSection(index, -1)} style={styles.gutToolbarBtn}>
                        <Text style={styles.gutToolbarBtnText}>↑</Text>
                      </Pressable>
                    )}
                    {index < post.sections.length - 1 && (
                      <Pressable onPress={() => onMoveSection(index, 1)} style={styles.gutToolbarBtn}>
                        <Text style={styles.gutToolbarBtnText}>↓</Text>
                      </Pressable>
                    )}
                    <Pressable onPress={() => { onRemoveSection(index); setFocusedBlock(null); }} style={[styles.gutToolbarBtn, styles.gutToolbarBtnDanger]}>
                      <Text style={[styles.gutToolbarBtnText, { color: '#F44336' }]}>🗑</Text>
                    </Pressable>
                  </View>
                </View>
              )}

              {/* Block content */}
              <GutenbergBlock
                section={section}
                onUpdate={(s) => onUpdateSection(index, s)}
              />
            </Pressable>

            {/* Inline add button between blocks */}
            <View style={styles.gutAddBetween}>
              <View style={styles.gutAddBetweenLine} />
              <Pressable
                style={[styles.gutAddBtn, activeBlockMenu === index && styles.gutAddBtnActive]}
                onPress={() => setActiveBlockMenu(activeBlockMenu === index ? null : index)}
              >
                <Text style={[styles.gutAddBtnText, activeBlockMenu === index && styles.gutAddBtnTextActive]}>+</Text>
              </Pressable>
              <View style={styles.gutAddBetweenLine} />
            </View>

            {/* Block type picker */}
            {activeBlockMenu === index && (
              <View style={styles.gutBlockPicker}>
                {blockTypes.map(({ type, icon, label }) => (
                  <Pressable
                    key={type}
                    style={({ hovered }: any) => [styles.gutBlockPickerItem, hovered && styles.gutBlockPickerItemHover]}
                    onPress={() => { onAddSection(type); setActiveBlockMenu(null); }}
                  >
                    <Text style={styles.gutBlockPickerIcon}>{icon}</Text>
                    <Text style={styles.gutBlockPickerLabel}>{label}</Text>
                  </Pressable>
                ))}
              </View>
            )}
          </View>
        ))}

        {/* Add first/last block button */}
        {post.sections.length === 0 || activeBlockMenu === -1 ? null : (
          <View style={styles.gutAddBetween}>
            <View style={styles.gutAddBetweenLine} />
            <Pressable
              style={[styles.gutAddBtn, activeBlockMenu === -1 && styles.gutAddBtnActive]}
              onPress={() => setActiveBlockMenu(activeBlockMenu === -1 ? null : -1)}
            >
              <Text style={styles.gutAddBtnText}>+</Text>
            </Pressable>
            <View style={styles.gutAddBetweenLine} />
          </View>
        )}

        {/* Bottom block picker (for adding first block or at end) */}
        {(activeBlockMenu === -1 || post.sections.length === 0) && (
          <View style={styles.gutBlockPicker}>
            {blockTypes.map(({ type, icon, label }) => (
              <Pressable
                key={type}
                style={({ hovered }: any) => [styles.gutBlockPickerItem, hovered && styles.gutBlockPickerItemHover]}
                onPress={() => { onAddSection(type); setActiveBlockMenu(null); }}
              >
                <Text style={styles.gutBlockPickerIcon}>{icon}</Text>
                <Text style={styles.gutBlockPickerLabel}>{label}</Text>
              </Pressable>
            ))}
          </View>
        )}
      </View>

      {/* ── Meta / SEO Panel (collapsible) ── */}
      <Pressable
        style={styles.gutMetaToggle}
        onPress={() => setShowMeta(!showMeta)}
      >
        <Text style={styles.gutMetaToggleText}>⚙ Yazı Ayarları (SEO, Yazar, Tarih)</Text>
        <Text style={styles.gutMetaToggleArrow}>{showMeta ? '▲' : '▼'}</Text>
      </Pressable>

      {showMeta && (
        <View style={styles.gutMetaPanel}>
          {/* Slug */}
          <Text style={styles.fieldLabel}>Slug (URL)</Text>
          <TextInput
            style={[styles.input, isWeb && styles.inputWeb]}
            placeholder="yazi-url-adresi"
            placeholderTextColor={COLORS.textMuted}
            value={post.slug}
            onChangeText={(slug) => onUpdate({ slug })}
            autoCapitalize="none"
          />

          {/* Meta Description */}
          <Text style={styles.fieldLabel}>Meta Açıklama (SEO)</Text>
          <TextInput
            style={[styles.input, styles.textArea, isWeb && styles.inputWeb]}
            placeholder="Google arama sonuçlarında görünecek açıklama (max 160 karakter)"
            placeholderTextColor={COLORS.textMuted}
            value={post.metaDescription}
            onChangeText={(metaDescription) => onUpdate({ metaDescription })}
            multiline
            numberOfLines={3}
          />
          <Text style={styles.fieldHint}>{(post.metaDescription || '').length}/160 karakter</Text>

          {/* Summary */}
          <Text style={styles.fieldLabel}>Özet</Text>
          <TextInput
            style={[styles.input, styles.textArea, isWeb && styles.inputWeb]}
            placeholder="Blog listesinde görünecek kısa özet"
            placeholderTextColor={COLORS.textMuted}
            value={post.summary}
            onChangeText={(summary) => onUpdate({ summary })}
            multiline
            numberOfLines={2}
          />

          {/* Author */}
          <Text style={styles.fieldLabel}>Yazar</Text>
          <TextInput
            style={[styles.input, isWeb && styles.inputWeb]}
            placeholder="Yazar adı"
            placeholderTextColor={COLORS.textMuted}
            value={post.author.name}
            onChangeText={(name) => onUpdate({ author: { ...post.author, name } })}
          />
          <TextInput
            style={[styles.input, isWeb && styles.inputWeb]}
            placeholder="Yazar fotoğraf URL (opsiyonel)"
            placeholderTextColor={COLORS.textMuted}
            value={post.author.avatar || ''}
            onChangeText={(avatar) => onUpdate({ author: { ...post.author, avatar: avatar || undefined } })}
            autoCapitalize="none"
          />

          {/* Date */}
          <Text style={styles.fieldLabel}>Tarih</Text>
          <TextInput
            style={[styles.input, isWeb && styles.inputWeb]}
            placeholder="YYYY-MM-DD"
            placeholderTextColor={COLORS.textMuted}
            value={post.date}
            onChangeText={(date) => onUpdate({ date })}
          />
        </View>
      )}
    </View>
  );
}

/* ─── Gutenberg Block Renderer (inline editing) ─── */
function GutenbergBlock({ section, onUpdate }: {
  section: BlogSection;
  onUpdate: (section: BlogSection) => void;
}) {
  if (section.type === 'paragraph') {
    return (
      <TextInput
        style={[styles.gutParagraphInput, isWeb && styles.inputWeb]}
        placeholder="Yazmaya başlayın... (**kalın**, [link](url) desteklenir)"
        placeholderTextColor={COLORS.textMuted}
        value={section.text}
        onChangeText={(text) => onUpdate({ ...section, text })}
        multiline
      />
    );
  }

  if (section.type === 'heading') {
    return (
      <View>
        <View style={styles.gutHeadingLevelRow}>
          <Pressable
            style={[styles.gutHeadingLevelBtn, section.level !== 3 && styles.gutHeadingLevelBtnActive]}
            onPress={() => onUpdate({ ...section, level: 2 })}
          >
            <Text style={[styles.gutHeadingLevelText, section.level !== 3 && styles.gutHeadingLevelTextActive]}>H2</Text>
          </Pressable>
          <Pressable
            style={[styles.gutHeadingLevelBtn, section.level === 3 && styles.gutHeadingLevelBtnActive]}
            onPress={() => onUpdate({ ...section, level: 3 })}
          >
            <Text style={[styles.gutHeadingLevelText, section.level === 3 && styles.gutHeadingLevelTextActive]}>H3</Text>
          </Pressable>
        </View>
        <TextInput
          style={[
            section.level === 3 ? styles.gutH3Input : styles.gutH2Input,
            isWeb && styles.inputWeb,
          ]}
          placeholder={section.level === 3 ? 'Alt başlık...' : 'Başlık...'}
          placeholderTextColor={COLORS.textMuted}
          value={section.text}
          onChangeText={(text) => onUpdate({ ...section, text })}
        />
      </View>
    );
  }

  if (section.type === 'image') {
    return (
      <View style={styles.gutImageBlock}>
        {section.url ? (
          <View style={styles.gutImagePreview}>
            <Image source={{ uri: section.url }} style={styles.gutImagePreviewImg} resizeMode="cover" />
          </View>
        ) : (
          <View style={styles.gutImageEmpty}>
            <Text style={styles.gutImageEmptyIcon}>🖼</Text>
            <Text style={styles.gutImageEmptyText}>Görsel URL girin</Text>
            <Text style={styles.gutImageEmptyHint}>Önerilen: 800 × 450 px</Text>
          </View>
        )}
        <TextInput
          style={[styles.input, isWeb && styles.inputWeb, { marginTop: 6 }]}
          placeholder="Görsel URL..."
          placeholderTextColor={COLORS.textMuted}
          value={section.url}
          onChangeText={(url) => onUpdate({ ...section, url })}
          autoCapitalize="none"
        />
        <TextInput
          style={[styles.input, isWeb && styles.inputWeb, { marginTop: 4 }]}
          placeholder="Alt metin (SEO)"
          placeholderTextColor={COLORS.textMuted}
          value={section.alt}
          onChangeText={(alt) => onUpdate({ ...section, alt })}
        />
        <TextInput
          style={[styles.input, isWeb && styles.inputWeb, { marginTop: 4 }]}
          placeholder="Açıklama (opsiyonel)"
          placeholderTextColor={COLORS.textMuted}
          value={section.caption || ''}
          onChangeText={(caption) => onUpdate({ ...section, caption: caption || undefined })}
        />
      </View>
    );
  }

  if (section.type === 'list') {
    return (
      <View>
        <View style={styles.gutHeadingLevelRow}>
          <Pressable
            style={[styles.gutHeadingLevelBtn, !section.ordered && styles.gutHeadingLevelBtnActive]}
            onPress={() => onUpdate({ ...section, ordered: false })}
          >
            <Text style={[styles.gutHeadingLevelText, !section.ordered && styles.gutHeadingLevelTextActive]}>• Madde</Text>
          </Pressable>
          <Pressable
            style={[styles.gutHeadingLevelBtn, section.ordered && styles.gutHeadingLevelBtnActive]}
            onPress={() => onUpdate({ ...section, ordered: true })}
          >
            <Text style={[styles.gutHeadingLevelText, section.ordered && styles.gutHeadingLevelTextActive]}>1. Numaralı</Text>
          </Pressable>
        </View>
        {section.items.map((item, li) => (
          <View key={li} style={styles.gutListRow}>
            <Text style={styles.gutListBullet}>{section.ordered ? `${li + 1}.` : '•'}</Text>
            <TextInput
              style={[styles.gutListInput, isWeb && styles.inputWeb]}
              placeholder={`Madde ${li + 1}`}
              placeholderTextColor={COLORS.textMuted}
              value={item}
              onChangeText={(text) => {
                const items = [...section.items];
                items[li] = text;
                onUpdate({ ...section, items });
              }}
            />
            <Pressable
              style={styles.gutListRemove}
              onPress={() => {
                const items = section.items.filter((_, i) => i !== li);
                if (items.length === 0) items.push('');
                onUpdate({ ...section, items });
              }}
            >
              <Text style={{ color: '#F44336', fontSize: 14 }}>×</Text>
            </Pressable>
          </View>
        ))}
        <Pressable
          style={styles.gutListAddBtn}
          onPress={() => onUpdate({ ...section, items: [...section.items, ''] })}
        >
          <Text style={styles.gutListAddBtnText}>+ Madde Ekle</Text>
        </Pressable>
      </View>
    );
  }

  if (section.type === 'table') {
    return (
      <View>
        <ScrollView horizontal showsHorizontalScrollIndicator={false}>
          <View>
            {section.rows.map((row, ri) => (
              <View key={ri} style={styles.gutTableRow}>
                {row.map((cell, ci) => (
                  <TextInput
                    key={ci}
                    style={[
                      styles.gutTableCell,
                      ri === 0 && styles.gutTableHeaderCell,
                      isWeb && styles.inputWeb,
                    ]}
                    placeholder={ri === 0 ? `Sütun ${ci + 1}` : ''}
                    placeholderTextColor={COLORS.textMuted}
                    value={cell}
                    onChangeText={(text) => {
                      const rows = section.rows.map(r => [...r]);
                      rows[ri][ci] = text;
                      onUpdate({ ...section, rows });
                    }}
                  />
                ))}
                {ri > 0 && (
                  <Pressable
                    style={styles.gutTableRowRemove}
                    onPress={() => {
                      const rows = section.rows.filter((_, i) => i !== ri);
                      onUpdate({ ...section, rows });
                    }}
                  >
                    <Text style={{ color: '#F44336', fontSize: 14 }}>×</Text>
                  </Pressable>
                )}
              </View>
            ))}
          </View>
        </ScrollView>
        <View style={styles.gutTableActions}>
          <Pressable
            style={styles.gutListAddBtn}
            onPress={() => {
              const colCount = section.rows[0]?.length || 2;
              onUpdate({ ...section, rows: [...section.rows, Array(colCount).fill('')] });
            }}
          >
            <Text style={styles.gutListAddBtnText}>+ Satır</Text>
          </Pressable>
          <Pressable
            style={styles.gutListAddBtn}
            onPress={() => {
              const rows = section.rows.map(r => [...r, '']);
              onUpdate({ ...section, rows });
            }}
          >
            <Text style={styles.gutListAddBtnText}>+ Sütun</Text>
          </Pressable>
        </View>
      </View>
    );
  }

  return null;
}

/* SectionEditor removed — replaced by GutenbergBlock above */

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
  // Blog editor field labels
  fieldLabel: { color: COLORS.textSecondary, fontSize: 13, fontWeight: '600', marginTop: SPACING.xs },
  fieldHint: { color: COLORS.textMuted, fontSize: 12 },
  // ── Gutenberg Editor Styles ──
  gutTopBar: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    paddingBottom: SPACING.md, borderBottomWidth: 1, borderBottomColor: COLORS.border, marginBottom: SPACING.md,
  },
  gutBackBtn: { paddingVertical: 6 },
  gutBackBtnText: { color: COLORS.primary, fontSize: 14, fontWeight: '600' },
  gutTopBarRight: { flexDirection: 'row', gap: SPACING.sm },
  gutDraftBtn: {
    borderWidth: 1, borderColor: COLORS.border, borderRadius: RADIUS.md,
    paddingHorizontal: 16, paddingVertical: 8,
  },
  gutDraftBtnText: { color: COLORS.textSecondary, fontSize: 13, fontWeight: '600' },
  gutPublishBtn: {
    backgroundColor: COLORS.primary, borderRadius: RADIUS.md,
    paddingHorizontal: 20, paddingVertical: 8,
  },
  gutPublishBtnText: { color: COLORS.white, fontSize: 13, fontWeight: '700' },
  // Title
  gutTitleInput: {
    fontSize: 28, fontWeight: '800', color: COLORS.text, paddingVertical: SPACING.sm,
    borderWidth: 0, backgroundColor: 'transparent',
  } as any,
  gutSlugPreview: { color: COLORS.textMuted, fontSize: 12, marginBottom: SPACING.md },
  // Featured Image
  gutFeaturedImageArea: {
    marginBottom: SPACING.lg, borderBottomWidth: 1, borderBottomColor: COLORS.border, paddingBottom: SPACING.lg,
  },
  gutFeaturedImageWrap: { borderRadius: RADIUS.xl, overflow: 'hidden', position: 'relative' as any },
  gutFeaturedImageImg: { width: '100%', height: 220, borderRadius: RADIUS.xl },
  gutFeaturedImageOverlay: {
    position: 'absolute' as any, top: 8, right: 8,
  },
  gutFeaturedImageRemoveBtn: {
    width: 32, height: 32, borderRadius: 16, backgroundColor: 'rgba(0,0,0,0.6)',
    alignItems: 'center', justifyContent: 'center',
  },
  gutFeaturedImageRemoveText: { color: '#fff', fontSize: 18, fontWeight: '700' },
  gutFeaturedImageEmpty: {
    borderWidth: 2, borderColor: COLORS.border, borderStyle: 'dashed' as any,
    borderRadius: RADIUS.xl, paddingVertical: 40, alignItems: 'center', justifyContent: 'center',
    backgroundColor: COLORS.surfaceElevated,
  },
  gutFeaturedImageIcon: { fontSize: 36, marginBottom: 8 },
  gutFeaturedImageLabel: { color: COLORS.textSecondary, fontSize: 15, fontWeight: '600' },
  gutFeaturedImageHint: { color: COLORS.textMuted, fontSize: 12, marginTop: 4 },
  // Blocks area
  gutBlocksArea: { minHeight: 200 },
  gutEmptyContent: { paddingVertical: 40, alignItems: 'center' },
  gutEmptyContentText: { color: COLORS.textMuted, fontSize: 14 },
  gutBlockWrapper: {},
  gutBlock: {
    borderRadius: RADIUS.lg, borderWidth: 1, borderColor: 'transparent',
    padding: SPACING.xs,
  },
  gutBlockFocused: {
    borderColor: COLORS.primaryGlowStrong, backgroundColor: 'rgba(200, 134, 10, 0.04)',
  },
  gutBlockToolbar: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    marginBottom: 6, paddingHorizontal: 4,
  },
  gutBlockTypeLabel: { color: COLORS.textMuted, fontSize: 11, fontWeight: '600' },
  gutBlockToolbarActions: { flexDirection: 'row', gap: 4 },
  gutToolbarBtn: {
    width: 26, height: 26, borderRadius: RADIUS.sm, borderWidth: 1, borderColor: COLORS.border,
    alignItems: 'center', justifyContent: 'center', backgroundColor: COLORS.surface,
  },
  gutToolbarBtnDanger: { borderColor: '#6A2A2A' },
  gutToolbarBtnText: { color: COLORS.textSecondary, fontSize: 13, fontWeight: '700' },
  // Add between blocks
  gutAddBetween: {
    flexDirection: 'row', alignItems: 'center', paddingVertical: 4, opacity: 0.5,
  },
  gutAddBetweenLine: { flex: 1, height: 1, backgroundColor: COLORS.border },
  gutAddBtn: {
    width: 24, height: 24, borderRadius: 12, borderWidth: 1, borderColor: COLORS.border,
    alignItems: 'center', justifyContent: 'center', marginHorizontal: 8, backgroundColor: COLORS.surface,
  },
  gutAddBtnActive: { borderColor: COLORS.primary, backgroundColor: 'rgba(200, 134, 10, 0.15)' },
  gutAddBtnText: { color: COLORS.textMuted, fontSize: 16, fontWeight: '600', lineHeight: 18 },
  gutAddBtnTextActive: { color: COLORS.primary },
  // Block type picker
  gutBlockPicker: {
    flexDirection: 'row', flexWrap: 'wrap', gap: 8,
    padding: SPACING.sm, backgroundColor: COLORS.surfaceElevated,
    borderRadius: RADIUS.lg, borderWidth: 1, borderColor: COLORS.border, marginBottom: 4,
  },
  gutBlockPickerItem: {
    flexDirection: 'row', alignItems: 'center', gap: 6,
    paddingHorizontal: 12, paddingVertical: 8, borderRadius: RADIUS.md,
    borderWidth: 1, borderColor: COLORS.border,
  },
  gutBlockPickerItemHover: { borderColor: COLORS.primary, backgroundColor: 'rgba(200, 134, 10, 0.08)' },
  gutBlockPickerIcon: { fontSize: 14 },
  gutBlockPickerLabel: { color: COLORS.textSecondary, fontSize: 13, fontWeight: '600' },
  // Paragraph block
  gutParagraphInput: {
    color: COLORS.text, fontSize: 15, lineHeight: 24, minHeight: 60,
    backgroundColor: 'transparent', borderWidth: 0, textAlignVertical: 'top',
    paddingHorizontal: 4, paddingVertical: 4,
  } as any,
  // Heading block
  gutHeadingLevelRow: { flexDirection: 'row', gap: 6, marginBottom: 4 },
  gutHeadingLevelBtn: {
    borderRadius: RADIUS.sm, borderWidth: 1, borderColor: COLORS.border,
    paddingHorizontal: 10, paddingVertical: 3,
  },
  gutHeadingLevelBtnActive: { borderColor: COLORS.primary, backgroundColor: 'rgba(200, 134, 10, 0.15)' },
  gutHeadingLevelText: { color: COLORS.textMuted, fontSize: 12, fontWeight: '700' },
  gutHeadingLevelTextActive: { color: COLORS.primaryLight },
  gutH2Input: {
    fontSize: 22, fontWeight: '700', color: COLORS.text,
    backgroundColor: 'transparent', borderWidth: 0, paddingHorizontal: 4, paddingVertical: 4,
  } as any,
  gutH3Input: {
    fontSize: 18, fontWeight: '700', color: COLORS.text,
    backgroundColor: 'transparent', borderWidth: 0, paddingHorizontal: 4, paddingVertical: 4,
  } as any,
  // Image block
  gutImageBlock: {},
  gutImagePreview: { borderRadius: RADIUS.lg, overflow: 'hidden' },
  gutImagePreviewImg: { width: '100%', height: 180, borderRadius: RADIUS.lg },
  gutImageEmpty: {
    borderWidth: 2, borderColor: COLORS.border, borderStyle: 'dashed' as any,
    borderRadius: RADIUS.lg, paddingVertical: 24, alignItems: 'center',
    backgroundColor: COLORS.surfaceElevated,
  },
  gutImageEmptyIcon: { fontSize: 28, marginBottom: 4 },
  gutImageEmptyText: { color: COLORS.textSecondary, fontSize: 13, fontWeight: '600' },
  gutImageEmptyHint: { color: COLORS.textMuted, fontSize: 11, marginTop: 2 },
  // List block
  gutListRow: { flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 2 },
  gutListBullet: { color: COLORS.primary, fontSize: 14, fontWeight: '700', width: 20 },
  gutListInput: {
    flex: 1, color: COLORS.text, fontSize: 15, backgroundColor: 'transparent',
    borderWidth: 0, paddingVertical: 4, paddingHorizontal: 2,
  } as any,
  gutListRemove: { width: 24, height: 24, alignItems: 'center', justifyContent: 'center' },
  gutListAddBtn: {
    borderRadius: RADIUS.md, borderWidth: 1, borderColor: COLORS.border, borderStyle: 'dashed' as any,
    alignItems: 'center', paddingVertical: 6, marginTop: 4,
  },
  gutListAddBtnText: { color: COLORS.textMuted, fontSize: 12, fontWeight: '600' },
  // Table block
  gutTableRow: { flexDirection: 'row', gap: 2, marginBottom: 2 },
  gutTableCell: {
    flex: 1, minWidth: 80, color: COLORS.text, fontSize: 13,
    backgroundColor: COLORS.surfaceElevated, borderRadius: RADIUS.sm,
    borderWidth: 1, borderColor: COLORS.border,
    paddingHorizontal: 8, paddingVertical: 6,
  },
  gutTableHeaderCell: { fontWeight: '700', backgroundColor: 'rgba(200, 134, 10, 0.08)' },
  gutTableRowRemove: { width: 24, height: 24, alignItems: 'center', justifyContent: 'center' },
  gutTableActions: { flexDirection: 'row', gap: SPACING.xs, marginTop: 4 },
  // Meta panel
  gutMetaToggle: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    borderTopWidth: 1, borderTopColor: COLORS.border, paddingTop: SPACING.md, marginTop: SPACING.lg,
    paddingVertical: SPACING.sm,
  },
  gutMetaToggleText: { color: COLORS.textSecondary, fontSize: 14, fontWeight: '600' },
  gutMetaToggleArrow: { color: COLORS.textMuted, fontSize: 12 },
  gutMetaPanel: { gap: SPACING.xs, paddingTop: SPACING.sm },
});
