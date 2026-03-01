import React, { useState, useEffect, useCallback, useRef } from 'react';
import {
    View,
    Text,
    StyleSheet,
    Pressable,
    Image,
    Alert,
    StatusBar,
    Dimensions,
    ActivityIndicator,
    ScrollView,
    Platform,
    Modal,
} from 'react-native';
import * as MediaLibrary from 'expo-media-library';
import * as Sharing from 'expo-sharing';
import { COLORS, SPACING, RADIUS } from '../constants/theme';
import { placeCarperInRoom, PlacementMode, PlacementResult } from '../services/openai';
import { getCarpetFullUrl, getCarpetThumbnailUrl } from '../services/carpet-image';

const { width: screenWidth, height: screenHeight } = Dimensions.get('window');
const isWeb = Platform.OS === 'web';

interface Carpet {
    id: string;
    name: string;
    brand: string;
    collection: string;
    size?: string;
    material?: string;
    image: string;
    imagePath: string;
    thumbPath?: string;
}

interface RenderSlot {
    carpet: Carpet;
    status: 'loading' | 'success' | 'error';
    resultImageUri: string;
    errorMessage: string;
    errorCode: PlacementResult['errorCode'];
}

interface ResultScreenProps {
    navigation: any;
    route: any;
}

const LOADING_MESSAGES = [
    '🎨 Halı deseni analiz ediliyor...',
    '📐 Oda perspektifi hesaplanıyor...',
    '✨ AI halı deneme yapılıyor...',
    '🖼️ Görsel oluşturuluyor...',
    '🔍 Son rötuşlar yapılıyor...',
];

function mapErrorTitle(code: PlacementResult['errorCode']) {
    switch (code) {
        case 'AUTH': return 'Oturum Gerekli';
        case 'BILLING': return 'Servis Kotası Doldu';
        case 'API_KEY': return 'Servis Ayarı Hatası';
        case 'NETWORK': return 'Bağlantı Hatası';
        case 'RATE_LIMIT': return 'Yoğunluk Nedeniyle Bekleme';
        default: return 'Bir Hata Oluştu';
    }
}

// ── Module-level save / share helpers ─────────────────────────────────────
// Defined outside ResultScreen so they are stable references (not recreated on each render).
async function saveImage(uri: string, carpetName: string) {
    try {
        if (isWeb) {
            const response = await fetch(uri);
            const blob = await response.blob();
            const blobUrl = URL.createObjectURL(blob);
            const link = document.createElement('a');
            link.href = blobUrl;
            link.download = `hali-sonuc-${carpetName}-${Date.now()}.png`;
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
            setTimeout(() => URL.revokeObjectURL(blobUrl), 10000);
            return;
        }
        const { status: permStatus } = await MediaLibrary.requestPermissionsAsync();
        if (permStatus !== 'granted' && (permStatus as string) !== 'limited') {
            Alert.alert('İzin Gerekli', 'Fotoğraf kaydetmek için galeri iznine ihtiyaç var.');
            return;
        }
        await MediaLibrary.saveToLibraryAsync(uri);
        Alert.alert('✅ Kaydedildi', 'Görsel galerinize kaydedildi.');
    } catch (_err) {
        Alert.alert('Hata', 'Görsel kaydedilemedi.');
    }
}

async function shareImage(uri: string, carpetName: string) {
    try {
        if (isWeb) {
            const nav: any = navigator;
            const response = await fetch(uri);
            const blob = await response.blob();
            const file = new File([blob], `hali-sonuc-${carpetName}-${Date.now()}.png`, { type: blob.type || 'image/png' });
            if (nav?.canShare?.({ files: [file] }) && nav?.share) {
                await nav.share({ title: `${carpetName} - HALI`, text: `${carpetName} sonucu`, files: [file] });
                return;
            }
            Alert.alert('Paylaşım', 'Tarayıcı doğrudan paylaşımı desteklemiyor. Kaydet ile indirip paylaşabilirsiniz.');
            return;
        }
        const canShare = await Sharing.isAvailableAsync();
        if (canShare) {
            await Sharing.shareAsync(uri, { mimeType: 'image/png', dialogTitle: `${carpetName} - HALI` });
        } else {
            Alert.alert('Hata', 'Bu cihazda paylaşım desteklenmiyor.');
        }
    } catch (_err) {
        Alert.alert('Hata', 'Paylaşım başarısız.');
    }
}

