import React, { useRef, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  Pressable,
  ScrollView,
  Alert,
  StatusBar,
  Platform,
  ActivityIndicator,
  Image,
  Linking,
  useWindowDimensions,
} from 'react-native';
import { COLORS, SPACING, RADIUS } from '../constants/theme';
import { useAuth } from '../contexts/AuthContext';
import { getCarpetThumbnailUrl } from '../services/carpet-image';
import BRAND_CATALOG from '../data/landing-catalog.json';

const isWeb = Platform.OS === 'web';

const WHATSAPP_NUMBER = '905300947756';
const WHATSAPP_MESSAGE = encodeURIComponent('Merhaba, Halı Dene hakkında bilgi almak istiyorum.');

const CATALOG_BRANDS = Object.keys(BRAND_CATALOG);

const DEMO_CARPET = {
  thumbPath: 'carpets-thumbs/Atlas/Beykoz/ZY01A.webp',
  imagePath: 'carpets/Atlas/Beykoz/ZY01A.png',
  brand: 'Atlas',
  collection: 'Beykoz',
  model: 'ZY01A',
};


interface LoginScreenProps {
  navigation: any;
}

/* ─── Feature Icon (from HomeScreen pattern) ─── */
const FeatureIcon = ({ type }: { type: 'target' | 'speed' | 'check' }) => {
  if (type === 'target') {
    return (
      <View style={s.iconBase}>
        <View style={s.iconTargetOuter} />
        <View style={s.iconTargetInner} />
        <View style={s.iconTargetDot} />
      </View>
    );
  }
  if (type === 'speed') {
    return (
      <View style={s.iconBase}>
        <View style={s.iconBolt} />
        <View style={s.iconBoltTail} />
      </View>
    );
  }
  return (
    <View style={s.iconBase}>
      <View style={s.iconCheckCircle} />
      <View style={s.iconCheckStem} />
      <View style={s.iconCheckArm} />
    </View>
  );
};

