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
import { COLORS, SPACING, RADIUS } from '../constants/theme';
import { placeCarperInRoom, PlacementMode, PlacementResult } from '../services/openai';
import { getStorageClient } from '../services/storage';
import { getCarpetFullUrl, getCarpetThumbnailUrl } from '../services/carpet-image';

const { width, height } = Dimensions.get('window');
const isWeb = Platform.OS === 'web';

interface ResultScreenProps {
    navigation: any;
    route: any;
}

type Status = 'loading' | 'success' | 'error' | 'limit';
type CloudStatus = 'idle' | 'uploading' | 'uploaded' | 'failed';

const LOADING_MESSAGES = [
    '🎨 Halı deseni analiz ediliyor...',
    '📐 Oda perspektifi hesaplanıyor...',
    '✨ AI yerleştirme yapılıyor...',
    '🖼️ Görsel oluşturuluyor...',
    '🔍 Son rötuşlar yapılıyor...',
];

const RENDER_TIMEOUT_MS = 70000;

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

async function runRenderWithTimeout(
    promise: Promise<PlacementResult>,
    timeoutMs = RENDER_TIMEOUT_MS
): Promise<PlacementResult> {
    let timer: any;
    const timeoutPromise = new Promise<PlacementResult>((resolve) => {
        timer = setTimeout(() => {
            resolve({
                imageUrl: '',
                success: false,
                errorCode: 'NETWORK',
                error: 'İşlem zaman aşımına uğradı. Lütfen tekrar deneyin.',
            });
        }, timeoutMs);
    });
    const result = await Promise.race([promise, timeoutPromise]);
    clearTimeout(timer);
    return result;
}