// ── RenderCard ─────────────────────────────────────────────────────────────
// Defined OUTSIDE ResultScreen so React sees the same component type on every
// parent re-render.  Previously defined inline, which caused unmount+remount
// every 2.5 s (on loadingMsgIndex tick) → success-card image flicker.
interface RenderCardProps {
    slot: RenderSlot;
    index: number;
    isSingle: boolean;
    loadingMsgIndex: number;
    onRetry: (index: number, carpet: Carpet) => void;
    onOpenFullscreen: (index: number) => void;
    onSave: (uri: string, name: string) => void;
    onShare: (uri: string, name: string) => void;
}

const RenderCard = React.memo(function RenderCard({
    slot,
    index,
    isSingle,
    loadingMsgIndex,
    onRetry,
    onOpenFullscreen,
    onSave,
    onShare,
}: RenderCardProps) {
    const thumbUri = slot.carpet.id === '__custom__'
        ? slot.carpet.imagePath
        : (slot.carpet.imagePath ? getCarpetThumbnailUrl(slot.carpet.imagePath, slot.carpet.thumbPath, 200, 60) : '');

    const cardWidth = isSingle ? '100%' : '48.5%';

    if (slot.status === 'loading') {
        return (
            <View style={[styles.renderCard, styles.renderCardLoading, !isSingle && { width: cardWidth as any }]}>
                <ActivityIndicator size="large" color={COLORS.primary} style={{ marginBottom: SPACING.sm }} />
                <Text style={styles.cardLoadingMsg}>{LOADING_MESSAGES[loadingMsgIndex]}</Text>
                {thumbUri ? (
                    <Image source={{ uri: thumbUri }} style={styles.cardThumb} resizeMode="cover" />
                ) : null}
                <Text style={styles.cardCarpetName} numberOfLines={1}>{slot.carpet.name}</Text>
                <Text style={styles.cardSubtext}>20-70 saniye</Text>
            </View>
        );
    }

    if (slot.status === 'error') {
        return (
            <View style={[styles.renderCard, styles.renderCardError, !isSingle && { width: cardWidth as any }]}>
                <Text style={styles.cardErrorIcon}>⚠️</Text>
                <Text style={styles.cardErrorTitle}>{mapErrorTitle(slot.errorCode)}</Text>
                <Text style={styles.cardErrorMsg} numberOfLines={3}>{slot.errorMessage}</Text>
                <Pressable
                    style={({ hovered }: any) => [styles.cardRetryBtn, hovered && styles.cardRetryBtnHover]}
                    onPress={() => onRetry(index, slot.carpet)}
                >
                    <Text style={styles.cardRetryBtnText}>🔄 Tekrar Dene</Text>
                </Pressable>
                <Text style={styles.cardCarpetName} numberOfLines={1}>{slot.carpet.name}</Text>
            </View>
        );
    }

    // Success
    return (
        <View style={[styles.renderCard, styles.renderCardSuccess, !isSingle && { width: cardWidth as any }]}>
            <Pressable
                onPress={() => onOpenFullscreen(index)}
                style={({ hovered }: any) => [styles.cardImageWrap, hovered && { opacity: 0.9 }]}
            >
                <Image
                    source={{ uri: slot.resultImageUri }}
                    style={[styles.cardImage, isSingle && { maxHeight: isWeb ? Math.min(screenHeight * 0.55, 580) : screenWidth * 1.1 }]}
                    resizeMode="contain"
                />
                <View style={styles.cardZoomBadge}>
                    <Text style={styles.cardZoomText}>Tam ekran</Text>
                </View>
            </Pressable>
            {/* Carpet info + actions */}
            <View style={styles.cardInfoRow}>
                {thumbUri ? (
                    <Image source={{ uri: thumbUri }} style={styles.cardInfoThumb} resizeMode="cover" />
                ) : null}
                <View style={styles.cardInfoText}>
                    <Text style={styles.cardInfoBrand}>{slot.carpet.brand}</Text>
                    <Text style={styles.cardInfoName} numberOfLines={1}>{slot.carpet.name}</Text>
                </View>
                <Pressable
                    style={({ hovered }: any) => [styles.cardActionBtn, hovered && styles.cardActionBtnHover]}
                    onPress={() => onSave(slot.resultImageUri, slot.carpet.name)}
                >
                    <Text style={styles.cardActionIcon}>💾</Text>
                </Pressable>
                <Pressable
                    style={({ hovered }: any) => [styles.cardActionBtn, hovered && styles.cardActionBtnHover]}
                    onPress={() => onShare(slot.resultImageUri, slot.carpet.name)}
                >
                    <Text style={styles.cardActionIcon}>📤</Text>
                </Pressable>
            </View>
        </View>
    );
});

