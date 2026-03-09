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

const isWeb = Platform.OS === 'web';

const WHATSAPP_NUMBER = '905300947756';
const WHATSAPP_MESSAGE = encodeURIComponent('Merhaba, Halı Dene hakkında bilgi almak istiyorum.');

const SHOWCASE_CARPETS = [
  { thumbPath: 'carpets-thumbs/Atlas/Dore/DU01A.webp', imagePath: 'carpets/Atlas/Dore/DU01A.png' },
  { thumbPath: 'carpets-thumbs/Dolce_Vita/Donna/8251_Pearl.webp', imagePath: 'carpets/Dolce_Vita/Donna/8251_Pearl.webp' },
  { thumbPath: 'carpets-thumbs/Jusco/NORA/NORA-4314A.webp', imagePath: 'carpets/Jusco/NORA/NORA-4314A.jpg' },
  { thumbPath: 'carpets-thumbs/Karmen/KAFTAN/KAFTAN-KF006G.webp', imagePath: 'carpets/Karmen/KAFTAN/KAFTAN-KF006G.jpg' },
  { thumbPath: 'carpets-thumbs/Kreasyon/Akasya/AK002_Krem.webp', imagePath: 'carpets/Kreasyon/Akasya/AK002_Krem.jpg' },
  { thumbPath: 'carpets-thumbs/Merinos/Arden/72484-062.webp', imagePath: 'carpets/Merinos/Arden/72484-062.jpeg' },
  { thumbPath: 'carpets-thumbs/Pierre_Cardin/Beverly/BF01A.webp', imagePath: 'carpets/Pierre_Cardin/Beverly/BF01A.jpg' },
  { thumbPath: 'carpets-thumbs/Royal_Hali/Momento/ZV07A.webp', imagePath: 'carpets/Royal_Hali/Momento/ZV07A.png' },
  { thumbPath: 'carpets-thumbs/Empara/Agra/5005Papaya.webp', imagePath: 'carpets/Empara/Agra/5005Papaya.jpg' },
  { thumbPath: 'carpets-thumbs/Merinos/Launge/54094-260.webp', imagePath: 'carpets/Merinos/Launge/54094-260.jpeg' },
  { thumbPath: 'carpets-thumbs/Atlas/Arbel/EI01A.webp', imagePath: 'carpets/Atlas/Arbel/EI01A.png' },
  { thumbPath: 'carpets-thumbs/Karmen/ART/ART-AT001A.webp', imagePath: 'carpets/Karmen/ART/ART-AT001A.jpg' },
];

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
        Yapay zeka ile halılarınızı müşterinizin odasına yerleştirin.{'\n'}
        Satışlarınızı artırın, iade oranlarınızı düşürün.
      </Text>
      <View style={[s.heroCTARow, !isWide && s.heroCTARowMobile]}>
        <Pressable
          style={({ hovered }: any) => [s.heroPrimaryBtn, hovered && s.heroPrimaryBtnHover]}
          onPress={scrollToLogin}
        >
          <Text style={s.heroPrimaryBtnText}>Giriş Yap</Text>
        </Pressable>
        <Pressable
          style={({ hovered }: any) => [s.heroSecondaryBtn, hovered && s.heroSecondaryBtnHover]}
          onPress={() => navigation.navigate('Contact')}
        >
          <Text style={s.heroSecondaryBtnText}>İletişime Geç</Text>
        </Pressable>
      </View>
    </View>
  );

  /* ────────────────── NASIL ÇALIŞIR ────────────────── */
  const renderHowItWorks = () => {
    const steps = [
      { num: '1', label: isWide ? 'Oda Fotoğrafı Çekin' : 'Fotoğraf' },
      { num: '2', label: isWide ? 'Halı Seçin' : 'Halı Seç' },
      { num: '3', label: isWide ? 'AI Sonucu Görün' : 'Sonuç' },
    ];
    return (
      <View style={s.section}>
        <Text style={[s.sectionTitle, isWide && s.sectionTitleWide]}>Nasıl Çalışır?</Text>
        <View style={[s.stepsRow, !isWide && s.stepsRowMobile]}>
          {steps.map((step, i) => (
            <React.Fragment key={step.num}>
              <View style={[s.stepItem, !isWide && s.stepItemCompact]}>
                <View style={[s.stepBadge, !isWide && s.stepBadgeCompact]}>
                  <Text style={[s.stepNum, !isWide && s.stepNumCompact]}>{step.num}</Text>
                </View>
                <Text style={[s.stepText, !isWide && s.stepTextMobile]}>{step.label}</Text>
              </View>
              {isWide && i < steps.length - 1 && (
                <View style={s.stepArrowWrap}>
                  <Text style={s.stepArrowText}>→</Text>
                </View>
              )}
            </React.Fragment>
          ))}
        </View>
      </View>
    );
  };

  /* ────────────────── ÖZELLİKLER ────────────────── */
  const renderFeatures = () => {
    const features = [
      { icon: 'target' as const, title: 'Gerçekçi Sonuçlar', desc: 'Perspektif uyumlu yerleştirme' },
      { icon: 'speed' as const, title: 'Hızlı', desc: '30-60 saniyede hazır' },
      { icon: 'check' as const, title: 'Geniş Katalog', desc: '2000+ halı, 9 marka' },
    ];
    return (
      <View style={s.section}>
        <View style={[s.featuresGrid, !isWide && s.featuresGridMobile]}>
          {features.map((f) => (
            <View key={f.title} style={[s.featureCard, !isWide && s.featureCardMobile]}>
              <View style={s.featureCardRow}>
                <View style={s.featureIconWrap}>
                  <FeatureIcon type={f.icon} />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={s.featureTitle}>{f.title}</Text>
                  <Text style={s.featureDesc}>{f.desc}</Text>
                </View>
              </View>
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
            <Text style={s.whatsappBtnText}>WhatsApp ile Yazın</Text>
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
          {renderHowItWorks()}
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
  heroSecondaryBtn: {
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: RADIUS.lg,
    paddingHorizontal: 24,
    paddingVertical: 14,
  },
  heroSecondaryBtnHover: {
    backgroundColor: COLORS.surfaceElevated,
  },
  heroSecondaryBtnText: {
    color: COLORS.textSecondary,
    fontWeight: '600',
    fontSize: 16,
  },

  /* ─── Steps (How It Works) ─── */
  stepsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: SPACING.xs,
  },
  stepsRowMobile: {
    justifyContent: 'space-between',
    gap: 0,
  },
  stepItem: {
    minWidth: 170,
    alignItems: 'center',
    gap: 6,
  },
  stepItemCompact: {
    minWidth: 0,
    flex: 1,
    gap: 4,
  },
  stepBadge: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: COLORS.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  stepBadgeCompact: {
    width: 24,
    height: 24,
    borderRadius: 12,
  },
  stepNum: {
    color: COLORS.white,
    fontSize: 13,
    fontWeight: '700',
  },
  stepNumCompact: {
    fontSize: 11,
  },
  stepText: {
    color: COLORS.textSecondary,
    fontSize: 12,
    textAlign: 'center',
    lineHeight: 16,
  },
  stepTextMobile: {
    fontSize: 11,
    lineHeight: 14,
  },
  stepArrowWrap: {
    width: 40,
    alignItems: 'center',
  },
  stepArrowText: {
    color: COLORS.textMuted,
    fontSize: 16,
  },

  /* ─── Features ─── */
  featuresGrid: {
    flexDirection: 'row',
    gap: SPACING.sm,
  },
  featuresGridMobile: {
    flexDirection: 'column',
  },
  featureCard: {
    flex: 1,
    backgroundColor: COLORS.surface,
    borderRadius: RADIUS.md,
    borderWidth: 1,
    borderColor: COLORS.border,
    paddingVertical: SPACING.sm,
    paddingHorizontal: SPACING.sm,
  },
  featureCardMobile: {
    flex: 0,
  },
  featureCardRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.sm,
  },
  featureIconWrap: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: 'rgba(200, 134, 10, 0.18)',
    borderWidth: 1,
    borderColor: 'rgba(200, 134, 10, 0.35)',
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  featureTitle: {
    color: COLORS.text,
    fontSize: 12,
    fontWeight: '700',
    marginBottom: 2,
  },
  featureDesc: {
    color: COLORS.textSecondary,
    fontSize: 11,
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
});
