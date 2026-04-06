import React, { useEffect, useRef, useState } from 'react';
import {
  Animated,
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
  PanResponder,
  useWindowDimensions,
} from 'react-native';
import { COLORS, SPACING, RADIUS } from '../constants/theme';
import { useAuth } from '../contexts/AuthContext';
import { getCarpetThumbnailUrl } from '../services/carpet-image';
import BRAND_CATALOG from '../data/landing-catalog.json';
import CATALOG_STATS from '../data/catalog-stats.json';
import LandingNavbar from '../components/landing/LandingNavbar';
import HeroSection from '../components/landing/HeroSection';
import StatsStrip from '../components/landing/StatsStrip';
import HowItWorks from '../components/landing/HowItWorks';
import StructuredBodyContent from '../components/landing/StructuredBodyContent';
import FaqSection, { LANDING_FAQS } from '../components/landing/FaqSection';

const isWeb = Platform.OS === 'web';

const WHATSAPP_NUMBER = '905300947756';
const WHATSAPP_MESSAGE = encodeURIComponent('Merhaba, Halı Dene hakkında bilgi almak istiyorum.');

const CATALOG_BRANDS = Object.keys(BRAND_CATALOG);
const TOTAL_CARPETS_LABEL = `${Math.floor(CATALOG_STATS.totalCarpets / 100) * 100}+`;
const TOTAL_BRANDS = CATALOG_STATS.totalBrands;
const SITE_URL = 'https://halidene.com';
const LANDING_TITLE = 'Halı Dene | Yapay Zeka ile Odanızda 3D Halı Deneyin';
const LANDING_DESCRIPTION =
  'Yapay zeka ile odanızda 3D halı deneyin. Binlerce halıyı müşterinizin veya kendi odanızın fotoğrafında görün, daha hızlı ve güvenli karar verin.';

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
  const [containerWidth, setContainerWidth] = useState(0);
  const [showBeforeOverlay, setShowBeforeOverlay] = useState(!isWeb || isWide);
  const [showDeferredSections, setShowDeferredSections] = useState(!isWeb || isWide);

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

  useEffect(() => {
    if (!isWeb) return;

    document.title = LANDING_TITLE;

    const ensureMeta = (selector: string, attributes: Record<string, string>) => {
      let el = document.querySelector(selector) as HTMLMetaElement | null;
      if (!el) {
        el = document.createElement('meta');
        document.head.appendChild(el);
      }
      Object.entries(attributes).forEach(([key, value]) => el!.setAttribute(key, value));
    };

    ensureMeta('meta[name="description"]', { name: 'description', content: LANDING_DESCRIPTION });
    ensureMeta('meta[property="og:title"]', { property: 'og:title', content: LANDING_TITLE });
    ensureMeta('meta[property="og:description"]', { property: 'og:description', content: LANDING_DESCRIPTION });
    ensureMeta('meta[property="og:url"]', { property: 'og:url', content: SITE_URL });
    ensureMeta('meta[property="og:type"]', { property: 'og:type', content: 'website' });
    ensureMeta('meta[name="twitter:title"]', { name: 'twitter:title', content: LANDING_TITLE });
    ensureMeta('meta[name="twitter:description"]', { name: 'twitter:description', content: LANDING_DESCRIPTION });
    ensureMeta('meta[name="twitter:card"]', { name: 'twitter:card', content: 'summary_large_image' });

    let canonical = document.querySelector('link[rel="canonical"]') as HTMLLinkElement | null;
    if (!canonical) {
      canonical = document.createElement('link');
      canonical.rel = 'canonical';
      document.head.appendChild(canonical);
    }
    canonical.href = SITE_URL;

    let script = document.querySelector('script[type="application/ld+json"][data-landing-faq]') as HTMLScriptElement | null;
    if (!script) {
      script = document.createElement('script');
      script.type = 'application/ld+json';
      script.setAttribute('data-landing-faq', 'true');
      document.head.appendChild(script);
    }
    script.textContent = JSON.stringify({
      '@context': 'https://schema.org',
      '@type': 'FAQPage',
      mainEntity: LANDING_FAQS.map((item) => ({
        '@type': 'Question',
        name: item.question,
        acceptedAnswer: {
          '@type': 'Answer',
          text: item.answer,
        },
      })),
    });
  }, []);

  useEffect(() => {
    if (!isWeb || isWide) {
      setShowBeforeOverlay(true);
      setShowDeferredSections(true);
      return;
    }

    const beforeTimer = window.setTimeout(() => setShowBeforeOverlay(true), 120);
    const deferredTimer = window.setTimeout(() => setShowDeferredSections(true), 260);

    return () => {
      window.clearTimeout(beforeTimer);
      window.clearTimeout(deferredTimer);
    };
  }, [isWide]);

  /* ────────────────── BEFORE / AFTER SLIDER ────────────────── */
  const demoCarpetUrl = getCarpetThumbnailUrl(DEMO_CARPET.imagePath, DEMO_CARPET.thumbPath);
  const beforeImageUri = isWeb && showBeforeOverlay ? '/demo-before.jpg' : undefined;
  const afterImageUri = isWeb ? '/demo-after.jpg' : undefined;

  const sliderPos = useRef(new Animated.Value(0)).current;
  const sliderContainerRef = useRef<View>(null);
  const sliderWidth = useRef(0);
  const isDragging = useRef(false);
  const hasAnimated = useRef(false);

  useEffect(() => {
    if (!hasAnimated.current && beforeImageUri) {
      hasAnimated.current = true;
      const timeout = setTimeout(() => {
        Animated.timing(sliderPos, {
          toValue: 0.5,
          duration: 1400,
          useNativeDriver: false,
        }).start();
      }, 800);
      return () => clearTimeout(timeout);
    }
  }, [beforeImageUri]);

  useEffect(() => {
    if (!isWeb) return;
    const el = sliderContainerRef.current as any;
    if (!el || !containerWidth) return;

    const getPos = (clientX: number) => {
      const rect = el.getBoundingClientRect();
      return Math.max(0.05, Math.min(0.95, (clientX - rect.left) / rect.width));
    };
    const onDown = (clientX: number) => { isDragging.current = true; sliderPos.setValue(getPos(clientX)); };
    const onMove = (clientX: number) => { if (isDragging.current) sliderPos.setValue(getPos(clientX)); };
    const onUp = () => { isDragging.current = false; };

    const md = (e: MouseEvent) => onDown(e.clientX);
    const ts = (e: TouchEvent) => onDown(e.touches[0].clientX);
    const mm = (e: MouseEvent) => onMove(e.clientX);
    const tm = (e: TouchEvent) => { if (isDragging.current) { e.preventDefault(); onMove(e.touches[0].clientX); } };

    el.addEventListener('mousedown', md);
    el.addEventListener('touchstart', ts, { passive: true });
    document.addEventListener('mousemove', mm);
    document.addEventListener('touchmove', tm, { passive: false });
    document.addEventListener('mouseup', onUp);
    document.addEventListener('touchend', onUp);

    return () => {
      el.removeEventListener('mousedown', md);
      el.removeEventListener('touchstart', ts);
      document.removeEventListener('mousemove', mm);
      document.removeEventListener('touchmove', tm);
      document.removeEventListener('mouseup', onUp);
      document.removeEventListener('touchend', onUp);
    };
  }, [containerWidth]);

  const panResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onMoveShouldSetPanResponder: (_, g) => Math.abs(g.dx) > Math.abs(g.dy),
      onPanResponderGrant: (e) => {
        isDragging.current = true;
        if (sliderWidth.current > 0 && sliderContainerRef.current) {
          sliderContainerRef.current.measureInWindow((x: number) => {
            const rel = e.nativeEvent.pageX - x;
            sliderPos.setValue(Math.max(0.05, Math.min(0.95, rel / sliderWidth.current)));
          });
        }
      },
      onPanResponderMove: (e) => {
        if (sliderWidth.current > 0 && sliderContainerRef.current) {
          sliderContainerRef.current.measureInWindow((x: number) => {
            const rel = e.nativeEvent.pageX - x;
            sliderPos.setValue(Math.max(0.05, Math.min(0.95, rel / sliderWidth.current)));
          });
        }
      },
      onPanResponderRelease: () => { isDragging.current = false; },
      onPanResponderTerminate: () => { isDragging.current = false; },
    })
  ).current;

  const renderBeforeAfter = (hideTitle = false) => {
    const clipWidth = sliderPos.interpolate({ inputRange: [0, 1], outputRange: ['0%', '100%'] });
    const handleLeft = sliderPos.interpolate({ inputRange: [0, 1], outputRange: ['0%', '100%'] });

    return (
      <View style={[s.section, hideTitle && { marginBottom: 0 }]}>
        {!hideTitle && (
          <>
            {isWeb
              ? React.createElement(
                  'h2',
                  { style: StyleSheet.flatten([s.sectionTitle, isWide && s.sectionTitleWide]) as any },
                  'Öncesi ve Sonrası'
                )
              : (
                <Text style={[s.sectionTitle, isWide && s.sectionTitleWide]}>
                  Öncesi ve Sonrası
                </Text>
              )}
            <Text style={s.sectionSubtitle}>Kaydırarak öncesi ve sonrasını karşılaştırın</Text>
          </>
        )}
        <View
          ref={sliderContainerRef}
          style={[
            s.sliderContainer,
            !isWide && s.sliderContainerMobile,
            isWeb && ({ cursor: 'ew-resize', userSelect: 'none', touchAction: 'pan-y', boxShadow: '0 0 60px rgba(200, 134, 10, 0.08)' } as any),
          ]}
          onLayout={(e) => { const w = e.nativeEvent.layout.width; sliderWidth.current = w; setContainerWidth(w); }}
          {...(!isWeb ? panResponder.panHandlers : {})}
        >
          {afterImageUri && (
            isWeb
              ? React.createElement('img', {
                  src: afterImageUri,
                  alt: 'Odaya yerleştirilmiş halı örneği',
                  loading: 'eager',
                  fetchPriority: 'high',
                  decoding: 'async',
                  width: 1200,
                  height: 900,
                  style: StyleSheet.flatten(s.sliderImage) as any,
                })
              : <Image source={{ uri: afterImageUri }} style={s.sliderImage} resizeMode="cover" />
          )}
          {beforeImageUri && (
            <Animated.View style={[s.sliderBeforeClip, { width: clipWidth }]}>
              {isWeb
                ? React.createElement('img', {
                    src: beforeImageUri,
                    alt: 'Halı eklenmeden önce oda görünümü',
                    loading: 'eager',
                    fetchPriority: 'low',
                    decoding: 'async',
                    width: 1200,
                    height: 900,
                    style: StyleSheet.flatten([s.sliderImageAbsolute, containerWidth > 0 && { width: containerWidth }]) as any,
                  })
                : <Image source={{ uri: beforeImageUri }} style={[s.sliderImageAbsolute, containerWidth > 0 && { width: containerWidth }]} resizeMode="cover" />}
            </Animated.View>
          )}
          <Animated.View style={[s.sliderDivider, { left: handleLeft }]}>
            <View style={s.sliderLine} />
            <View style={s.sliderHandle}>
              <Text style={s.sliderHandleArrows}>{'◂ ▸'}</Text>
            </View>
          </Animated.View>
          <View style={s.sliderLabelLeft}>
            <Text style={s.sliderLabelText}>Önce</Text>
          </View>
          <View style={s.sliderLabelRight}>
            <Text style={s.sliderLabelText}>{'✦ '}Sonra</Text>
          </View>
          {isWeb && (
            <View style={[s.sliderBottomGrad, { backgroundImage: 'linear-gradient(transparent, rgba(0,0,0,0.35))', pointerEvents: 'none' } as any]} />
          )}
          <View style={s.sliderCarpetBadge}>
            <View style={[s.baCarpetWrap, !isWide && s.baCarpetWrapMobile]}>
              <Image source={{ uri: demoCarpetUrl }} style={s.baCarpetThumb} resizeMode="cover" />
              <View style={s.baCarpetCheck}>
                <View style={s.baCarpetCheckInner} />
              </View>
            </View>
            <Text style={s.sliderCarpetLabel}>{DEMO_CARPET.brand} · {DEMO_CARPET.collection}</Text>
          </View>
        </View>
      </View>
    );
  };

