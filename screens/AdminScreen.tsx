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

/* ─── Blog Editor Component ─── */
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
  const [showSectionPicker, setShowSectionPicker] = useState(false);

  return (
    <View style={styles.formCard}>
      <Text style={styles.sectionTitle}>{post.slug ? 'Yazıyı Düzenle' : 'Yeni Yazı'}</Text>

      {/* Title */}
      <Text style={styles.fieldLabel}>Başlık</Text>
      <TextInput
        style={[styles.input, isWeb && styles.inputWeb]}
        placeholder="Blog yazısı başlığı"
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
      <Text style={styles.fieldHint}>halidene.com/blog/{post.slug || '...'}</Text>

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

      {/* Featured Image */}
      <Text style={styles.fieldLabel}>Ana Görsel</Text>
      <TextInput
        style={[styles.input, isWeb && styles.inputWeb]}
        placeholder="Görsel URL"
        placeholderTextColor={COLORS.textMuted}
        value={post.featuredImage || ''}
        onChangeText={(featuredImage) => onUpdate({ featuredImage: featuredImage || undefined })}
        autoCapitalize="none"
      />
      <TextInput
        style={[styles.input, isWeb && styles.inputWeb]}
        placeholder="Görsel alt metni (SEO)"
        placeholderTextColor={COLORS.textMuted}
        value={post.featuredImageAlt || ''}
        onChangeText={(featuredImageAlt) => onUpdate({ featuredImageAlt: featuredImageAlt || undefined })}
      />
      {post.featuredImage ? (
        <View style={styles.imagePreview}>
          <Image source={{ uri: post.featuredImage }} style={styles.imagePreviewImg} resizeMode="cover" />
        </View>
      ) : null}

      {/* Date */}
      <Text style={styles.fieldLabel}>Tarih</Text>
      <TextInput
        style={[styles.input, isWeb && styles.inputWeb]}
        placeholder="YYYY-MM-DD"
        placeholderTextColor={COLORS.textMuted}
        value={post.date}
        onChangeText={(date) => onUpdate({ date })}
      />

      {/* Sections */}
      <View style={styles.sectionsDivider}>
        <Text style={styles.sectionTitle}>İçerik Bölümleri</Text>
      </View>

      {post.sections.map((section, index) => (
        <SectionEditor
          key={index}
          section={section}
          index={index}
          total={post.sections.length}
          onUpdate={(s) => onUpdateSection(index, s)}
          onRemove={() => onRemoveSection(index)}
          onMove={(dir) => onMoveSection(index, dir)}
        />
      ))}

      {/* Add section */}
      {showSectionPicker ? (
        <View style={styles.sectionPickerRow}>
          {([
            ['paragraph', 'Paragraf'],
            ['heading', 'Başlık'],
            ['image', 'Görsel'],
            ['list', 'Liste'],
            ['table', 'Tablo'],
          ] as [BlogSection['type'], string][]).map(([type, label]) => (
            <Pressable
              key={type}
              style={styles.sectionPickerBtn}
              onPress={() => { onAddSection(type); setShowSectionPicker(false); }}
            >
              <Text style={styles.sectionPickerBtnText}>{label}</Text>
            </Pressable>
          ))}
          <Pressable style={[styles.sectionPickerBtn, { borderColor: COLORS.textMuted }]} onPress={() => setShowSectionPicker(false)}>
            <Text style={[styles.sectionPickerBtnText, { color: COLORS.textMuted }]}>İptal</Text>
          </Pressable>
        </View>
      ) : (
        <Pressable style={styles.addSectionBtn} onPress={() => setShowSectionPicker(true)}>
          <Text style={styles.addSectionBtnText}>+ Bölüm Ekle</Text>
        </Pressable>
      )}

      {/* Action buttons */}
      <View style={[styles.editorActions, isCompactWeb && styles.compactStack]}>
        <Pressable style={styles.primaryBtn} onPress={() => onSave(true)}>
          <Text style={styles.primaryBtnText}>Yayınla</Text>
        </Pressable>
        <Pressable style={[styles.inlineBtn, { paddingVertical: 12 }]} onPress={() => onSave(false)}>
          <Text style={styles.inlineBtnText}>Taslak Kaydet</Text>
        </Pressable>
        <Pressable style={[styles.inlineBtn, styles.deleteBtn, { paddingVertical: 12 }]} onPress={onCancel}>
          <Text style={styles.inlineBtnText}>İptal</Text>
        </Pressable>
      </View>
    </View>
  );
}

