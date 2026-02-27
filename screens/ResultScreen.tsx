import React, { useState, useEffect } from 'react';
import {
    View,
    Text,
    StyleSheet,
    TouchableOpacity,
    Pressable,
    Image,
    Alert,
    StatusBar,
    Dimensions,
    ActivityIndicator,
    ScrollView,
    Share,
    Platform,
    Modal,
} from 'react-native';
import * as MediaLibrary from 'expo-media-library';
import * as Sharing from 'expo-sharing';
import { COLORS, SPACING, RADIUS } from '../constants/theme';
import { placeCarperInRoom, PlacementMode, PlacementResult } from '../services/openai';
import { getCarpetFullUrl, getCarpetThumbnailUrl } from '../services/carpet-image';

const { width, height } = Dimensions.get('window');
const isWeb = Platform.OS === 'web';

interface ResultScreenProps {
    navigation: any;
    route: any;
}

type Status = 'loading' | 'success' | 'error' | 'limit';

const LOADING_MESSAGES = [
    '🎨 Halı deseni analiz ediliyor...',
    '📐 Oda perspektifi hesaplanıyor...',
    '✨ AI yerleştirme yapılıyor...',
    '🖼️ Görsel oluşturuluyor...',
    '🔍 Son rötuşlar yapılıyor...',
];

function mapErrorTitle(code: PlacementResult['errorCode']) {
    switch (code) {
        case 'AUTH':
            return 'Oturum Gerekli';
        case 'BILLING':
            return 'Servis Kotası Doldu';
        case 'API_KEY':
            return 'Servis Ayarı Hatası';
        case 'NETWORK':
            return 'Bağlantı Hatası';
        case 'RATE_LIMIT':
            return 'Yoğunluk Nedeniyle Bekleme';
        default:
            return 'Bir Hata Oluştu';
    }
}