// ── ResultScreen ──────────────────────────────────────────────────────────
export default function ResultScreen({ navigation, route }: ResultScreenProps) {
    const { roomImageUri, carpet, carpets, mode, customerNote } = route.params;
    const placementMode: PlacementMode = mode || 'normal';

    // Geriye uyumluluk: carpets array yoksa tek carpet'tan oluştur
    const allCarpets: Carpet[] = carpets || (carpet ? [carpet] : []);
    const totalCount = allCarpets.length;
    const isSingle = totalCount === 1;

    const [renderSlots, setRenderSlots] = useState<RenderSlot[]>([]);
    const [loadingMsgIndex, setLoadingMsgIndex] = useState(0);
    const [fullscreenIndex, setFullscreenIndex] = useState<number | null>(null);
    const renderFiredRef = useRef(false);

    // Slot'ları başlat
    useEffect(() => {
        const slots: RenderSlot[] = allCarpets.map(c => ({
            carpet: c,
            status: 'loading',
            resultImageUri: '',
            errorMessage: '',
            errorCode: 'UNKNOWN',
        }));
        setRenderSlots(slots);
    }, []);

    // Loading mesajlarını döndür
    useEffect(() => {
        const interval = setInterval(() => {
            setLoadingMsgIndex(i => (i + 1) % LOADING_MESSAGES.length);
        }, 2500);
        return () => clearInterval(interval);
    }, []);

    const updateSlot = useCallback((index: number, updates: Partial<RenderSlot>) => {
        setRenderSlots(prev => prev.map((slot, i) =>
            i === index ? { ...slot, ...updates } : slot
        ));
    }, []);

    const fireRender = useCallback(async (carpetItem: Carpet, index: number) => {
        try {
            const carpetUri = carpetItem.id === '__custom__'
                ? carpetItem.imagePath
                : getCarpetFullUrl(carpetItem.imagePath);

            const result = await placeCarperInRoom(
                roomImageUri,
                carpetUri,
                carpetItem.name,
                placementMode,
                customerNote,
                // FIX: Credits are ALWAYS pre-deducted in SelectScreen via consumeAmount()
                // before navigating here — for both single and multi-carpet flows.
                // Passing creditsPreDeducted: true prevents the backend from charging again.
                { creditsPreDeducted: true },
            );

            if (result.success && result.imageUrl) {
                updateSlot(index, { status: 'success', resultImageUri: result.imageUrl });
            } else {
                updateSlot(index, {
                    status: 'error',
                    errorMessage: result.error || 'Bilinmeyen hata',
                    errorCode: result.errorCode || 'UNKNOWN',
                });
            }
        } catch (err: any) {
            updateSlot(index, {
                status: 'error',
                errorMessage: err.message || 'Bir hata oluştu',
                errorCode: 'NETWORK',
            });
        }
    }, [roomImageUri, placementMode, customerNote, updateSlot]);

    // Renderleri başlat (2sn stagger ile)
    useEffect(() => {
        if (renderSlots.length === 0 || renderFiredRef.current) return;
        renderFiredRef.current = true;
        allCarpets.forEach((carpetItem, index) => {
            setTimeout(() => fireRender(carpetItem, index), index * 2000);
        });
    }, [renderSlots.length]);

    // "Tekrar Dene" handler — free retry (credits already deducted, creditsPreDeducted: true)
    const handleRetry = useCallback((index: number, carpetItem: Carpet) => {
        updateSlot(index, { status: 'loading', errorMessage: '', errorCode: 'UNKNOWN' });
        fireRender(carpetItem, index);
    }, [updateSlot, fireRender]);

    // Durum özeti
    const completedCount = renderSlots.filter(s => s.status === 'success').length;
    const errorCount = renderSlots.filter(s => s.status === 'error').length;
    const loadingCount = renderSlots.filter(s => s.status === 'loading').length;

    // ── Fullscreen Modal ─────────────────────────────────────────────────
    const successSlots = renderSlots.filter(s => s.status === 'success');
    const fullscreenSlot = fullscreenIndex !== null ? renderSlots[fullscreenIndex] : null;

    const navigateFullscreen = (direction: 'prev' | 'next') => {
        if (fullscreenIndex === null) return;
        const successIndices = renderSlots.map((s, i) => s.status === 'success' ? i : -1).filter(i => i >= 0);
        const currentPos = successIndices.indexOf(fullscreenIndex);
        if (currentPos < 0) return;
        const nextPos = direction === 'next'
            ? (currentPos + 1) % successIndices.length
            : (currentPos - 1 + successIndices.length) % successIndices.length;
        setFullscreenIndex(successIndices[nextPos]);
    };

    // ── Layout ───────────────────────────────────────────────────────────
    return (
        <View style={styles.container}>
            <StatusBar barStyle="light-content" backgroundColor={COLORS.background} />

            {/* Header */}
            <View style={styles.header}>
                <Pressable onPress={() => navigation.goBack()} style={({ hovered }: any) => [styles.backBtn, hovered && { opacity: 0.85 }]}>
                    <Text style={styles.backBtnText}>← Geri</Text>
                </Pressable>
                <View style={styles.brandTitleWrap}>
                    <Text style={styles.title}>HALI</Text>
                    <View style={styles.headerBadge}>
                        <Text style={styles.headerBadgeText}>DENE</Text>
                    </View>
                </View>
                <View style={{ width: 60 }} />
            </View>

            {/* Progress bar */}
            {totalCount > 1 && (
                <View style={styles.progressBar}>
                    <Text style={styles.progressText}>
                        {completedCount}/{totalCount} tamamlandı
                        {errorCount > 0 ? ` · ${errorCount} başarısız` : ''}
                        {loadingCount > 0 ? ` · ${loadingCount} işleniyor` : ''}
                    </Text>
                    <View style={styles.progressTrack}>
                        <View style={[styles.progressFill, { width: `${(completedCount / totalCount) * 100}%` as any }]} />
                    </View>
                </View>
            )}

            {/* Results grid */}
            <ScrollView
                style={styles.resultScroll}
                contentContainerStyle={[styles.resultScrollContent, isWeb && styles.resultScrollContentWeb]}
                showsVerticalScrollIndicator={false}
            >
                <View style={[
                    styles.resultGrid,
                    isSingle && styles.resultGridSingle,
                ]}>
                    {renderSlots.map((slot, index) => (
                        <RenderCard
                            key={`${slot.carpet.brand}_${slot.carpet.image}_${index}`}
                            slot={slot}
                            index={index}
                            isSingle={isSingle}
                            loadingMsgIndex={loadingMsgIndex}
                            onRetry={handleRetry}
                            onOpenFullscreen={setFullscreenIndex}
                            onSave={saveImage}
                            onShare={shareImage}
                        />
                    ))}
                </View>

                {/* Nav buttons */}
                <Pressable
                    style={({ hovered }: any) => [styles.navBtn, hovered && styles.navBtnHover]}
                    onPress={() => navigation.goBack()}
                >
                    <Text style={styles.navBtnText}>← Başka halı dene</Text>
                </Pressable>
                <Pressable
                    style={({ hovered }: any) => [styles.navBtnPrimary, hovered && styles.navBtnPrimaryHover]}
                    onPress={() => navigation.navigate('Home')}
                >
                    <Text style={styles.navBtnPrimaryText}>🏠 Yeni Müşteri</Text>
                </Pressable>
            </ScrollView>

            {/* Fullscreen modal */}
            <Modal
                visible={fullscreenIndex !== null}
                animationType="fade"
                transparent
                onRequestClose={() => setFullscreenIndex(null)}
            >
                <View style={styles.fullscreenOverlay}>
                    {fullscreenSlot?.status === 'success' && (
                        <ScrollView
                            style={styles.fullscreenScroll}
                            contentContainerStyle={styles.fullscreenScrollContent}
                            maximumZoomScale={4}
                            minimumZoomScale={1}
                            centerContent
                            showsHorizontalScrollIndicator={false}
                            showsVerticalScrollIndicator={false}
                            bouncesZoom
                        >
                            <Image
                                source={{ uri: fullscreenSlot.resultImageUri }}
                                style={[styles.fullscreenImage, { aspectRatio: 1 }]}
                                resizeMode="contain"
                            />
                        </ScrollView>
                    )}
                    {/* Fullscreen controls */}
                    <Pressable style={styles.fullscreenCloseBtn} onPress={() => setFullscreenIndex(null)}>
                        <Text style={styles.fullscreenCloseBtnText}>✕ Kapat</Text>
                    </Pressable>
                    {/* Carpet name */}
                    {fullscreenSlot && (
                        <View style={styles.fullscreenInfoBar}>
                            <Text style={styles.fullscreenInfoText}>{fullscreenSlot.carpet.brand} · {fullscreenSlot.carpet.name}</Text>
                        </View>
                    )}
                    {/* Nav arrows (multi only) */}
                    {successSlots.length > 1 && (
                        <>
                            <Pressable style={[styles.fullscreenArrow, styles.fullscreenArrowLeft]} onPress={() => navigateFullscreen('prev')}>
                                <Text style={styles.fullscreenArrowText}>‹</Text>
                            </Pressable>
                            <Pressable style={[styles.fullscreenArrow, styles.fullscreenArrowRight]} onPress={() => navigateFullscreen('next')}>
                                <Text style={styles.fullscreenArrowText}>›</Text>
                            </Pressable>
                        </>
                    )}
                    {/* Fullscreen save/share */}
                    {fullscreenSlot?.status === 'success' && (
                        <View style={styles.fullscreenActions}>
                            <Pressable style={styles.fullscreenActionBtn} onPress={() => saveImage(fullscreenSlot.resultImageUri, fullscreenSlot.carpet.name)}>
                                <Text style={styles.fullscreenActionText}>💾 Kaydet</Text>
                            </Pressable>
                            <Pressable style={styles.fullscreenActionBtn} onPress={() => shareImage(fullscreenSlot.resultImageUri, fullscreenSlot.carpet.name)}>
                                <Text style={styles.fullscreenActionText}>📤 Paylaş</Text>
                            </Pressable>
                        </View>
                    )}
                </View>
            </Modal>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: COLORS.background,
        width: '100%',
    },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: SPACING.md,
        paddingTop: isWeb ? SPACING.lg : SPACING.xxl,
        paddingBottom: SPACING.sm,
        width: '100%',
    },
    brandTitleWrap: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
    },
    headerBadge: {
        backgroundColor: 'rgba(200, 134, 10, 0.16)',
        borderWidth: 1,
        borderColor: 'rgba(200, 134, 10, 0.45)',
        borderRadius: 6,
        paddingHorizontal: 6,
        paddingVertical: 2,
    },
    headerBadgeText: {
        fontSize: 10,
        fontWeight: '800',
        color: COLORS.primaryLight,
        letterSpacing: 0.5,
        textTransform: 'uppercase',
    },
    backBtn: {
        paddingVertical: SPACING.xs,
        paddingRight: SPACING.sm,
    },
    backBtnText: {
        color: COLORS.primary,
        fontSize: 16,
        fontWeight: '600',
    },
    title: {
        fontSize: 20,
        fontWeight: '800',
        color: COLORS.text,
    },

    // Progress bar
    progressBar: {
        paddingHorizontal: SPACING.md,
        paddingBottom: SPACING.sm,
    },
    progressText: {
        color: COLORS.textSecondary,
        fontSize: 12,
        fontWeight: '600',
        marginBottom: 6,
    },
    progressTrack: {
        height: 4,
        backgroundColor: COLORS.surface,
        borderRadius: 2,
        overflow: 'hidden',
    },
    progressFill: {
        height: '100%',
        backgroundColor: COLORS.primary,
        borderRadius: 2,
    },

    // Results scroll
    resultScroll: {
        flex: 1,
        paddingHorizontal: SPACING.md,
    },
    resultScrollContent: {
        paddingBottom: SPACING.xxl,
    },
    resultScrollContentWeb: {
        maxWidth: 1120,
        alignSelf: 'center',
        width: '100%',
    },

    // Grid
    resultGrid: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        justifyContent: 'space-between',
        gap: SPACING.sm,
        marginBottom: SPACING.md,
    },
    resultGridSingle: {
        flexDirection: 'column',
    },

    // Render card
    renderCard: {
        backgroundColor: COLORS.surface,
        borderRadius: RADIUS.xl,
        overflow: 'hidden',
        borderWidth: 1,
        borderColor: COLORS.border,
        marginBottom: SPACING.sm,
    },
    renderCardLoading: {
        padding: SPACING.lg,
        alignItems: 'center',
        justifyContent: 'center',
        minHeight: 220,
    },
    renderCardError: {
        padding: SPACING.lg,
        alignItems: 'center',
        justifyContent: 'center',
        minHeight: 180,
        borderColor: (COLORS.error || '#F44336') + '40',
    },
    renderCardSuccess: {},

    // Card loading
    cardLoadingMsg: {
        color: COLORS.primary,
        fontSize: 13,
        textAlign: 'center',
        marginBottom: SPACING.md,
        minHeight: 18,
    },
    cardThumb: {
        width: 48,
        height: 48,
        borderRadius: RADIUS.md,
        marginBottom: SPACING.xs,
    },
    cardCarpetName: {
        color: COLORS.textSecondary,
        fontSize: 12,
        fontWeight: '600',
        textAlign: 'center',
    },
    cardSubtext: {
        color: COLORS.textMuted,
        fontSize: 11,
        marginTop: 2,
    },

    // Card error
    cardErrorIcon: {
        fontSize: 32,
        marginBottom: SPACING.sm,
    },
    cardErrorTitle: {
        color: COLORS.text,
        fontSize: 14,
        fontWeight: '700',
        marginBottom: 4,
    },
    cardErrorMsg: {
        color: COLORS.textSecondary,
        fontSize: 12,
        textAlign: 'center',
        marginBottom: SPACING.md,
    },
    cardRetryBtn: {
        backgroundColor: COLORS.primary,
        borderRadius: RADIUS.md,
        paddingHorizontal: SPACING.md,
        paddingVertical: 6,
        marginBottom: SPACING.sm,
    },
    cardRetryBtnHover: {
        backgroundColor: COLORS.primaryLight,
    },
    cardRetryBtnText: {
        color: COLORS.white,
        fontSize: 13,
        fontWeight: '700',
    },

    // Card success
    cardImageWrap: {
        width: '100%',
        position: 'relative',
    },
    cardImage: {
        width: '100%',
        aspectRatio: 1,
    },
    cardZoomBadge: {
        position: 'absolute',
        left: 8,
        top: 8,
        backgroundColor: 'rgba(0,0,0,0.58)',
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.2)',
        paddingHorizontal: 8,
        paddingVertical: 4,
        borderRadius: RADIUS.sm,
    },
    cardZoomText: {
        color: COLORS.text,
        fontSize: 11,
        fontWeight: '700',
    },

    // Card info row
    cardInfoRow: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: SPACING.sm,
        gap: SPACING.xs,
    },
    cardInfoThumb: {
        width: 36,
        height: 36,
        borderRadius: RADIUS.sm,
    },
    cardInfoText: {
        flex: 1,
        minWidth: 0,
    },
    cardInfoBrand: {
        color: COLORS.primary,
        fontSize: 10,
        fontWeight: '700',
    },
    cardInfoName: {
        color: COLORS.text,
        fontSize: 12,
        fontWeight: '600',
    },
    cardActionBtn: {
        width: 34,
        height: 34,
        borderRadius: RADIUS.md,
        backgroundColor: COLORS.surfaceElevated,
        alignItems: 'center',
        justifyContent: 'center',
        borderWidth: 1,
        borderColor: COLORS.border,
    },
    cardActionBtnHover: {
        borderColor: '#3F3F3F',
        backgroundColor: '#2A2A2A',
    },
    cardActionIcon: {
        fontSize: 16,
    },

    // Nav buttons
    navBtn: {
        backgroundColor: COLORS.surfaceElevated,
        borderRadius: RADIUS.lg,
        paddingVertical: SPACING.md,
        alignItems: 'center',
        marginBottom: SPACING.sm,
        borderWidth: 1,
        borderColor: COLORS.border,
    },
    navBtnHover: {
        backgroundColor: '#2D2D2D',
    },
    navBtnText: {
        color: COLORS.textSecondary,
        fontSize: 15,
        fontWeight: '600',
    },
    navBtnPrimary: {
        backgroundColor: COLORS.primary,
        borderRadius: RADIUS.lg,
        paddingVertical: SPACING.md,
        alignItems: 'center',
        marginBottom: SPACING.xxl,
        shadowColor: COLORS.primary,
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.4,
        shadowRadius: 8,
        elevation: 6,
    },
    navBtnPrimaryHover: {
        backgroundColor: COLORS.primaryLight,
    },
    navBtnPrimaryText: {
        color: COLORS.white,
        fontSize: 16,
        fontWeight: '700',
    },

    // Fullscreen modal
    fullscreenOverlay: {
        flex: 1,
        backgroundColor: '#000',
    },
    fullscreenScroll: {
        flex: 1,
    },
    fullscreenScrollContent: {
        flexGrow: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },
    fullscreenImage: {
        width: screenWidth,
    },
    fullscreenCloseBtn: {
        position: 'absolute',
        right: SPACING.md,
        top: isWeb ? SPACING.lg : SPACING.xxl,
        zIndex: 10,
        backgroundColor: 'rgba(0,0,0,0.72)',
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.25)',
        borderRadius: RADIUS.md,
        paddingHorizontal: SPACING.md,
        paddingVertical: SPACING.xs,
    },
    fullscreenCloseBtnText: {
        color: COLORS.white,
        fontSize: 14,
        fontWeight: '700',
    },
    fullscreenInfoBar: {
        position: 'absolute',
        bottom: 80,
        left: 0,
        right: 0,
        alignItems: 'center',
    },
    fullscreenInfoText: {
        color: COLORS.white,
        fontSize: 14,
        fontWeight: '600',
        backgroundColor: 'rgba(0,0,0,0.6)',
        paddingHorizontal: SPACING.md,
        paddingVertical: SPACING.xs,
        borderRadius: RADIUS.md,
    },
    fullscreenArrow: {
        position: 'absolute',
        top: '45%',
        width: 44,
        height: 44,
        borderRadius: 22,
        backgroundColor: 'rgba(0,0,0,0.6)',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 10,
    },
    fullscreenArrowLeft: {
        left: SPACING.sm,
    },
    fullscreenArrowRight: {
        right: SPACING.sm,
    },
    fullscreenArrowText: {
        color: COLORS.white,
        fontSize: 28,
        fontWeight: '700',
        lineHeight: 32,
    },
    fullscreenActions: {
        position: 'absolute',
        bottom: 24,
        left: 0,
        right: 0,
        flexDirection: 'row',
        justifyContent: 'center',
        gap: SPACING.md,
    },
    fullscreenActionBtn: {
        backgroundColor: 'rgba(0,0,0,0.7)',
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.25)',
        borderRadius: RADIUS.lg,
        paddingHorizontal: SPACING.lg,
        paddingVertical: SPACING.sm,
    },
    fullscreenActionText: {
        color: COLORS.white,
        fontSize: 14,
        fontWeight: '700',
    },
});