export default function LoginScreen({ navigation }: LoginScreenProps) {
  const { signIn } = useAuth();
  const { width: viewportWidth } = useWindowDimensions();
  const isWide = isWeb && viewportWidth >= 900;

  const passwordInputRef = useRef<TextInput>(null);
  const scrollViewRef = useRef<ScrollView>(null);
  const loginSectionY = useRef(0);

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [focused, setFocused] = useState<'email' | 'password' | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [fullscreenImage, setFullscreenImage] = useState<string | null>(null);
  const [selectedBrand, setSelectedBrand] = useState('Atlas');

  const handleLogin = async () => {
    if (submitting) return;
    const e = email.trim();
    const p = password.trim();
    if (!e || !p) {
      Alert.alert('Eksik Bilgi', 'Lütfen kullanıcı adı/e-posta ve şifre girin.');
      return;
    }
    try {
      setSubmitting(true);
      const result = await signIn(e, p);
      if (!result.ok) {
        Alert.alert('Giriş başarısız', result.message);
        return;
      }
      navigation.reset({ index: 0, routes: [{ name: 'Home' }] });
    } finally {
      setSubmitting(false);
    }
  };

  const scrollToLogin = () => {
    scrollViewRef.current?.scrollTo({ y: loginSectionY.current, animated: true });
  };

  const openWhatsApp = () => {
    Linking.openURL(`https://wa.me/${WHATSAPP_NUMBER}?text=${WHATSAPP_MESSAGE}`);
  };

  const showcaseCols = isWide ? 4 : 3;
  const showcaseItemWidth = `${(100 / showcaseCols) - 2}%` as any;

  /* ────────────────── HERO ────────────────── */
  const renderHero = () => (
    <View style={s.heroSection}>
      <View style={s.brandRow}>
        <Text style={s.logo}>HALI</Text>
        <View style={s.logoBadge}>
          <Text style={s.logoBadgeText}>DENE</Text>
        </View>
      </View>
      <Text style={[s.heroTitle, isWide && s.heroTitleWide]}>
        Müşterilerinize Halıları{'\n'}Evlerinde Gösterin
      </Text>
      <Text style={s.heroSubtitle}>
        Yapay zeka ile halılarınızı müşterinizin odasına yerleştirin.
      </Text>
      <View style={s.heroCTAWrap}>
        <Pressable
          style={({ hovered }: any) => [s.heroPrimaryBtn, hovered && s.heroPrimaryBtnHover]}
          onPress={scrollToLogin}
        >
          <Text style={s.heroPrimaryBtnText}>Giriş Yap</Text>
        </Pressable>
      </View>
    </View>
  );

  /* ────────────────── BEFORE / AFTER SHOWCASE ────────────────── */
  const demoCarpetUrl = getCarpetThumbnailUrl(DEMO_CARPET.imagePath, DEMO_CARPET.thumbPath);
  const beforeImageUri = isWeb ? '/demo-before.jpg' : undefined;
  const afterImageUri = isWeb ? '/demo-after.jpg' : undefined;

  const renderBeforeAfter = () => (
    <View style={s.section}>
      <View style={s.baContainer}>
        {/* ─ Before ─ */}
        <View style={s.baColumn}>
          <Pressable style={s.baCard} onPress={() => beforeImageUri && setFullscreenImage(beforeImageUri)}>
            {beforeImageUri ? (
              <Image source={{ uri: beforeImageUri }} style={s.baImage} resizeMode="cover" />
            ) : (
              <View style={[s.baImage, s.baPlaceholder]} />
            )}
          </Pressable>
          <Text style={s.baLabel}>Oda</Text>
        </View>

        {/* ─ Center: carpet badge ─ */}
        <View style={s.baCenter}>
          <View style={[s.baCarpetWrap, !isWide && s.baCarpetWrapMobile]}>
            <Image source={{ uri: demoCarpetUrl }} style={s.baCarpetThumb} resizeMode="cover" />
            <View style={s.baCarpetCheck}>
              <View style={s.baCarpetCheckInner} />
            </View>
          </View>
          <Text style={s.baCarpetModel}>{DEMO_CARPET.model}</Text>
        </View>

        {/* ─ After ─ */}
        <View style={s.baColumn}>
          <Pressable style={s.baCard} onPress={() => afterImageUri && setFullscreenImage(afterImageUri)}>
            {afterImageUri ? (
              <Image source={{ uri: afterImageUri }} style={s.baImage} resizeMode="cover" />
            ) : (
              <View style={[s.baImage, s.baPlaceholder]} />
            )}
            {/* ─ Sparkle badge ─ */}
            <View style={s.baSparkleBadge}>
              <Text style={s.baSparkleText}>{'✦'}</Text>
            </View>
          </Pressable>
          <Text style={s.baLabel}>Sonuç</Text>
        </View>
      </View>
    </View>
  );

  /* ────────────────── ÖZELLİKLER ────────────────── */
  const renderFeatures = () => {
    const features = [
      { icon: 'target' as const, title: 'Gerçekçi Sonuçlar', desc: 'Perspektif ve ışık uyumlu' },
      { icon: 'speed' as const, title: 'Anında Sonuç', desc: '20-30 saniyede hazır görüntü' },
      { icon: 'check' as const, title: 'Geniş Katalog', desc: '2000+ halı modeli, 9 marka' },
    ];
    return (
      <View style={s.section}>
        <View style={[s.featuresGrid, !isWide && s.featuresGridMobile]}>
          {features.map((f) => (
            <View key={f.title} style={[s.featureCard, !isWide && s.featureCardMobile]}>
              <View style={s.featureIconWrap}>
                <FeatureIcon type={f.icon} />
              </View>
              <Text style={s.featureTitle}>{f.title}</Text>
              <Text style={s.featureDesc}>{f.desc}</Text>
            </View>
          ))}
        </View>
      </View>
    );
  };

  /* ────────────────── HALI KATALOĞU ────────────────── */
  const catalogCarpets = (BRAND_CATALOG as Record<string, { thumbPath: string; imagePath: string }[]>)[selectedBrand] || [];

  const renderCatalog = () => (
    <View style={s.section}>
      <Text style={[s.sectionTitle, isWide && s.sectionTitleWide]}>2000+ Halı Kataloğu</Text>
      <Text style={s.sectionSubtitle}>Markaları keşfedin</Text>

      {/* ─ Brand Tabs ─ */}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={s.brandTabsRow}
        style={s.brandTabsScroll}
      >
        {CATALOG_BRANDS.map((brand) => (
          <Pressable
            key={brand}
            style={[s.brandTab, selectedBrand === brand && s.brandTabActive]}
            onPress={() => setSelectedBrand(brand)}
          >
            <Text style={[s.brandTabText, selectedBrand === brand && s.brandTabTextActive]}>{brand}</Text>
          </Pressable>
        ))}
      </ScrollView>

      {/* ─ Carpet Grid ─ */}
      <View style={s.showcaseGrid}>
        {catalogCarpets.map((carpet, i) => (
          <View key={`${selectedBrand}-${i}`} style={[s.showcaseItem, { width: showcaseItemWidth }]}>
            <Image
              source={{ uri: getCarpetThumbnailUrl(carpet.imagePath, carpet.thumbPath) }}
              style={s.showcaseImage}
              resizeMode="cover"
            />
          </View>
        ))}
      </View>
    </View>
  );

  /* ────────────────── İLETİŞİM CTA ────────────────── */
  const renderContactCTA = () => (
    <View style={s.section}>
      <View style={s.contactCard}>
        <Text style={[s.sectionTitle, isWide && s.sectionTitleWide]}>Bilgi Almak İster Misiniz?</Text>
        <Text style={s.contactDesc}>
          Halı Dene'yi mağazanızda kullanmak, demo almak veya fiyat bilgisi için bize ulaşın.
        </Text>
        <View style={[s.contactBtnRow, !isWide && s.contactBtnRowMobile]}>
          <Pressable
            style={({ hovered }: any) => [s.whatsappBtn, hovered && s.whatsappBtnHover]}
            onPress={openWhatsApp}
          >
            <Text style={s.whatsappBtnText}>WhatsApp ile Ulaşın</Text>
          </Pressable>
          <Pressable
            style={({ hovered }: any) => [s.contactGhostBtn, hovered && s.contactGhostBtnHover]}
            onPress={() => navigation.navigate('Contact')}
          >
            <Text style={s.contactGhostBtnText}>İletişim Formu →</Text>
          </Pressable>
        </View>
        <Text style={s.contactPhone}>0530 094 77 56</Text>
      </View>
    </View>
  );

  /* ────────────────── GİRİŞ FORMU ────────────────── */
  const renderLoginForm = () => (
    <View
      style={s.section}
      onLayout={(e) => { loginSectionY.current = e.nativeEvent.layout.y; }}
    >
      <View style={s.divider} />
      <Text style={[s.sectionTitle, isWide && s.sectionTitleWide]}>Giriş Yap</Text>
      <Text style={s.sectionSubtitle}>Hesabınız varsa giriş yapın</Text>
      <View style={s.formCard}>
        <View style={[s.inputWrap, focused === 'email' && s.inputWrapFocused]}>
          <TextInput
            style={[s.input, isWeb && s.inputWeb]}
            placeholder="Kullanıcı adı veya e-posta"
            placeholderTextColor={COLORS.textMuted}
            autoCapitalize="none"
            autoCorrect={false}
            value={email}
            onChangeText={setEmail}
            onFocus={() => setFocused('email')}
            onBlur={() => setFocused(null)}
            returnKeyType="next"
            onSubmitEditing={() => passwordInputRef.current?.focus()}
          />
        </View>
        <View style={[s.inputWrap, focused === 'password' && s.inputWrapFocused]}>
          <TextInput
            ref={passwordInputRef}
            style={[s.input, isWeb && s.inputWeb]}
            placeholder="Şifre"
            placeholderTextColor={COLORS.textMuted}
            secureTextEntry
            value={password}
            onChangeText={setPassword}
            onFocus={() => setFocused('password')}
            onBlur={() => setFocused(null)}
            returnKeyType="go"
            onSubmitEditing={handleLogin}
          />
        </View>
        <Pressable
          style={({ hovered }: any) => [
            s.loginBtn,
            hovered && s.loginBtnHover,
            submitting && s.loginBtnDisabled,
          ]}
          onPress={handleLogin}
          disabled={submitting}
        >
          {submitting ? (
            <View style={s.loginBtnContent}>
              <ActivityIndicator size="small" color={COLORS.white} />
              <Text style={s.loginBtnText}>Giriş yapılıyor...</Text>
            </View>
          ) : (
            <View style={s.loginBtnContent}>
              <Text style={s.loginBtnText}>Giriş Yap</Text>
            </View>
          )}
        </Pressable>
      </View>
    </View>
  );

  /* ────────────────── FOOTER ────────────────── */
  const renderFooter = () => (
    <View style={s.footer}>
      <View style={s.footerBrand}>
        <Text style={s.footerLogo}>HALI</Text>
        <View style={s.footerBadge}>
          <Text style={s.footerBadgeText}>DENE</Text>
        </View>
      </View>
      <Text style={s.footerText}>Yapay zeka destekli halı deneme platformu</Text>
      <Text style={s.footerCopy}>halidene.com</Text>
    </View>
  );

  /* ────────────────── MAIN RENDER ────────────────── */
  return (
    <View style={[s.container, isWeb && ({ height: '100dvh', maxHeight: '100dvh' } as any)]}>
      <StatusBar barStyle="light-content" backgroundColor={COLORS.background} />

      <View pointerEvents="none" style={s.glowTop} />
      <View pointerEvents="none" style={s.glowBottom} />
      <ScrollView
        ref={scrollViewRef}
        style={[s.scroll, isWeb && ({ overflowY: 'auto' } as any)]}
        contentContainerStyle={[s.scrollContent, isWide ? s.scrollContentWide : s.scrollContentMobile]}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        <View style={[s.content, isWide && s.contentWide]}>
          {renderHero()}
          {renderBeforeAfter()}
          {renderFeatures()}
          {renderContactCTA()}
          {renderCatalog()}
          {renderLoginForm()}
          {renderFooter()}
        </View>
      </ScrollView>

      {/* ─── Fullscreen Image Overlay ─── */}
      {fullscreenImage && (
        <Pressable
          style={[s.fsOverlay, isWeb && ({ position: 'fixed', inset: 0, zIndex: 9999, cursor: 'zoom-out', touchAction: 'none' } as any)]}
          onPress={() => setFullscreenImage(null)}
        >
          {isWeb ? (
            React.createElement('img', {
              src: fullscreenImage,
              style: {
                width: '100%',
                height: '100%',
                objectFit: 'contain',
                touchAction: 'pinch-zoom',
              },
              onClick: (e: any) => e.stopPropagation(),
            })
          ) : (
            <Image source={{ uri: fullscreenImage }} style={s.fsImage} resizeMode="contain" />
          )}
          <Pressable style={s.fsCloseBtn} onPress={() => setFullscreenImage(null)}>
            <Text style={s.fsCloseBtnText}>✕</Text>
          </Pressable>
        </Pressable>
      )}
    </View>
  );
}

