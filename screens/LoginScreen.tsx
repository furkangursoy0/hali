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
  Modal,
  useWindowDimensions,
} from 'react-native';
import { COLORS, SPACING, RADIUS } from '../constants/theme';
import { useAuth } from '../contexts/AuthContext';
import { getCarpetThumbnailUrl } from '../services/carpet-image';

const isWeb = Platform.OS === 'web';

const WHATSAPP_NUMBER = '905300947756';
const WHATSAPP_MESSAGE = encodeURIComponent('Merhaba, Halı Dene hakkında bilgi almak istiyorum.');

const SHOWCASE_CARPETS = [
  { thumbPath: 'carpets-thumbs/Atlas/Beykoz/ZY01A.webp', imagePath: 'carpets/Atlas/Beykoz/ZY01A.png' },
  { thumbPath: 'carpets-thumbs/Merinos/Arden/72484-062.webp', imagePath: 'carpets/Merinos/Arden/72484-062.jpeg' },
  { thumbPath: 'carpets-thumbs/Pierre_Cardin/Beverly/BF01A.webp', imagePath: 'carpets/Pierre_Cardin/Beverly/BF01A.jpg' },
  { thumbPath: 'carpets-thumbs/Royal_Hali/Momento/ZV07A.webp', imagePath: 'carpets/Royal_Hali/Momento/ZV07A.png' },
  { thumbPath: 'carpets-thumbs/Empara/Agra/5009Cyan.webp', imagePath: 'carpets/Empara/Agra/5009Cyan.jpg' },
  { thumbPath: 'carpets-thumbs/Dolce_Vita/Casablanca/682_Mocca.webp', imagePath: 'carpets/Dolce_Vita/Casablanca/682_Mocca.webp' },
  { thumbPath: 'carpets-thumbs/Kreasyon/Akasya/AK003_Gri.webp', imagePath: 'carpets/Kreasyon/Akasya/AK003_Gri.jpg' },
  { thumbPath: 'carpets-thumbs/Jusco/ELEGANT/ELEGANT-1375.webp', imagePath: 'carpets/Jusco/ELEGANT/ELEGANT-1375.jpg' },
  { thumbPath: 'carpets-thumbs/Karmen/ELEGANCE/ELEGANCE-EG001A.webp', imagePath: 'carpets/Karmen/ELEGANCE/ELEGANCE-EG001A.jpg' },
  { thumbPath: 'carpets-thumbs/Merinos/Elegance/73941-060.webp', imagePath: 'carpets/Merinos/Elegance/73941-060.jpeg' },
  { thumbPath: 'carpets-thumbs/Pierre_Cardin/Morina/LH01A.webp', imagePath: 'carpets/Pierre_Cardin/Morina/LH01A.jpg' },
  { thumbPath: 'carpets-thumbs/Dolce_Vita/Bengal/El_Dokuma_Jüt.webp', imagePath: 'carpets/Dolce_Vita/Bengal/El_Dokuma_Jüt.webp' },
];

const DEMO_CARPET = {
  thumbPath: 'carpets-thumbs/Atlas/Beykoz/ZY01A.webp',
  imagePath: 'carpets/Atlas/Beykoz/ZY01A.png',
  brand: 'Atlas',
  collection: 'Beykoz',
  model: 'ZY01A',
};