/* ────────────────── HALI KATALOĞU ────────────────── */
  const allCatalogCarpets = (BRAND_CATALOG as Record<string, { thumbPath: string; imagePath: string }[]>)[selectedBrand] || [];
  const catalogCarpets = isWide ? allCatalogCarpets : allCatalogCarpets.slice(0, 6);

  const renderCatalog = () => (
    <View style={s.section}>
      <Text style={[s.sectionTitle, isWide && s.sectionTitleWide]}>{TOTAL_CARPETS_LABEL} Halı Kataloğu</Text>
      <Text style={s.sectionSubtitle}>Markaları keşfedin</Text>

      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={s.brandTabsRow}
        style={s.brandTabsScroll}
      >
        {CATALOG_BRANDS.map((brand) => {
          const brandCarpets = (BRAND_CATALOG as any)[brand] || [];
          return (
            <Pressable
              key={brand}
              style={({ hovered }: any) => [
                s.brandTab,
                selectedBrand === brand && s.brandTabActive,
                hovered && selectedBrand !== brand && s.brandTabHover,
              ]}
              onPress={() => setSelectedBrand(brand)}
            >
              <Text style={[s.brandTabText, selectedBrand === brand && s.brandTabTextActive]}>
                {brand}
              </Text>
            </Pressable>
          );
        })}
      </ScrollView>

      <View style={s.showcaseGrid}>
        {catalogCarpets.map((carpet, i) => (
          <Pressable
            key={`${selectedBrand}-${i}`}
            style={({ hovered }: any) => [
              s.showcaseItem,
              { width: showcaseItemWidth },
              hovered && s.showcaseItemHover,
            ]}
          >
            {isWeb ? (
              React.createElement('img', {
                src: getCarpetThumbnailUrl(carpet.imagePath, carpet.thumbPath),
                loading: 'lazy',
                style: { width: '100%', aspectRatio: '1/1.35', objectFit: 'cover', display: 'block' },
              })
            ) : (
              <Image
                source={{ uri: getCarpetThumbnailUrl(carpet.imagePath, carpet.thumbPath) }}
                style={s.showcaseImage}
                resizeMode="cover"
              />
            )}
          </Pressable>
        ))}
      </View>
    </View>
  );

  /* ────────────────── İLETİŞİM CTA ────────────────── */
  const renderContactCTA = () => (
    <View style={[
      s.contactSection,
      isWeb && ({
        backgroundImage: 'linear-gradient(135deg, rgba(200,134,10,0.06), rgba(200,134,10,0.02))',
      } as any),
    ]}>
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
        {isWide && <Text style={s.contactOr}>veya</Text>}
        <Pressable
          style={({ hovered }: any) => [s.contactGhostBtn, hovered && s.contactGhostBtnHover]}
          onPress={() => navigation.navigate('Contact')}
        >
          <Text style={s.contactGhostBtnText}>İletişim Formu →</Text>
        </Pressable>
      </View>
      <Pressable onPress={() => Linking.openURL('tel:+905300947756')}>
        <Text style={s.contactPhone}>0530 094 77 56</Text>
      </Pressable>
    </View>
  );

  /* ────────────────── GİRİŞ FORMU ────────────────── */
  const renderLoginForm = () => (
    <View
      style={s.loginSection}
      onLayout={(e) => { loginSectionY.current = e.nativeEvent.layout.y; }}
    >
      <View style={[s.loginInner, isWide && s.loginInnerWide]}>
        {/* Marketing column (desktop) */}
        {isWide && (
          <View style={s.loginMarketing}>
            <Text style={s.loginMarketingTitle}>Halı Dene'yi Kullanın</Text>
            <View style={s.loginBullet}>
              <Text style={s.bulletDot}>✦</Text>
              <Text style={s.bulletText}>{TOTAL_CARPETS_LABEL} halı, {TOTAL_BRANDS} marka</Text>
            </View>
            <View style={s.loginBullet}>
              <Text style={s.bulletDot}>✦</Text>
              <Text style={s.bulletText}>20-30 saniyede gerçekçi sonuç</Text>
            </View>
            <View style={s.loginBullet}>
              <Text style={s.bulletDot}>✦</Text>
              <Text style={s.bulletText}>Kolay kullanım, eğitim gerektirmez</Text>
            </View>
            <View style={s.loginBullet}>
              <Text style={s.bulletDot}>✦</Text>
              <Text style={s.bulletText}>Satış artışı, iade azalışı</Text>
            </View>
          </View>
        )}

        {/* Form column */}
        <View style={s.loginFormCol}>
          <Text style={[s.loginFormTitle, !isWide && { textAlign: 'center' as const }]}>Giriş Yap</Text>
          <Text style={[s.loginFormSubtitle, !isWide && { textAlign: 'center' as const }]}>Hesabınız varsa giriş yapın</Text>
          <View style={[
            s.formCard,
            isWeb && ({ boxShadow: '0 4px 32px rgba(0,0,0,0.3)' } as any),
          ]}>
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
          <Pressable onPress={openWhatsApp}>
            <Text style={s.loginDemoLink}>Hesabınız yok mu? Demo talep edin →</Text>
          </Pressable>
        </View>
      </View>
    </View>
  );

  /* ────────────────── FOOTER ────────────────── */
  const renderFooter = () => (
    <View style={s.footer}>
      <View style={[s.footerInner, isWide && s.footerInnerWide]}>
        <View style={s.footerBrandCol}>
          <View style={s.footerBrand}>
            <Text style={s.footerLogo}>HALI</Text>
            <View style={s.footerBadge}>
              <Text style={s.footerBadgeText}>DENE</Text>
            </View>
          </View>
          <Text style={s.footerText}>Yapay zeka destekli halı deneme platformu.{'\n'}Halıları odalarda canlandırın.</Text>
        </View>

        {isWide && (
          <>
            <View style={s.footerCol}>
              <Text style={s.footerColTitle}>Platform</Text>
              <Pressable onPress={scrollToLogin}><Text style={s.footerLink}>Giriş Yap</Text></Pressable>
              <Pressable onPress={openWhatsApp}><Text style={s.footerLink}>Demo Talep</Text></Pressable>
              <Pressable onPress={() => navigation.navigate('Blog')}><Text style={s.footerLink}>Blog</Text></Pressable>
            </View>
            <View style={s.footerCol}>
              <Text style={s.footerColTitle}>İletişim</Text>
              <Pressable onPress={openWhatsApp}><Text style={s.footerLink}>WhatsApp</Text></Pressable>
              <Pressable onPress={() => navigation.navigate('Contact')}><Text style={s.footerLink}>İletişim Formu</Text></Pressable>
              <Pressable onPress={() => Linking.openURL('tel:+905300947756')}><Text style={s.footerLink}>0530 094 77 56</Text></Pressable>
            </View>
          </>
        )}
      </View>

      <View style={s.footerBottom}>
        <Text style={s.footerCopy}>© {new Date().getFullYear()} halidene.com · Tüm hakları saklıdır.</Text>
      </View>
    </View>
  );

  /* ────────────────── MAIN RENDER ────────────────── */
  return (
    <View style={[s.container, isWeb && ({ height: '100dvh', maxHeight: '100dvh' } as any)]}>
      <StatusBar barStyle="light-content" backgroundColor={COLORS.background} />

      <LandingNavbar isWide={isWide} onLoginPress={scrollToLogin} onWhatsAppPress={openWhatsApp} onBlogPress={() => navigation.navigate('Blog')} />

      <ScrollView
        ref={scrollViewRef}
        style={[s.scroll, isWeb && ({ overflowY: 'auto', overflowX: 'hidden' } as any)]}
        contentContainerStyle={[s.scrollContent, isWide ? s.scrollContentWide : s.scrollContentMobile]}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        <View style={[s.content, isWide && s.contentWide]}>
          {/* ── Hero + Before/After combined (desktop: side by side) ── */}
          {isWide ? (
            <View style={s.heroSplit}>
              <View style={s.heroSplitLeft}>
                <HeroSection
                  isWide={isWide}
                  totalCarpets={TOTAL_CARPETS_LABEL}
                  totalBrands={TOTAL_BRANDS}
                  onLoginPress={scrollToLogin}
                  onWhatsAppPress={openWhatsApp}
                />
              </View>
              <View style={s.heroSplitRight}>
                {renderBeforeAfter(true)}
              </View>
            </View>
          ) : (
            <>
              <HeroSection
                isWide={isWide}
                totalCarpets={TOTAL_CARPETS_LABEL}
                totalBrands={TOTAL_BRANDS}
                onLoginPress={scrollToLogin}
                onWhatsAppPress={openWhatsApp}
              />
              {renderBeforeAfter()}
            </>
          )}
          <StatsStrip isWide={isWide} totalCarpets={TOTAL_CARPETS_LABEL} totalBrands={TOTAL_BRANDS} />
          {showDeferredSections && (
            <>
              <HowItWorks isWide={isWide} />
              <StructuredBodyContent isWide={isWide} />
              {renderCatalog()}
              <FaqSection isWide={isWide} />
              {renderContactCTA()}
              {renderLoginForm()}
              {renderFooter()}
            </>
          )}
        </View>
      </ScrollView>

      {/* Fullscreen Image Overlay */}
      {fullscreenImage && (
        <Pressable
          style={[s.fsOverlay, isWeb && ({ position: 'fixed', inset: 0, zIndex: 9999, cursor: 'zoom-out', touchAction: 'none' } as any)]}
          onPress={() => setFullscreenImage(null)}
        >
          {isWeb ? (
            React.createElement('img', {
              src: fullscreenImage,
              style: { width: '100%', height: '100%', objectFit: 'contain', touchAction: 'pinch-zoom' },
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
    overflow: 'hidden',
  },
  scroll: { flex: 1 },
  scrollContent: {
    paddingHorizontal: SPACING.md,
    paddingBottom: SPACING.xxl,
  },
  scrollContentWide: {
    paddingHorizontal: SPACING.xxl,
  },
  scrollContentMobile: {
    paddingTop: SPACING.sm,
  },
  content: {
    width: '100%',
    maxWidth: 1280,
    alignSelf: 'center',
  },
  contentWide: {
    maxWidth: 1280,
  },

  /* ─── Hero Split Layout ─── */
  heroSplit: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.xl,
    marginBottom: SPACING.xl,
  },
  heroSplitLeft: {
    flex: 1,
  },
  heroSplitRight: {
    flex: 1.1,
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

  /* ─── Before/After Slider ─── */
  sliderContainer: {
    width: '100%',
    aspectRatio: 4 / 3,
    borderRadius: RADIUS.xxl,
    overflow: 'hidden',
    position: 'relative',
    backgroundColor: COLORS.surface,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  sliderContainerMobile: {
    aspectRatio: 3 / 4,
    borderRadius: RADIUS.xl,
  },
  sliderImage: {
    width: '100%',
    height: '100%',
  },
  sliderBeforeClip: {
    position: 'absolute',
    top: 0,
    left: 0,
    bottom: 0,
    overflow: 'hidden',
  },
  sliderImageAbsolute: {
    position: 'absolute',
    top: 0,
    left: 0,
    width: '100%',
    height: '100%',
  },
  sliderDivider: {
    position: 'absolute',
    top: 0,
    bottom: 0,
    width: 0,
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 10,
  },
  sliderLine: {
    position: 'absolute',
    top: 0,
    bottom: 0,
    width: 2.5,
    backgroundColor: '#fff',
    marginLeft: -1.25,
  },
  sliderHandle: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#fff',
    alignItems: 'center',
    justifyContent: 'center',
    elevation: 6,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.35,
    shadowRadius: 6,
  },
  sliderHandleArrows: {
    color: '#333',
    fontSize: 12,
    fontWeight: '700',
    letterSpacing: 2,
  },
  sliderLabelLeft: {
    position: 'absolute',
    top: 12,
    left: 12,
    backgroundColor: 'rgba(0, 0, 0, 0.55)',
    borderRadius: 20,
    paddingHorizontal: 14,
    paddingVertical: 6,
  },
  sliderLabelRight: {
    position: 'absolute',
    top: 12,
    right: 12,
    backgroundColor: COLORS.primary,
    borderRadius: 20,
    paddingHorizontal: 14,
    paddingVertical: 6,
  },
  sliderLabelText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '700',
    letterSpacing: 0.3,
  },
  sliderBottomGrad: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: 80,
  },
  sliderCarpetBadge: {
    position: 'absolute',
    bottom: 12,
    alignSelf: 'center',
    left: 0,
    right: 0,
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 8,
  },
  sliderCarpetLabel: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '700',
    backgroundColor: 'rgba(0, 0, 0, 0.55)',
    borderRadius: 16,
    paddingHorizontal: 12,
    paddingVertical: 5,
    overflow: 'hidden',
  },
  baCarpetWrap: {
    width: 44,
    height: 58,
    borderRadius: RADIUS.sm,
    overflow: 'hidden',
    borderWidth: 2,
    borderColor: COLORS.primary,
    position: 'relative',
  },
  baCarpetWrapMobile: {
    width: 38,
    height: 50,
  },
  baCarpetThumb: {
    width: '100%',
    height: '100%',
  },
  baCarpetCheck: {
    position: 'absolute',
    top: -1,
    right: -1,
    width: 16,
    height: 16,
    borderBottomLeftRadius: 6,
    backgroundColor: COLORS.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  baCarpetCheckInner: {
    width: 6,
    height: 4,
    borderLeftWidth: 1.5,
    borderBottomWidth: 1.5,
    borderColor: COLORS.white,
    transform: [{ rotate: '-45deg' }],
    marginTop: -1,
    marginLeft: 1,
  },


  /* ─── Showcase / Catalog ─── */
  showcaseGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: SPACING.sm,
    justifyContent: 'center',
  },
  showcaseItem: {
    borderRadius: RADIUS.lg,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  showcaseItemHover: {
    borderColor: COLORS.primaryGlowStrong,
    transform: [{ scale: 1.03 }],
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
  brandTabHover: {
    borderColor: COLORS.primaryGlowStrong,
    backgroundColor: COLORS.surfaceElevated,
  },
  brandTabText: {
    color: COLORS.textSecondary,
    fontSize: 13,
    fontWeight: '600',
  },
  brandTabTextActive: {
    color: COLORS.white,
  },
  brandTabCount: {
    color: COLORS.textMuted,
    fontSize: 11,
    fontWeight: '500',
  },

  /* ─── Contact CTA (enhanced) ─── */
  contactSection: {
    marginBottom: SPACING.xl,
    width: '100%',
    backgroundColor: COLORS.surfaceElevated,
    borderRadius: RADIUS.xxl,
    borderWidth: 1,
    borderColor: COLORS.border,
    padding: SPACING.xl,
    alignItems: 'center',
  },
  contactDesc: {
    color: COLORS.textSecondary,
    fontSize: 15,
    textAlign: 'center',
    lineHeight: 22,
    marginTop: SPACING.sm,
    marginBottom: SPACING.lg,
    maxWidth: 500,
  },
  contactBtnRow: {
    flexDirection: 'row',
    gap: SPACING.md,
    alignItems: 'center',
  },
  contactBtnRowMobile: {
    flexDirection: 'column',
    width: '100%',
  },
  contactOr: {
    color: COLORS.textMuted,
    fontSize: 13,
    fontWeight: '500',
  },
  whatsappBtn: {
    backgroundColor: '#25D366',
    borderRadius: RADIUS.lg,
    paddingHorizontal: 28,
    paddingVertical: 16,
    alignItems: 'center',
  },
  whatsappBtnHover: {
    backgroundColor: '#22C55E',
  },
  whatsappBtnText: {
    color: COLORS.white,
    fontWeight: '700',
    fontSize: 17,
  },
  contactGhostBtn: {
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: RADIUS.lg,
    paddingHorizontal: 24,
    paddingVertical: 14,
    alignItems: 'center',
  },
  contactGhostBtnHover: {
    backgroundColor: COLORS.surface,
    borderColor: COLORS.primaryGlowStrong,
  },
  contactGhostBtnText: {
    color: COLORS.textSecondary,
    fontWeight: '600',
    fontSize: 15,
  },
  contactPhone: {
    color: COLORS.primaryLight,
    fontSize: 14,
    fontWeight: '600',
    marginTop: SPACING.md,
  },

  /* ─── Login Form (redesigned) ─── */
  loginSection: {
    marginBottom: SPACING.xl,
    width: '100%',
    backgroundColor: COLORS.surface,
    borderRadius: RADIUS.xxl,
    borderWidth: 1,
    borderColor: COLORS.border,
    padding: SPACING.lg,
    overflow: 'hidden',
  },
  loginInner: {
    width: '100%',
  },
  loginInnerWide: {
    flexDirection: 'row',
    gap: SPACING.xl,
  },
  loginMarketing: {
    flex: 1,
    justifyContent: 'center',
    paddingRight: SPACING.md,
  },
  loginMarketingTitle: {
    color: COLORS.text,
    fontSize: 24,
    fontWeight: '800',
    marginBottom: SPACING.lg,
  },
  loginBullet: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: SPACING.sm,
    marginBottom: SPACING.md,
  },
  bulletDot: {
    color: COLORS.primaryLight,
    fontSize: 14,
    fontWeight: '700',
    marginTop: 1,
  },
  bulletText: {
    color: COLORS.textSecondary,
    fontSize: 15,
    lineHeight: 22,
    flex: 1,
  },
  loginFormCol: {
    flex: 1,
  },
  loginFormTitle: {
    color: COLORS.text,
    fontSize: 22,
    fontWeight: '800',
    marginBottom: SPACING.xs,
  },
  loginFormSubtitle: {
    color: COLORS.textSecondary,
    fontSize: 14,
    marginBottom: SPACING.md,
  },
  formCard: {
    backgroundColor: COLORS.surfaceElevated,
    borderRadius: RADIUS.xl,
    borderWidth: 1,
    borderColor: COLORS.border,
    padding: SPACING.md,
    gap: SPACING.sm,
  },
  inputWrap: {
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: RADIUS.md,
    backgroundColor: COLORS.surface,
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
  loginDemoLink: {
    color: COLORS.primaryLight,
    fontSize: 13,
    fontWeight: '600',
    textAlign: 'center',
    marginTop: SPACING.md,
  },

  /* ─── Footer ─── */
  footer: {
    borderTopWidth: 1,
    borderTopColor: COLORS.border,
    marginTop: SPACING.xl,
    paddingTop: SPACING.xxl,
    paddingBottom: SPACING.lg,
  },
  footerInner: {
    alignItems: 'center',
  },
  footerInnerWide: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: SPACING.xxl,
  },
  footerBrandCol: {
    flex: 1,
  },
  footerBrand: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: SPACING.sm,
  },
  footerLogo: {
    fontSize: 18,
    fontWeight: '800',
    color: COLORS.textSecondary,
    letterSpacing: 0.5,
  },
  footerBadge: {
    marginLeft: 4,
    backgroundColor: 'rgba(200, 134, 10, 0.1)',
    borderRadius: 4,
    paddingHorizontal: 5,
    paddingVertical: 2,
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
    fontSize: 13,
    lineHeight: 20,
  },
  footerCol: {
    gap: SPACING.sm,
  },
  footerColTitle: {
    color: COLORS.textSecondary,
    fontSize: 13,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: SPACING.xs,
  },
  footerLink: {
    color: COLORS.textMuted,
    fontSize: 14,
  },
  footerBottom: {
    marginTop: SPACING.xl,
    paddingTop: SPACING.md,
    borderTopWidth: 1,
    borderTopColor: COLORS.border,
    alignItems: 'center',
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