export default function ResultScreen({ navigation, route }: ResultScreenProps) {
    const { roomImageUri, carpet, mode, customerNote } = route.params;
    const placementMode: PlacementMode = mode || 'normal';
    const [status, setStatus] = useState<Status>('loading');
    const [resultImageUri, setResultImageUri] = useState<string>('');
    const [errorMessage, setErrorMessage] = useState<string>('');
    const [errorCode, setErrorCode] = useState<PlacementResult['errorCode']>('UNKNOWN');
    const [loadingMsgIndex, setLoadingMsgIndex] = useState(0);
    const [imageAspectRatio, setImageAspectRatio] = useState(1.45);
    const [isFullscreenOpen, setIsFullscreenOpen] = useState(false);
    const [isCarpetModalOpen, setIsCarpetModalOpen] = useState(false);

    useEffect(() => {
        // Cycle loading messages
        const interval = setInterval(() => {
            setLoadingMsgIndex(i => (i + 1) % LOADING_MESSAGES.length);
        }, 2500);
        return () => clearInterval(interval);
    }, []);

    useEffect(() => {
        processImage();
    }, []);

    useEffect(() => {
        if (!resultImageUri) return;
        Image.getSize(
            resultImageUri,
            (w, h) => {
                if (w > 0 && h > 0) {
                    setImageAspectRatio(w / h);
                }
            },
            () => {
                setImageAspectRatio(1.45);
            }
        );
    }, [resultImageUri]);

    const processImage = async () => {
        try {
            setStatus('loading');
            setErrorCode('UNKNOWN');
            if (!carpet?.imagePath) {
                throw new Error('Seçilen halı görseli bulunamadı.');
            }
            // Custom carpet: imagePath is already a blob URL — don't run it through CDN transform
            const carpetUri = carpet.id === '__custom__'
                ? carpet.imagePath
                : getCarpetFullUrl(carpet.imagePath);
            const result = await placeCarperInRoom(roomImageUri, carpetUri, carpet.name, placementMode, customerNote);

            if (result.success && result.imageUrl) {
                setResultImageUri(result.imageUrl);
                setStatus('success');
            } else {
                const nextErrorMessage = result.error || 'Bilinmeyen hata';
                setErrorMessage(nextErrorMessage);
                setErrorCode(result.errorCode || 'UNKNOWN');
                setStatus(result.errorCode === 'RENDER_LIMIT' ? 'limit' : 'error');
            }
        } catch (err: any) {
            const nextErrorMessage = err.message || 'Bir hata oluştu';
            setErrorMessage(nextErrorMessage);
            setErrorCode('NETWORK');
            setStatus('error');
        }
    };

    const handleSave = async () => {
        try {
            if (Platform.OS === 'web') {
                // data: URI'yi blob URL'ye çevir — Chrome 60+ data URI download engeller
                const response = await fetch(resultImageUri);
                const blob = await response.blob();
                const blobUrl = URL.createObjectURL(blob);
                const link = document.createElement('a');
                link.href = blobUrl;
                link.download = `hali-sonuc-${Date.now()}.png`;
                document.body.appendChild(link);
                link.click();
                document.body.removeChild(link);
                setTimeout(() => URL.revokeObjectURL(blobUrl), 10000);
                return;
            }
            const { status: permStatus } = await MediaLibrary.requestPermissionsAsync();
            if (permStatus !== 'granted' && permStatus !== 'limited') {
                Alert.alert('İzin Gerekli', 'Fotoğraf kaydetmek için galeri iznine ihtiyaç var.');
                return;
            }
            await MediaLibrary.saveToLibraryAsync(resultImageUri);
            Alert.alert('✅ Kaydedildi', 'Görsel galerinize kaydedildi.');
        } catch (err) {
            Alert.alert('Hata', 'Görsel kaydedilemedi.');
        }
    };

    const handleShare = async () => {
        try {
            if (isWeb) {
                const nav: any = navigator;
                const response = await fetch(resultImageUri);
                const blob = await response.blob();
                const file = new File([blob], `hali-sonuc-${Date.now()}.png`, { type: blob.type || 'image/png' });

                if (nav?.canShare?.({ files: [file] }) && nav?.share) {
                    await nav.share({
                        title: `${carpet.name} - HALI`,
                        text: `${carpet.name} sonucu`,
                        files: [file],
                    });
                    return;
                }
                Alert.alert('Paylaşım', 'Tarayıcı doğrudan paylaşımı desteklemiyor. Kaydet ile indirip WhatsApp\'tan paylaşabilirsin.');
                return;
            }

            // Native: expo-sharing ile paylaş (iOS + Android ikisinde de çalışır)
            const canShare = await Sharing.isAvailableAsync();
            if (canShare) {
                await Sharing.shareAsync(resultImageUri, {
                    mimeType: 'image/png',
                    dialogTitle: `${carpet.name} - HALI`,
                });
            } else {
                Alert.alert('Hata', 'Bu cihazda paylaşım desteklenmiyor.');
            }
        } catch (err) {
            Alert.alert('Hata', 'Paylaşım başarısız.');
        }
    };

    const carpetThumbUri = carpet?.id === '__custom__'
        ? (carpet?.imagePath || '')
        : (carpet?.imagePath
            ? getCarpetThumbnailUrl(carpet.imagePath, carpet.thumbPath, 320, 68)
            : '');

    const carpetFullUri = carpet?.id === '__custom__'
        ? (carpet?.imagePath || '')
        : (carpet?.imagePath ? getCarpetFullUrl(carpet.imagePath) : '');

    return (
        <View style={styles.container}>
            <StatusBar barStyle="light-content" backgroundColor={COLORS.background} />

            {/* Header */}
            <View style={styles.header}>
                <Pressable onPress={() => navigation.goBack()} style={({ hovered }: any) => [styles.backBtn, hovered && styles.backBtnHover]}>
                    <Text style={styles.backBtnText}>← Geri</Text>
                </Pressable>
                <View style={styles.brandTitleWrap}>
                    <Text style={styles.title}>HALI</Text>
                    <View style={styles.headerBadge}>
                        <Text style={styles.headerBadgeText}>YERLEŞTİR</Text>
                    </View>
                </View>
                <View style={{ width: 60 }} />
            </View>

            {/* Content */}
            {status === 'loading' && (
                <View style={styles.loadingContainer}>
                    <View style={styles.loadingCard}>
                        <View style={styles.loadingIconContainer}>
                            <ActivityIndicator size="large" color={COLORS.primary} />
                        </View>
                        <Text style={styles.loadingTitle}>Halı Yerleştirme</Text>
                        <Text style={styles.loadingMessage}>{LOADING_MESSAGES[loadingMsgIndex]}</Text>
                        <View style={styles.carpetPreviewRow}>
                            <Image source={{ uri: roomImageUri }} style={styles.previewThumb} resizeMode="cover" />
                            <Text style={styles.plusSign}>+</Text>
                            {carpetThumbUri ? (
                                <Image source={{ uri: carpetThumbUri }} style={styles.previewThumb} resizeMode="cover" />
                            ) : (
                                <View style={[styles.previewThumb, styles.previewThumbFallback]} />
                            )}
                            <Text style={styles.arrowSign}>→</Text>
                            <View style={styles.resultThumbPlaceholder}>
                                <ActivityIndicator size="small" color={COLORS.primary} />
                            </View>
                        </View>
                        <Text style={styles.loadingSubtext}>Bu işlem genelde 20-70 saniye sürer</Text>
                    </View>
                </View>
            )}

            {status === 'success' && (
                <ScrollView
                    style={styles.successContainer}
                    contentContainerStyle={[styles.successContent, isWeb && styles.successContentWeb]}
                    showsVerticalScrollIndicator={false}
                    alwaysBounceHorizontal={false}
                    bounces={false}
                    overScrollMode="never"
                >
                    {/* Result Image */}
                    <View style={styles.resultImageContainer}>
                        <Pressable
                            onPress={() => setIsFullscreenOpen(true)}
                            style={({ hovered }: any) => [styles.resultImagePressable, hovered && styles.resultImagePressableHover]}
                        >
                            <Image
                                source={{ uri: resultImageUri }}
                                style={[
                                    styles.resultImage,
                                    {
                                        aspectRatio: imageAspectRatio,
                                        maxHeight: isWeb ? Math.min(height * 0.62, 640) : width * 1.2,
                                    },
                                ]}
                                resizeMode="contain"
                            />
                        </Pressable>
                        <View style={styles.resultBadge}>
                            <Text style={styles.resultBadgeText}>HALI</Text>
                        </View>
                        <Pressable
                            style={({ hovered }: any) => [styles.fullscreenBtn, hovered && styles.fullscreenBtnHover]}
                            onPress={() => setIsFullscreenOpen(true)}
                        >
                            <Text style={styles.fullscreenBtnText}>Tam ekran</Text>
                        </Pressable>
                    </View>

                    {/* Carpet Info */}
                    <View style={styles.carpetInfoCard}>
                        <Pressable onPress={() => setIsCarpetModalOpen(true)} style={styles.carpetThumbWrap}>
                            {carpetThumbUri ? (
                                <Image source={{ uri: carpetThumbUri }} style={styles.carpetThumb} resizeMode="cover" />
                            ) : (
                                <View style={[styles.carpetThumb, styles.previewThumbFallback]} />
                            )}
                            <View style={styles.carpetThumbZoomBadge}>
                                <Text style={styles.carpetThumbZoomText}>⛶</Text>
                            </View>
                        </Pressable>
                        <View style={styles.carpetDetails}>
                            {carpet.brand ? (
                                <View style={styles.carpetCodeBadge}>
                                    <Text style={styles.carpetCode}>{carpet.brand}</Text>
                                </View>
                            ) : null}
                            <Text style={styles.carpetName}>{carpet.id} {carpet.name}</Text>
                            {(carpet.size || carpet.material) ? (
                                <Text style={styles.carpetMeta}>
                                    {[carpet.size, carpet.material].filter(Boolean).join(' · ')}
                                </Text>
                            ) : null}
                        </View>
                    </View>

                    {/* Action Buttons */}
                    <View style={styles.actionRow}>
                        <Pressable style={({ hovered }: any) => [styles.actionBtn, hovered && styles.actionBtnHover]} onPress={handleSave}>
                            <Text style={styles.actionBtnIcon}>💾</Text>
                            <Text style={styles.actionBtnText}>Kaydet</Text>
                        </Pressable>
                        <Pressable style={({ hovered }: any) => [styles.actionBtn, hovered && styles.actionBtnHover]} onPress={handleShare}>
                            <Text style={styles.actionBtnIcon}>📤</Text>
                            <Text style={styles.actionBtnText}>Paylaş</Text>
                        </Pressable>
                    </View>

                    {/* Try another carpet */}
                    <Pressable
                        style={({ hovered }: any) => [styles.retryBtn, hovered && styles.retryBtnHover]}
                        onPress={() => navigation.goBack()}
                    >
                        <Text style={styles.retryBtnText}>← Başka halı dene</Text>
                    </Pressable>

                    {/* New Search */}
                    <Pressable
                        style={({ hovered }: any) => [styles.newSearchBtn, hovered && styles.newSearchBtnHover]}
                        onPress={() => navigation.navigate('Home')}
                    >
                        <Text style={styles.newSearchBtnText}>🏠 Yeni Müşteri</Text>
                    </Pressable>
                </ScrollView>
            )}

            {status === 'error' && (
                <View style={styles.errorContainer}>
                    <View style={styles.errorCard}>
                        <Text style={styles.errorIcon}>⚠️</Text>
                        <Text style={styles.errorTitle}>{mapErrorTitle(errorCode)}</Text>
                        <Text style={styles.errorMessage}>{errorMessage}</Text>
                        <Pressable style={({ hovered }: any) => [styles.retryBtnLarge, hovered && styles.retryBtnLargeHover]} onPress={processImage}>
                            <Text style={styles.retryBtnLargeText}>🔄 Tekrar Dene</Text>
                        </Pressable>
                        <Pressable
                            style={({ hovered }: any) => [styles.backBtnLarge, hovered && styles.backBtnLargeHover]}
                            onPress={() => navigation.goBack()}
                        >
                            <Text style={styles.backBtnLargeText}>← Halı Seçimine Dön</Text>
                        </Pressable>
                    </View>
                </View>
            )}

            {status === 'limit' && (
                <View style={styles.errorContainer}>
                    <View style={styles.errorCard}>
                        <Text style={styles.errorTitle}>Günlük limit doldu</Text>
                        <Text style={styles.errorMessage}>
                            Render hakkınız bu oturum için tükenmiş görünüyor. Yarın tekrar deneyin ya da paket limitini artırın.
                        </Text>
                        <Pressable style={({ hovered }: any) => [styles.retryBtnLarge, hovered && styles.retryBtnLargeHover]} onPress={() => navigation.goBack()}>
                            <Text style={styles.retryBtnLargeText}>Halı seçimine dön</Text>
                        </Pressable>
                        <Pressable
                            style={({ hovered }: any) => [styles.backBtnLarge, hovered && styles.backBtnLargeHover]}
                            onPress={() => navigation.navigate('Home')}
                        >
                            <Text style={styles.backBtnLargeText}>Ana sayfaya git</Text>
                        </Pressable>
                    </View>
                </View>
            )}

            <Modal
                visible={isFullscreenOpen}
                animationType="fade"
                transparent
                onRequestClose={() => setIsFullscreenOpen(false)}
            >
                <View style={styles.fullscreenOverlay}>
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
                            source={{ uri: resultImageUri }}
                            style={[styles.fullscreenImage, { aspectRatio: imageAspectRatio }]}
                            resizeMode="contain"
                        />
                    </ScrollView>
                    <Pressable style={styles.fullscreenCloseBtn} onPress={() => setIsFullscreenOpen(false)}>
                        <Text style={styles.fullscreenCloseBtnText}>✕ Kapat</Text>
                    </Pressable>
                </View>
            </Modal>

            {/* Carpet Fullscreen Modal */}
            <Modal
                visible={isCarpetModalOpen}
                animationType="fade"
                transparent
                onRequestClose={() => setIsCarpetModalOpen(false)}
            >
                <View style={styles.fullscreenOverlay}>
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
                        {carpetFullUri ? (
                            <Image
                                source={{ uri: carpetFullUri }}
                                style={styles.carpetFullscreenImage}
                                resizeMode="contain"
                            />
                        ) : null}
                    </ScrollView>
                    <Pressable style={styles.fullscreenCloseBtn} onPress={() => setIsCarpetModalOpen(false)}>
                        <Text style={styles.fullscreenCloseBtnText}>✕ Kapat</Text>
                    </Pressable>
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
        paddingBottom: SPACING.md,
        width: '100%',
    },
    brandTitleWrap: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        flexShrink: 1,
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
    backBtnHover: {
        opacity: 0.85,
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
    titleAccent: {
        color: COLORS.primary,
    },
    // Loading
    loadingContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        paddingHorizontal: SPACING.md,
        width: '100%',
    },
    loadingCard: {
        backgroundColor: COLORS.surface,
        borderRadius: RADIUS.xl,
        padding: SPACING.xl,
        alignItems: 'center',
        width: '100%',
        borderWidth: 1,
        borderColor: COLORS.border,
    },
    loadingIconContainer: {
        width: 72,
        height: 72,
        borderRadius: 36,
        backgroundColor: COLORS.surfaceElevated,
        alignItems: 'center',
        justifyContent: 'center',
        marginBottom: SPACING.lg,
    },
    loadingTitle: {
        fontSize: 22,
        fontWeight: '800',
        color: COLORS.text,
        marginBottom: SPACING.sm,
    },
    loadingMessage: {
        fontSize: 15,
        color: COLORS.primary,
        marginBottom: SPACING.xl,
        textAlign: 'center',
        minHeight: 22,
    },
    carpetPreviewRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: SPACING.sm,
        marginBottom: SPACING.lg,
    },
    previewThumb: {
        width: 64,
        height: 64,
        borderRadius: RADIUS.md,
    },
    previewThumbFallback: {
        backgroundColor: COLORS.surfaceElevated,
    },
    plusSign: {
        color: COLORS.textSecondary,
        fontSize: 20,
        fontWeight: '700',
    },
    arrowSign: {
        color: COLORS.primary,
        fontSize: 20,
        fontWeight: '700',
    },
    resultThumbPlaceholder: {
        width: 64,
        height: 64,
        borderRadius: RADIUS.md,
        backgroundColor: COLORS.surfaceElevated,
        alignItems: 'center',
        justifyContent: 'center',
        borderWidth: 2,
        borderColor: COLORS.primary,
        borderStyle: 'dashed',
    },
    loadingSubtext: {
        color: COLORS.textMuted,
        fontSize: 13,
    },
    // Success
    successContainer: {
        flex: 1,
        paddingHorizontal: SPACING.md,
        width: '100%',
    },
    successContent: {
        paddingBottom: SPACING.xxl,
    },
    successContentWeb: {
        width: '100%',
        maxWidth: 1120,
        alignSelf: 'center',
        paddingBottom: SPACING.xxl * 2,
    },
    resultImageContainer: {
        borderRadius: RADIUS.xl,
        overflow: 'hidden',
        marginBottom: SPACING.md,
        position: 'relative',
        backgroundColor: COLORS.surface,
        borderWidth: 1,
        borderColor: COLORS.border,
    },
    resultImagePressable: {
        width: '100%',
        backgroundColor: COLORS.surface,
    },
    resultImagePressableHover: {
        backgroundColor: '#1f1f1f',
    },
    resultImage: {
        width: '100%',
    },
    resultBadge: {
        position: 'absolute',
        top: 12,
        right: 12,
        backgroundColor: 'rgba(200, 134, 10, 0.9)',
        paddingHorizontal: 12,
        paddingVertical: 6,
        borderRadius: RADIUS.full,
    },
    resultBadgeClipdrop: {
        backgroundColor: 'rgba(45, 125, 70, 0.9)',
    },
    resultBadgeText: {
        color: COLORS.white,
        fontSize: 13,
        fontWeight: '700',
    },
    fullscreenBtn: {
        position: 'absolute',
        left: 12,
        top: 12,
        backgroundColor: 'rgba(0,0,0,0.58)',
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.2)',
        paddingHorizontal: 10,
        paddingVertical: 6,
        borderRadius: RADIUS.md,
    },
    fullscreenBtnHover: {
        backgroundColor: 'rgba(0,0,0,0.72)',
    },
    fullscreenBtnText: {
        color: COLORS.text,
        fontSize: 12,
        fontWeight: '700',
    },
    carpetInfoCard: {
        flexDirection: 'row',
        backgroundColor: COLORS.surface,
        borderRadius: RADIUS.lg,
        padding: SPACING.md,
        marginBottom: SPACING.md,
        gap: SPACING.md,
        alignItems: 'center',
    },
    carpetThumbWrap: {
        position: 'relative',
        width: 68,
        height: 68,
    },
    carpetThumb: {
        width: 68,
        height: 68,
        borderRadius: RADIUS.md,
    },
    carpetThumbZoomBadge: {
        position: 'absolute',
        bottom: 3,
        right: 3,
        backgroundColor: 'rgba(0,0,0,0.6)',
        borderRadius: 4,
        paddingHorizontal: 3,
        paddingVertical: 1,
    },
    carpetThumbZoomText: {
        color: '#fff',
        fontSize: 10,
    },
    carpetDetails: {
        flex: 1,
    },
    carpetCodeBadge: {
        backgroundColor: COLORS.surfaceElevated,
        borderRadius: RADIUS.sm,
        paddingHorizontal: 6,
        paddingVertical: 2,
        alignSelf: 'flex-start',
        marginBottom: 4,
    },
    carpetCode: {
        color: COLORS.primary,
        fontSize: 11,
        fontWeight: '700',
        letterSpacing: 0.5,
    },
    carpetName: {
        color: COLORS.text,
        fontSize: 16,
        fontWeight: '700',
        marginBottom: 2,
    },
    carpetMeta: {
        color: COLORS.textSecondary,
        fontSize: 13,
    },
    actionRow: {
        flexDirection: 'row',
        gap: SPACING.sm,
        marginBottom: SPACING.sm,
    },
    actionBtn: {
        flex: 1,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: COLORS.surface,
        borderRadius: RADIUS.lg,
        paddingVertical: SPACING.md,
        gap: 8,
        borderWidth: 1,
        borderColor: COLORS.border,
    },
    actionBtnHover: {
        borderColor: '#3F3F3F',
        backgroundColor: '#232323',
    },
    actionBtnIcon: {
        fontSize: 20,
    },
    actionBtnText: {
        color: COLORS.text,
        fontSize: 15,
        fontWeight: '600',
    },
    retryBtn: {
        backgroundColor: COLORS.surfaceElevated,
        borderRadius: RADIUS.lg,
        paddingVertical: SPACING.md,
        alignItems: 'center',
        marginBottom: SPACING.sm,
        borderWidth: 1,
        borderColor: COLORS.border,
    },
    retryBtnHover: {
        backgroundColor: '#2D2D2D',
    },
    retryBtnText: {
        color: COLORS.textSecondary,
        fontSize: 15,
        fontWeight: '600',
    },
    newSearchBtn: {
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
    newSearchBtnHover: {
        backgroundColor: COLORS.primaryLight,
    },
    newSearchBtnText: {
        color: COLORS.white,
        fontSize: 16,
        fontWeight: '700',
    },
    // Error
    errorContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        paddingHorizontal: SPACING.md,
    },
    errorCard: {
        backgroundColor: COLORS.surface,
        borderRadius: RADIUS.xl,
        padding: SPACING.xl,
        alignItems: 'center',
        width: '100%',
        borderWidth: 1,
        borderColor: COLORS.error + '40',
    },
    errorIcon: {
        fontSize: 56,
        marginBottom: SPACING.md,
    },
    errorTitle: {
        fontSize: 22,
        fontWeight: '800',
        color: COLORS.text,
        marginBottom: SPACING.sm,
    },
    errorMessage: {
        fontSize: 14,
        color: COLORS.textSecondary,
        textAlign: 'center',
        lineHeight: 20,
        marginBottom: SPACING.xl,
    },
    retryBtnLarge: {
        backgroundColor: COLORS.primary,
        borderRadius: RADIUS.lg,
        paddingVertical: SPACING.md,
        paddingHorizontal: SPACING.xl,
        marginBottom: SPACING.sm,
        width: '100%',
        alignItems: 'center',
    },
    retryBtnLargeHover: {
        backgroundColor: COLORS.primaryLight,
    },
    retryBtnLargeText: {
        color: COLORS.white,
        fontSize: 16,
        fontWeight: '700',
    },
    backBtnLarge: {
        paddingVertical: SPACING.md,
        width: '100%',
        alignItems: 'center',
    },
    backBtnLargeHover: {
        opacity: 0.8,
    },
    backBtnLargeText: {
        color: COLORS.textSecondary,
        fontSize: 15,
        fontWeight: '600',
    },
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
        width: width,
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
    carpetFullscreenImage: {
        width: width,
        height: width,
    },
});