export default function ResultScreen({ navigation, route }: ResultScreenProps) {
    const { roomImageUri, carpet, mode } = route.params;
    const placementMode: PlacementMode = mode || 'normal';
    const [status, setStatus] = useState<Status>('loading');
    const [resultImageUri, setResultImageUri] = useState<string>('');
    const [cloudImageUrl, setCloudImageUrl] = useState<string>('');
    const [cloudStatus, setCloudStatus] = useState<CloudStatus>('idle');
    const [cloudErrorMessage, setCloudErrorMessage] = useState('');
    const [errorMessage, setErrorMessage] = useState<string>('');
    const [errorCode, setErrorCode] = useState<PlacementResult['errorCode']>('UNKNOWN');
    const [loadingMsgIndex, setLoadingMsgIndex] = useState(0);
    const [imageAspectRatio, setImageAspectRatio] = useState(1.45);
    const [isFullscreenOpen, setIsFullscreenOpen] = useState(false);

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
            setCloudStatus('idle');
            setCloudImageUrl('');
            setCloudErrorMessage('');
            setErrorCode('UNKNOWN');
            if (!carpet?.imagePath) {
                throw new Error('Seçilen halı görseli bulunamadı.');
            }
            const carpetUri = getCarpetFullUrl(carpet.imagePath);
            const result = await runRenderWithTimeout(
                placeCarperInRoom(roomImageUri, carpetUri, carpet.name, placementMode)
            );

            if (result.success && result.imageUrl) {
                setResultImageUri(result.imageUrl);
                setStatus('success');
                void uploadResultToCloud(result.imageUrl);
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

    const uploadResultToCloud = async (localUri: string) => {
        try {
            setCloudStatus('uploading');
            const client = getStorageClient();
            const uploaded = await client.uploadImage(localUri, { folder: 'hali-ai/results' });
            setCloudImageUrl(uploaded.url);
            setCloudStatus('uploaded');
        } catch (err: any) {
            setCloudErrorMessage(err?.message || 'Cloud upload başarısız');
            setCloudStatus('failed');
        }
    };

    const handleSave = async () => {
        try {
            if (Platform.OS === 'web') {
                const link = document.createElement('a');
                link.href = resultImageUri;
                link.download = `hali-sonuc-${Date.now()}.png`;
                document.body.appendChild(link);
                link.click();
                document.body.removeChild(link);
                return;
            }
            const { status: permStatus } = await MediaLibrary.requestPermissionsAsync();
            if (permStatus !== 'granted') {
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
            const shareUrl = cloudImageUrl || resultImageUri;
            await Share.share({ url: shareUrl, title: `${carpet.name} - Halıcı Gürsoylar` });
        } catch (err) {
            Alert.alert('Hata', 'Paylaşım başarısız.');
        }
    };

    const carpetThumbUri = carpet?.imagePath
        ? getCarpetThumbnailUrl(carpet.imagePath, carpet.thumbPath, 320, 68)
        : '';

    return (
        <View style={styles.container}>
            <StatusBar barStyle="light-content" backgroundColor={COLORS.background} />

            {/* Header */}
            <View style={styles.header}>
                <Pressable onPress={() => navigation.goBack()} style={({ hovered }: any) => [styles.backBtn, hovered && styles.backBtnHover]}>
                    <Text style={styles.backBtnText}>← Geri</Text>
                </Pressable>
                <View style={styles.brandTitleWrap}>
                    <Text style={styles.title}>Halı </Text>
                    <Text style={[styles.title, styles.titleAccent]}>AI</Text>
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
                        <Text style={styles.loadingTitle}>AI Yerleştirme</Text>
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
                            <Text style={styles.resultBadgeText}>HALI AI</Text>
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
                        {carpetThumbUri ? (
                            <Image source={{ uri: carpetThumbUri }} style={styles.carpetThumb} resizeMode="cover" />
                        ) : (
                            <View style={[styles.carpetThumb, styles.previewThumbFallback]} />
                        )}
                        <View style={styles.carpetDetails}>
                            <View style={styles.carpetCodeBadge}>
                                <Text style={styles.carpetCode}>{carpet.id}</Text>
                            </View>
                            <Text style={styles.carpetName}>{carpet.name}</Text>
                            <Text style={styles.carpetMeta}>{carpet.size} · {carpet.material}</Text>
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
                    <View style={styles.cloudStatusWrap}>
                        {cloudStatus === 'uploading' && <Text style={styles.cloudStatusText}>Buluta yükleniyor...</Text>}
                        {cloudStatus === 'uploaded' && <Text style={styles.cloudStatusTextSuccess}>Bulut URL hazır (paylaşım cloud link kullanır)</Text>}
                        {cloudStatus === 'failed' && <Text style={styles.cloudStatusTextError}>Bulut yükleme hatası: {cloudErrorMessage}</Text>}
                    </View>

                    {/* Retry */}
                    <Pressable style={({ hovered }: any) => [styles.retryBtn, hovered && styles.retryBtnHover]} onPress={processImage}>
                        <Text style={styles.retryBtnText}>🔄 Tekrar Oluştur</Text>
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
                    <Pressable style={styles.fullscreenCloseBtn} onPress={() => setIsFullscreenOpen(false)}>
                        <Text style={styles.fullscreenCloseBtnText}>Kapat</Text>
                    </Pressable>
                    <Image source={{ uri: resultImageUri }} style={styles.fullscreenImage} resizeMode="contain" />
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
        overflow: 'hidden',
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
    carpetThumb: {
        width: 60,
        height: 60,
        borderRadius: RADIUS.md,
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
    cloudStatusWrap: {
        marginBottom: SPACING.sm,
        minHeight: 20,
    },
    cloudStatusText: {
        color: COLORS.textSecondary,
        fontSize: 12,
    },
    cloudStatusTextSuccess: {
        color: '#9ed8b2',
        fontSize: 12,
    },
    cloudStatusTextError: {
        color: '#cc7b7b',
        fontSize: 12,
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
        backgroundColor: 'rgba(0, 0, 0, 0.96)',
        justifyContent: 'center',
        alignItems: 'center',
        padding: SPACING.md,
    },
    fullscreenImage: {
        width: '100%',
        height: '100%',
    },
    fullscreenCloseBtn: {
        position: 'absolute',
        right: SPACING.md,
        top: SPACING.xxl,
        zIndex: 10,
        backgroundColor: 'rgba(0,0,0,0.6)',
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.3)',
        borderRadius: RADIUS.md,
        paddingHorizontal: SPACING.md,
        paddingVertical: SPACING.xs,
    },
    fullscreenCloseBtnText: {
        color: COLORS.white,
        fontSize: 14,
        fontWeight: '700',
    },
});