/* ━━━━━━━━━━━━━━━━ STYLES ━━━━━━━━━━━━━━━━ */
const s = StyleSheet.create({
  /* ─── Layout ─── */
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  scroll: { flex: 1 },
  scrollContent: {
    paddingHorizontal: SPACING.md,
    paddingBottom: SPACING.xxl,
  },
  scrollContentWide: {
    paddingHorizontal: SPACING.xl,
    paddingTop: SPACING.xxl,
  },
  scrollContentMobile: {
    paddingTop: SPACING.lg + SPACING.md,
  },
  content: {
    width: '100%',
    maxWidth: 940,
    alignSelf: 'center',
  },
  contentWide: {
    maxWidth: 940,
  },

  /* ─── Glow decorations ─── */
  glowTop: {
    position: 'absolute',
    top: -120,
    left: -120,
    width: 320,
    height: 320,
    borderRadius: 180,
    backgroundColor: 'rgba(200, 134, 10, 0.08)',
  },
  glowBottom: {
    position: 'absolute',
    bottom: -150,
    right: 0,
    width: 240,
    height: 340,
    borderRadius: 190,
    backgroundColor: 'rgba(200, 134, 10, 0.06)',
  },

  /* ─── Section ─── */
  section: {
    marginBottom: SPACING.xl,
    width: '100%',
  },
  sectionTitle: {
    color: COLORS.text,
    fontSize: 22,
    fontWeight: '800',
    textAlign: 'center',
    marginBottom: SPACING.xs,
  },
  sectionTitleWide: {
    fontSize: 28,
  },
  sectionSubtitle: {
    color: COLORS.textSecondary,
    fontSize: 14,
    textAlign: 'center',
    marginBottom: SPACING.md,
  },
  divider: {
    height: 1,
    backgroundColor: COLORS.border,
    marginBottom: SPACING.xl,
    width: '60%',
    alignSelf: 'center',
  },

  /* ─── Hero ─── */
  heroSection: {
    alignItems: 'center',
    marginBottom: SPACING.xl + SPACING.md,
    paddingTop: SPACING.sm,
  },
  brandRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: SPACING.sm,
  },
  logo: {
    fontSize: 32,
    fontWeight: '800',
    color: COLORS.text,
    letterSpacing: 0.8,
  },
  logoBadge: {
    marginLeft: 8,
    backgroundColor: 'rgba(200, 134, 10, 0.16)',
    borderWidth: 1,
    borderColor: 'rgba(200, 134, 10, 0.45)',
    borderRadius: 8,
    paddingHorizontal: 8,
    paddingVertical: 2,
  },
  logoBadgeText: {
    fontSize: 11,
    fontWeight: '800',
    color: COLORS.primaryLight,
    letterSpacing: 0.5,
    textTransform: 'uppercase',
  },
  heroTitle: {
    color: COLORS.text,
    fontSize: 28,
    fontWeight: '800',
    textAlign: 'center',
    lineHeight: 36,
  },
  heroTitleWide: {
    fontSize: 42,
    lineHeight: 52,
  },
  heroSubtitle: {
    color: COLORS.textSecondary,
    fontSize: 15,
    textAlign: 'center',
    marginTop: SPACING.sm,
    lineHeight: 22,
  },
  heroCTAWrap: {
    marginTop: SPACING.lg,
    alignItems: 'center',
  },
  heroPrimaryBtn: {
    backgroundColor: COLORS.primary,
    borderRadius: RADIUS.lg,
    paddingHorizontal: 24,
    paddingVertical: 14,
  },
  heroPrimaryBtnHover: {
    backgroundColor: COLORS.primaryLight,
  },
  heroPrimaryBtnText: {
    color: COLORS.white,
    fontWeight: '700',
    fontSize: 16,
  },

  /* ─── Before/After Showcase ─── */
  baContainer: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'center',
    gap: SPACING.xs,
  },
  baColumn: {
    flex: 1,
    alignItems: 'center',
  },
  baCard: {
    width: '100%',
    borderRadius: RADIUS.lg,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: COLORS.border,
    backgroundColor: COLORS.surface,
  },
  baImage: {
    width: '100%',
    aspectRatio: 3 / 4,
  },
  baPlaceholder: {
    backgroundColor: '#1a1815',
    alignItems: 'center',
    justifyContent: 'center',
  },
  baLabel: {
    color: COLORS.textMuted,
    fontSize: 11,
    fontWeight: '600',
    marginTop: 6,
    letterSpacing: 0.3,
  },
  baSparkleBadge: {
    position: 'absolute',
    top: 8,
    right: 8,
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: 'rgba(200, 134, 10, 0.3)',
    borderWidth: 1,
    borderColor: 'rgba(245, 200, 66, 0.5)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  baSparkleText: {
    color: COLORS.primaryLight,
    fontSize: 14,
  },
  baCenter: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingTop: SPACING.xl,
    gap: 6,
  },
  baCarpetWrap: {
    width: 56,
    height: 74,
    borderRadius: RADIUS.md,
    overflow: 'hidden',
    borderWidth: 2,
    borderColor: COLORS.primary,
    position: 'relative',
  },
  baCarpetWrapMobile: {
    width: 48,
    height: 64,
  },
  baCarpetThumb: {
    width: '100%',
    height: '100%',
  },
  baCarpetCheck: {
    position: 'absolute',
    top: -1,
    right: -1,
    width: 18,
    height: 18,
    borderBottomLeftRadius: 7,
    backgroundColor: COLORS.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  baCarpetCheckInner: {
    width: 7,
    height: 4,
    borderLeftWidth: 1.5,
    borderBottomWidth: 1.5,
    borderColor: COLORS.white,
    transform: [{ rotate: '-45deg' }],
    marginTop: -2,
    marginLeft: 1,
  },
  baCarpetModel: {
    color: COLORS.textMuted,
    fontSize: 10,
    fontWeight: '700',
  },

  /* ─── Features ─── */
  featuresGrid: {
    flexDirection: 'row',
    gap: SPACING.md,
  },
  featuresGridMobile: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
  },
  featureCard: {
    flex: 1,
    minWidth: 140,
    backgroundColor: COLORS.surface,
    borderRadius: RADIUS.lg,
    borderWidth: 1,
    borderColor: COLORS.border,
    paddingVertical: SPACING.md,
    paddingHorizontal: SPACING.md,
    alignItems: 'center',
  },
  featureCardMobile: {
    flex: 0,
    width: '30%',
    minWidth: 100,
    paddingVertical: SPACING.sm,
    paddingHorizontal: SPACING.xs,
  },
  featureIconWrap: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(200, 134, 10, 0.18)',
    borderWidth: 1,
    borderColor: 'rgba(200, 134, 10, 0.35)',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: SPACING.sm,
  },
  featureTitle: {
    color: COLORS.text,
    fontSize: 13,
    fontWeight: '700',
    textAlign: 'center',
    marginBottom: 4,
  },
  featureDesc: {
    color: COLORS.textSecondary,
    fontSize: 11,
    textAlign: 'center',
    lineHeight: 15,
  },

  /* ─── Feature Icons ─── */
  iconBase: { width: 16, height: 16, alignItems: 'center', justifyContent: 'center' },
  iconTargetOuter: { position: 'absolute', width: 14, height: 14, borderRadius: 7, borderWidth: 1.8, borderColor: COLORS.primary },
  iconTargetInner: { position: 'absolute', width: 8, height: 8, borderRadius: 4, borderWidth: 1.8, borderColor: COLORS.primary },
  iconTargetDot: { width: 3, height: 3, borderRadius: 2, backgroundColor: COLORS.primary },
  iconBolt: { position: 'absolute', width: 8, height: 2.5, borderRadius: 2, backgroundColor: COLORS.primary, transform: [{ rotate: '-28deg' }], top: 5 },
  iconBoltTail: { position: 'absolute', width: 8, height: 2.5, borderRadius: 2, backgroundColor: COLORS.primary, transform: [{ rotate: '-28deg' }], top: 10, left: 4 },
  iconCheckCircle: { position: 'absolute', width: 14, height: 14, borderRadius: 7, borderWidth: 1.8, borderColor: COLORS.primary },
  iconCheckStem: { position: 'absolute', width: 2, height: 6, backgroundColor: COLORS.primary, borderRadius: 2, transform: [{ rotate: '-40deg' }], left: 5, top: 7 },
  iconCheckArm: { position: 'absolute', width: 2, height: 9, backgroundColor: COLORS.primary, borderRadius: 2, transform: [{ rotate: '46deg' }], left: 8, top: 4 },

  /* ─── Showcase ─── */
  showcaseGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: SPACING.sm,
    justifyContent: 'center',
  },
  showcaseItem: {
    borderRadius: RADIUS.md,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  showcaseImage: {
    width: '100%',
    aspectRatio: 1 / 1.35,
  },
  brandTabsScroll: {
    marginBottom: SPACING.md,
  },
  brandTabsRow: {
    flexDirection: 'row',
    gap: SPACING.xs,
    paddingHorizontal: 2,
  },
  brandTab: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: RADIUS.lg,
    borderWidth: 1,
    borderColor: COLORS.border,
    backgroundColor: 'transparent',
  },
  brandTabActive: {
    backgroundColor: COLORS.primary,
    borderColor: COLORS.primary,
  },
  brandTabText: {
    color: COLORS.textSecondary,
    fontSize: 13,
    fontWeight: '600',
  },
  brandTabTextActive: {
    color: COLORS.white,
  },

  /* ─── Contact CTA ─── */
  contactCard: {
    backgroundColor: COLORS.surface,
    borderRadius: RADIUS.xl,
    borderWidth: 1,
    borderColor: COLORS.border,
    padding: SPACING.lg,
    alignItems: 'center',
  },
  contactDesc: {
    color: COLORS.textSecondary,
    fontSize: 14,
    textAlign: 'center',
    lineHeight: 20,
    marginTop: SPACING.xs,
    marginBottom: SPACING.lg,
  },
  contactBtnRow: {
    flexDirection: 'row',
    gap: SPACING.sm,
    alignItems: 'center',
  },
  contactBtnRowMobile: {
    flexDirection: 'column',
    width: '100%',
  },
  whatsappBtn: {
    backgroundColor: '#25D366',
    borderRadius: RADIUS.lg,
    paddingHorizontal: 24,
    paddingVertical: 14,
    alignItems: 'center',
  },
  whatsappBtnHover: {
    backgroundColor: '#22C55E',
  },
  whatsappBtnText: {
    color: COLORS.white,
    fontWeight: '700',
    fontSize: 16,
  },
  contactGhostBtn: {
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: RADIUS.lg,
    paddingHorizontal: 24,
    paddingVertical: 12,
    alignItems: 'center',
  },
  contactGhostBtnHover: {
    backgroundColor: COLORS.surfaceElevated,
  },
  contactGhostBtnText: {
    color: COLORS.textSecondary,
    fontWeight: '600',
    fontSize: 14,
  },
  contactPhone: {
    color: COLORS.textMuted,
    fontSize: 13,
    marginTop: SPACING.md,
  },

  /* ─── Login Form ─── */
  formCard: {
    backgroundColor: COLORS.surface,
    borderRadius: RADIUS.xl,
    borderWidth: 1,
    borderColor: COLORS.border,
    padding: SPACING.md,
    gap: SPACING.sm,
    maxWidth: 420,
    width: '100%',
    alignSelf: 'center',
  },
  inputWrap: {
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: RADIUS.md,
    backgroundColor: COLORS.surfaceElevated,
  },
  inputWrapFocused: {
    borderColor: COLORS.primary,
  },
  input: {
    color: COLORS.text,
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.sm + 2,
    fontSize: 16,
  },
  inputWeb: {
    outlineStyle: 'none',
    outlineWidth: 0,
    boxShadow: 'none',
  } as any,
  loginBtn: {
    marginTop: SPACING.xs,
    backgroundColor: COLORS.primary,
    borderRadius: RADIUS.lg,
    paddingVertical: SPACING.md,
    alignItems: 'center',
    justifyContent: 'center',
  },
  loginBtnHover: {
    backgroundColor: COLORS.primaryLight,
  },
  loginBtnDisabled: {
    opacity: 0.8,
  },
  loginBtnContent: {
    width: '100%',
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 8,
  },
  loginBtnText: {
    color: COLORS.white,
    fontWeight: '700',
    fontSize: 16,
  },

  /* ─── Footer ─── */
  footer: {
    alignItems: 'center',
    paddingTop: SPACING.lg,
    paddingBottom: SPACING.md,
    borderTopWidth: 1,
    borderTopColor: COLORS.border,
    marginTop: SPACING.md,
  },
  footerBrand: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: SPACING.xs,
  },
  footerLogo: {
    fontSize: 16,
    fontWeight: '800',
    color: COLORS.textMuted,
    letterSpacing: 0.5,
  },
  footerBadge: {
    marginLeft: 4,
    backgroundColor: 'rgba(200, 134, 10, 0.1)',
    borderRadius: 4,
    paddingHorizontal: 4,
    paddingVertical: 1,
  },
  footerBadgeText: {
    fontSize: 8,
    fontWeight: '800',
    color: COLORS.textMuted,
    letterSpacing: 0.3,
    textTransform: 'uppercase',
  },
  footerText: {
    color: COLORS.textMuted,
    fontSize: 12,
    marginBottom: 2,
  },
  footerCopy: {
    color: COLORS.textMuted,
    fontSize: 11,
  },

  /* ─── Fullscreen Image Overlay ─── */
  fsOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.95)',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 9999,
  },
  fsImage: {
    width: '100%',
    height: '100%',
  },
  fsCloseBtn: {
    position: 'absolute',
    top: 16,
    right: 16,
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.15)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  fsCloseBtnText: {
    color: COLORS.white,
    fontSize: 20,
    fontWeight: '300',
  },
});