const BRAND_NAMES = ['Atlas', 'Dolce Vita', 'Empara', 'Jusco', 'Karmen', 'Kreasyon', 'Merinos', 'Pierre Cardin', 'Royal Halı'];

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
      <View style={[s.heroCTARow, !isWide && s.heroCTARowMobile]}>
        <Pressable
          style={({ hovered }: any) => [s.heroPrimaryBtn, hovered && s.heroPrimaryBtnHover]}
          onPress={scrollToLogin}
        >
          <Text style={s.heroPrimaryBtnText}>Giriş Yap</Text>
        </Pressable>
        <Pressable
          style={({ hovered }: any) => [s.heroWhatsappBtn, hovered && s.heroWhatsappBtnHover]}
          onPress={openWhatsApp}
        >
          <Text style={s.heroWhatsappBtnText}>WhatsApp ile Ulaşın</Text>
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
        {/* ─ Room Photo ─ */}
        <Pressable style={[s.baCard, !isWide && s.baCardMobile]} onPress={() => beforeImageUri && setFullscreenImage(beforeImageUri)}>
          {beforeImageUri ? (
            <Image source={{ uri: beforeImageUri }} style={[s.baImage, !isWide && s.baImageMobile]} resizeMode="cover" />
          ) : (
            <View style={[s.baImage, !isWide && s.baImageMobile, s.baPlaceholder]} />
          )}
        </Pressable>

        {/* ─ Arrow ─ */}
        <Text style={s.baArrow}>→</Text>

        {/* ─ Carpet Selection ─ */}
        <View style={s.baMiddle}>
          <View style={[s.baCarpetWrap, !isWide && s.baCarpetWrapMobile]}>
            <Image source={{ uri: demoCarpetUrl }} style={s.baCarpetThumb} resizeMode="cover" />
            <View style={s.baCarpetCheck}>
              <View style={s.baCarpetCheckInner} />
            </View>
          </View>
          <View style={s.baCarpetInfo}>
            <Text style={s.baCarpetBrand}>{DEMO_CARPET.brand} · {DEMO_CARPET.collection}</Text>
            <Text style={s.baCarpetModel}>{DEMO_CARPET.model}</Text>
          </View>
        </View>

        {/* ─ Arrow ─ */}
        <Text style={s.baArrow}>→</Text>

        {/* ─ AI Result ─ */}
        <Pressable style={[s.baCard, !isWide && s.baCardMobile]} onPress={() => afterImageUri && setFullscreenImage(afterImageUri)}>
          {afterImageUri ? (
            <Image source={{ uri: afterImageUri }} style={[s.baImage, !isWide && s.baImageMobile]} resizeMode="cover" />
          ) : (
            <View style={[s.baImage, !isWide && s.baImageMobile, s.baPlaceholder, s.baPlaceholderAfter]} />
          )}
          <View style={s.baAiBadge}>
            <Text style={s.baAiBadgeText}>AI</Text>
          </View>
        </Pressable>
      </View>
    </View>
  );

  /* ────────────────── ÖZELLİKLER ────────────────── */
  const renderFeatures = () => {
    const features = [
      { icon: 'target' as const, title: 'Gerçekçi Sonuçlar', desc: 'Perspektif ve ışık uyumlu AI yerleştirme' },
      { icon: 'speed' as const, title: 'Anında Sonuç', desc: '30-60 saniyede hazır görüntü' },
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

  /* ────────────────── HALI VİTRİNİ ────────────────── */
  const renderShowcase = () => (
    <View style={s.section}>
      <Text style={[s.sectionTitle, isWide && s.sectionTitleWide]}>2000+ Halı Kataloğu</Text>
      <Text style={s.sectionSubtitle}>9 markadan geniş koleksiyon</Text>
      <View style={s.showcaseGrid}>
        {SHOWCASE_CARPETS.map((carpet, i) => (
          <View key={i} style={[s.showcaseItem, { width: showcaseItemWidth }]}>
            <Image
              source={{ uri: getCarpetThumbnailUrl(carpet.imagePath, carpet.thumbPath) }}
              style={s.showcaseImage}
              resizeMode="cover"
            />
          </View>
        ))}
      </View>
      <View style={s.brandRow2}>
        {BRAND_NAMES.map((name) => (
          <View key={name} style={s.brandChip}>
            <Text style={s.brandChipText}>{name}</Text>
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

      {/* ─── Fullscreen Image Modal ─── */}
      {fullscreenImage && (
        <Modal visible transparent animationType="fade" onRequestClose={() => setFullscreenImage(null)}>
          <Pressable style={s.fsOverlay} onPress={() => setFullscreenImage(null)}>
            <Image source={{ uri: fullscreenImage }} style={s.fsImage} resizeMode="contain" />
            <View style={s.fsCloseBtn}>
              <Text style={s.fsCloseBtnText}>✕</Text>
            </View>
          </Pressable>
        </Modal>
      )}

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
          {renderShowcase()}
          {renderContactCTA()}
          {renderLoginForm()}
          {renderFooter()}
        </View>
      </ScrollView>
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
  heroCTARow: {
    flexDirection: 'row',
    gap: SPACING.sm,
    marginTop: SPACING.lg,
    justifyContent: 'center',
  },
  heroCTARowMobile: {
    gap: SPACING.sm,
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
  heroWhatsappBtn: {
    backgroundColor: '#25D366',
    borderRadius: RADIUS.lg,
    paddingHorizontal: 24,
    paddingVertical: 14,
  },
  heroWhatsappBtnHover: {
    backgroundColor: '#22C55E',
  },
  heroWhatsappBtnText: {
    color: COLORS.white,
    fontWeight: '700',
    fontSize: 16,
  },

  /* ─── Before/After Showcase ─── */
  baContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: SPACING.sm,
  },
  baCard: {
    flex: 1,
    borderRadius: RADIUS.lg,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: COLORS.border,
    backgroundColor: COLORS.surface,
  },
  baCardMobile: {},
  baImage: {
    width: '100%',
    aspectRatio: 3 / 4,
  },
  baImageMobile: {
    aspectRatio: 3 / 4,
  },
  baPlaceholder: {
    backgroundColor: '#1a1815',
    alignItems: 'center',
    justifyContent: 'center',
  },
  baPlaceholderAfter: {
    backgroundColor: '#1c1a15',
  },
  baAiBadge: {
    position: 'absolute',
    top: 8,
    right: 8,
    backgroundColor: 'rgba(200, 134, 10, 0.25)',
    borderRadius: 6,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderWidth: 1,
    borderColor: 'rgba(200, 134, 10, 0.45)',
  },
  baAiBadgeText: {
    color: COLORS.primaryLight,
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
  baMiddle: {
    alignItems: 'center',
    gap: 4,
    paddingVertical: SPACING.xs,
  },
  baArrow: {
    color: COLORS.textMuted,
    fontSize: 18,
    fontWeight: '300',
  },
  baCarpetWrap: {
    width: 72,
    height: 96,
    borderRadius: RADIUS.md,
    overflow: 'hidden',
    borderWidth: 2,
    borderColor: COLORS.primary,
    position: 'relative',
  },
  baCarpetWrapMobile: {
    width: 56,
    height: 74,
  },
  baCarpetThumb: {
    width: '100%',
    height: '100%',
  },
  baCarpetCheck: {
    position: 'absolute',
    top: -1,
    right: -1,
    width: 20,
    height: 20,
    borderBottomLeftRadius: 8,
    backgroundColor: COLORS.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  baCarpetCheckInner: {
    width: 8,
    height: 5,
    borderLeftWidth: 2,
    borderBottomWidth: 2,
    borderColor: COLORS.white,
    transform: [{ rotate: '-45deg' }],
    marginTop: -2,
    marginLeft: 1,
  },
  baCarpetInfo: {
    alignItems: 'center',
    gap: 1,
  },
  baCarpetBrand: {
    color: COLORS.textMuted,
    fontSize: 10,
    fontWeight: '600',
  },
  baCarpetModel: {
    color: COLORS.text,
    fontSize: 13,
    fontWeight: '800',
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
  brandRow2: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    gap: SPACING.xs,
    marginTop: SPACING.md,
  },
  brandChip: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: RADIUS.sm,
    borderWidth: 1,
    borderColor: 'rgba(200, 134, 10, 0.35)',
    backgroundColor: 'rgba(200, 134, 10, 0.12)',
  },
  brandChipText: {
    color: COLORS.primaryLight,
    fontSize: 11,
    fontWeight: '700',
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

  /* ─── Fullscreen Image Modal ─── */
  fsOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.95)',
    alignItems: 'center',
    justifyContent: 'center',
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