/* ─── Section Editor Component ─── */
function SectionEditor({ section, index, total, onUpdate, onRemove, onMove }: {
  section: BlogSection;
  index: number;
  total: number;
  onUpdate: (section: BlogSection) => void;
  onRemove: () => void;
  onMove: (direction: -1 | 1) => void;
}) {
  const typeLabels: Record<string, string> = {
    paragraph: 'Paragraf',
    heading: 'Başlık',
    image: 'Görsel',
    list: 'Liste',
    table: 'Tablo',
  };

  return (
    <View style={styles.sectionEditorCard}>
      <View style={styles.sectionEditorHeader}>
        <Text style={styles.sectionEditorType}>{typeLabels[section.type] || section.type}</Text>
        <View style={styles.sectionEditorActions}>
          {index > 0 && (
            <Pressable onPress={() => onMove(-1)} style={styles.sectionMoveBtn}>
              <Text style={styles.sectionMoveBtnText}>↑</Text>
            </Pressable>
          )}
          {index < total - 1 && (
            <Pressable onPress={() => onMove(1)} style={styles.sectionMoveBtn}>
              <Text style={styles.sectionMoveBtnText}>↓</Text>
            </Pressable>
          )}
          <Pressable onPress={onRemove} style={[styles.sectionMoveBtn, { borderColor: '#6A2A2A' }]}>
            <Text style={[styles.sectionMoveBtnText, { color: '#F44336' }]}>×</Text>
          </Pressable>
        </View>
      </View>

      {section.type === 'paragraph' && (
        <TextInput
          style={[styles.input, styles.textArea, isWeb && styles.inputWeb]}
          placeholder="Paragraf metni... **kalın** ve [link](url) desteklenir"
          placeholderTextColor={COLORS.textMuted}
          value={section.text}
          onChangeText={(text) => onUpdate({ ...section, text })}
          multiline
          numberOfLines={4}
        />
      )}

      {section.type === 'heading' && (
        <>
          <View style={styles.headingLevelRow}>
            <Pressable
              style={[styles.headingLevelBtn, section.level !== 3 && styles.headingLevelBtnActive]}
              onPress={() => onUpdate({ ...section, level: 2 })}
            >
              <Text style={[styles.headingLevelBtnText, section.level !== 3 && styles.headingLevelBtnTextActive]}>H2</Text>
            </Pressable>
            <Pressable
              style={[styles.headingLevelBtn, section.level === 3 && styles.headingLevelBtnActive]}
              onPress={() => onUpdate({ ...section, level: 3 })}
            >
              <Text style={[styles.headingLevelBtnText, section.level === 3 && styles.headingLevelBtnTextActive]}>H3</Text>
            </Pressable>
          </View>
          <TextInput
            style={[styles.input, isWeb && styles.inputWeb]}
            placeholder="Başlık metni"
            placeholderTextColor={COLORS.textMuted}
            value={section.text}
            onChangeText={(text) => onUpdate({ ...section, text })}
          />
        </>
      )}

      {section.type === 'image' && (
        <>
          <TextInput
            style={[styles.input, isWeb && styles.inputWeb]}
            placeholder="Görsel URL"
            placeholderTextColor={COLORS.textMuted}
            value={section.url}
            onChangeText={(url) => onUpdate({ ...section, url })}
            autoCapitalize="none"
          />
          <TextInput
            style={[styles.input, isWeb && styles.inputWeb]}
            placeholder="Alt metin (SEO için önemli)"
            placeholderTextColor={COLORS.textMuted}
            value={section.alt}
            onChangeText={(alt) => onUpdate({ ...section, alt })}
          />
          <TextInput
            style={[styles.input, isWeb && styles.inputWeb]}
            placeholder="Açıklama (opsiyonel)"
            placeholderTextColor={COLORS.textMuted}
            value={section.caption || ''}
            onChangeText={(caption) => onUpdate({ ...section, caption: caption || undefined })}
          />
          {section.url ? (
            <View style={styles.imagePreview}>
              <Image source={{ uri: section.url }} style={styles.imagePreviewImg} resizeMode="cover" />
            </View>
          ) : null}
        </>
      )}

      {section.type === 'list' && (
        <>
          <View style={styles.headingLevelRow}>
            <Pressable
              style={[styles.headingLevelBtn, !section.ordered && styles.headingLevelBtnActive]}
              onPress={() => onUpdate({ ...section, ordered: false })}
            >
              <Text style={[styles.headingLevelBtnText, !section.ordered && styles.headingLevelBtnTextActive]}>Madde</Text>
            </Pressable>
            <Pressable
              style={[styles.headingLevelBtn, section.ordered && styles.headingLevelBtnActive]}
              onPress={() => onUpdate({ ...section, ordered: true })}
            >
              <Text style={[styles.headingLevelBtnText, section.ordered && styles.headingLevelBtnTextActive]}>Numaralı</Text>
            </Pressable>
          </View>
          {section.items.map((item, li) => (
            <View key={li} style={styles.listEditorRow}>
              <Text style={styles.listEditorBullet}>{section.ordered ? `${li + 1}.` : '•'}</Text>
              <TextInput
                style={[styles.input, { flex: 1 }, isWeb && styles.inputWeb]}
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
                style={styles.listEditorRemove}
                onPress={() => {
                  const items = section.items.filter((_, i) => i !== li);
                  if (items.length === 0) items.push('');
                  onUpdate({ ...section, items });
                }}
              >
                <Text style={{ color: '#F44336', fontSize: 16, fontWeight: '700' }}>×</Text>
              </Pressable>
            </View>
          ))}
          <Pressable
            style={styles.addListItemBtn}
            onPress={() => onUpdate({ ...section, items: [...section.items, ''] })}
          >
            <Text style={styles.addListItemBtnText}>+ Madde Ekle</Text>
          </Pressable>
        </>
      )}

      {section.type === 'table' && (
        <>
          {section.rows.map((row, ri) => (
            <View key={ri} style={styles.tableEditorRow}>
              <Text style={styles.tableEditorRowLabel}>{ri === 0 ? 'Başlık' : `Satır ${ri}`}</Text>
              {row.map((cell, ci) => (
                <TextInput
                  key={ci}
                  style={[styles.input, { flex: 1, minWidth: 80 }, isWeb && styles.inputWeb]}
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
                  style={styles.listEditorRemove}
                  onPress={() => {
                    const rows = section.rows.filter((_, i) => i !== ri);
                    onUpdate({ ...section, rows });
                  }}
                >
                  <Text style={{ color: '#F44336', fontSize: 16, fontWeight: '700' }}>×</Text>
                </Pressable>
              )}
            </View>
          ))}
          <View style={styles.tableEditorActions}>
            <Pressable
              style={styles.addListItemBtn}
              onPress={() => {
                const colCount = section.rows[0]?.length || 2;
                onUpdate({ ...section, rows: [...section.rows, Array(colCount).fill('')] });
              }}
            >
              <Text style={styles.addListItemBtnText}>+ Satır Ekle</Text>
            </Pressable>
            <Pressable
              style={styles.addListItemBtn}
              onPress={() => {
                const rows = section.rows.map(r => [...r, '']);
                onUpdate({ ...section, rows });
              }}
            >
              <Text style={styles.addListItemBtnText}>+ Sütun Ekle</Text>
            </Pressable>
          </View>
        </>
      )}
    </View>
  );
}

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
  // Blog editor
  fieldLabel: { color: COLORS.textSecondary, fontSize: 13, fontWeight: '600', marginTop: SPACING.xs },
  fieldHint: { color: COLORS.textMuted, fontSize: 12 },
  imagePreview: { borderRadius: RADIUS.md, overflow: 'hidden', marginTop: 4 },
  imagePreviewImg: { width: '100%', height: 160, borderRadius: RADIUS.md },
  sectionsDivider: { borderTopWidth: 1, borderTopColor: COLORS.border, paddingTop: SPACING.md, marginTop: SPACING.sm },
  // Section editor
  sectionEditorCard: {
    borderWidth: 1, borderColor: COLORS.border, borderRadius: RADIUS.lg,
    padding: SPACING.sm, backgroundColor: COLORS.surfaceElevated, gap: SPACING.xs,
  },
  sectionEditorHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  sectionEditorType: { color: COLORS.primary, fontSize: 12, fontWeight: '700', textTransform: 'uppercase' },
  sectionEditorActions: { flexDirection: 'row', gap: 4 },
  sectionMoveBtn: {
    width: 28, height: 28, borderRadius: RADIUS.sm, borderWidth: 1, borderColor: COLORS.border,
    alignItems: 'center', justifyContent: 'center',
  },
  sectionMoveBtnText: { color: COLORS.textSecondary, fontSize: 16, fontWeight: '700' },
  headingLevelRow: { flexDirection: 'row', gap: SPACING.xs },
  headingLevelBtn: {
    borderRadius: RADIUS.sm, borderWidth: 1, borderColor: COLORS.border,
    paddingHorizontal: 12, paddingVertical: 4,
  },
  headingLevelBtnActive: { borderColor: COLORS.primary, backgroundColor: 'rgba(200, 134, 10, 0.15)' },
  headingLevelBtnText: { color: COLORS.textMuted, fontSize: 12, fontWeight: '700' },
  headingLevelBtnTextActive: { color: COLORS.primaryLight },
  // List editor
  listEditorRow: { flexDirection: 'row', alignItems: 'center', gap: SPACING.xs },
  listEditorBullet: { color: COLORS.primary, fontSize: 14, fontWeight: '700', width: 20 },
  listEditorRemove: { width: 28, height: 28, alignItems: 'center', justifyContent: 'center' },
  addListItemBtn: {
    borderRadius: RADIUS.md, borderWidth: 1, borderColor: COLORS.border, borderStyle: 'dashed' as any,
    alignItems: 'center', paddingVertical: SPACING.xs,
  },
  addListItemBtnText: { color: COLORS.textMuted, fontSize: 12, fontWeight: '600' },
  // Table editor
  tableEditorRow: { flexDirection: 'row', alignItems: 'center', gap: SPACING.xs },
  tableEditorRowLabel: { color: COLORS.textMuted, fontSize: 11, width: 40 },
  tableEditorActions: { flexDirection: 'row', gap: SPACING.xs },
  // Section picker
  sectionPickerRow: { flexDirection: 'row', flexWrap: 'wrap', gap: SPACING.xs },
  sectionPickerBtn: {
    borderRadius: RADIUS.md, borderWidth: 1, borderColor: COLORS.primary,
    paddingHorizontal: 14, paddingVertical: 8,
  },
  sectionPickerBtnText: { color: COLORS.primary, fontSize: 13, fontWeight: '600' },
  addSectionBtn: {
    borderRadius: RADIUS.md, borderWidth: 1, borderColor: COLORS.border, borderStyle: 'dashed' as any,
    alignItems: 'center', paddingVertical: SPACING.sm,
  },
  addSectionBtnText: { color: COLORS.textMuted, fontSize: 13, fontWeight: '600' },
  // Editor actions
  editorActions: { flexDirection: 'row', gap: SPACING.sm, marginTop: SPACING.sm },
});
