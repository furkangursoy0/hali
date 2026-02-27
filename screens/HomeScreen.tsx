import React, { useState } from 'react';
import {
    View,
    Text,
    StyleSheet,
    Pressable,
    Image,
    Alert,
    StatusBar,
    ScrollView,
    Platform,
    ActivityIndicator,
    useWindowDimensions,
} from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import { COLORS, SPACING, RADIUS } from '../constants/theme';
import { useAuth } from '../contexts/AuthContext';

const isWeb = Platform.OS === 'web';

interface HomeScreenProps {
    navigation: any;
}

export default function HomeScreen({ navigation }: HomeScreenProps) {
    const { width: viewportWidth } = useWindowDimensions();
    const { user, isLoggedIn, isAdmin, signOut } = useAuth();
    const [roomImage, setRoomImage] = useState<string | null>(null);
    const [loading, setLoading] = useState(false);
    const showQuickCards = isWeb && viewportWidth >= 900;
    const isCompactLayout = !isWeb || viewportWidth < 900;
    const step1Label = isCompactLayout ? 'Fotoğraf' : 'Oda Fotoğrafı';
    const step2Label = isCompactLayout ? 'Halı' : 'Halı Seçimi';
    const step3Label = isCompactLayout ? 'Dene' : 'Halı Deneme';

    const requestCameraPermission = async () => {
        if (isWeb) return true;
        const { status } = await ImagePicker.requestCameraPermissionsAsync();
        return status === 'granted';
    };

    const requestGalleryPermission = async () => {
        if (isWeb) return true;
        const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
        return status === 'granted';
    };

    const takePhoto = async () => {
        const hasPermission = await requestCameraPermission();
        if (!hasPermission) {
            Alert.alert('İzin Gerekli', 'Kamera erişimine izin vermeniz gerekiyor.');
            return;
        }

        setLoading(true);
        const result = await ImagePicker.launchCameraAsync({
            mediaTypes: ImagePicker.MediaTypeOptions.Images,
            allowsEditing: false,
            quality: 0.9,
        });
        setLoading(false);

        if (!result.canceled && result.assets[0]) {
            setRoomImage(result.assets[0].uri);
        }
    };

    const pickFromGallery = async () => {
        const hasPermission = await requestGalleryPermission();
        if (!hasPermission) {
            Alert.alert('İzin Gerekli', 'Galeri erişimine izin vermeniz gerekiyor.');
            return;
        }

        setLoading(true);
        const result = await ImagePicker.launchImageLibraryAsync({
            mediaTypes: ImagePicker.MediaTypeOptions.Images,
            allowsEditing: false,
            quality: 0.9,
        });
        setLoading(false);

        if (!result.canceled && result.assets[0]) {
            setRoomImage(result.assets[0].uri);
        }
    };

    const handleNext = () => {
        if (!roomImage) {
            Alert.alert('Fotoğraf Gerekli', 'Lütfen önce bir oda fotoğrafı seçin.');
            return;
        }
        navigation.navigate('Select', { roomImageUri: roomImage });
    };

    const FeatureIcon = ({ type }: { type: 'target' | 'speed' | 'check' }) => {
        if (type === 'target') {
            return (
                <View style={styles.iconBase}>
                    <View style={styles.iconTargetOuter} />
                    <View style={styles.iconTargetInner} />
                    <View style={styles.iconTargetDot} />
                </View>
            );
        }
        if (type === 'speed') {
            return (
                <View style={styles.iconBase}>
                    <View style={styles.iconBolt} />
                    <View style={styles.iconBoltTail} />
                </View>
            );
        }
        return (
            <View style={styles.iconBase}>
                <View style={styles.iconCheckCircle} />
                <View style={styles.iconCheckStem} />
                <View style={styles.iconCheckArm} />
            </View>
        );
    };

    const ActionIcon = ({ type }: { type: 'camera' | 'gallery' }) => {
        if (type === 'camera') {
            return (
                <View style={styles.actionIconBase}>
                    <View style={styles.cameraTop} />
                    <View style={styles.cameraBody}>
                        <View style={styles.cameraLensOuter}>
                            <View style={styles.cameraLensInner} />
                        </View>
                    </View>
                </View>
            );
        }
        return (
            <View style={styles.actionIconBase}>
                <View style={styles.galleryFrame}>
                    <View style={styles.gallerySun} />
                    <View style={styles.galleryHillLeft} />
                    <View style={styles.galleryHillRight} />
                </View>
            </View>
        );
    };

    const EditIcon = () => (
        <View style={styles.editIconWrap}>
            <View style={styles.editPencilBody} />
            <View style={styles.editPencilTip} />
        </View>
    );

    const UserIcon = () => (
        <View style={styles.accountIconWrap}>
            <View style={styles.accountIconHead} />
            <View style={styles.accountIconBody} />
        </View>
    );

    const CreditIcon = () => (
        <View style={styles.creditIconWrap}>
            <View style={styles.creditIconCoinOuter} />
            <View style={styles.creditIconCoinInner} />
            <View style={styles.creditIconBar} />
        </View>
    );

    const AccountPanel = () => {
        if (isLoggedIn && user) {
            return (
                <View style={styles.accountBar}>
                    <View style={styles.accountBarLeft}>
                        <UserIcon />
                        <Text style={styles.accountBarName} numberOfLines={1}>{user.fullName}</Text>
                    </View>
                    <View style={styles.accountBarRight}>
                        <View style={styles.creditBadge}>
                            <CreditIcon />
                            <Text style={styles.creditBadgeText}>{user.credit}</Text>
                        </View>
                        {isAdmin && (
                            <Pressable style={({ hovered }: any) => [styles.accountAdminBtn, hovered && styles.accountAdminBtnHover]} onPress={() => navigation.navigate('Admin')}>
                                <Text style={styles.accountAdminBtnText}>Admin</Text>
                            </Pressable>
                        )}
                        <Pressable style={({ hovered }: any) => [styles.accountGhostBtn, hovered && styles.accountGhostBtnHover]} onPress={signOut}>
                            <Text style={styles.accountGhostBtnText}>Çıkış</Text>
                        </Pressable>
                    </View>
                </View>
            );
        }

        return null;
    };

    const renderHeader = () => (
        <View style={styles.header}>
            <AccountPanel />
            <View style={styles.brandRow}>
                <Text style={styles.logo}>HALI</Text>
                <View style={styles.logoAiBadge}>
                    <Text style={styles.logoAi}>YERLEŞTİR</Text>
                </View>
            </View>
            <Text style={styles.subtitle}>Halınızı müşterinizin odasında anında gösterin</Text>
            {!isLoggedIn && (
                <Pressable
                    style={({ hovered }: any) => [styles.accountPrimaryBtnInline, hovered && styles.accountPrimaryBtnHover]}
                    onPress={() => navigation.navigate('Login')}
                >
                    <Text style={styles.accountPrimaryBtnText}>Giriş Yap</Text>
                </Pressable>
            )}
        </View>
    );

    const renderBody = () => (
        <>
            {showQuickCards && (
                <View style={styles.quickGrid}>
                    <View style={styles.quickCard}>
                        <View style={styles.quickCardRow}>
                            <View style={styles.quickIconWrap}><FeatureIcon type="target" /></View>
                            <View style={styles.quickContent}>
                                <Text style={styles.quickTitle}>Gerçekçi</Text>
                                <Text style={styles.quickText}>Perspektif uyumlu</Text>
                            </View>
                        </View>
                    </View>
                    <View style={styles.quickCard}>
                        <View style={styles.quickCardRow}>
                            <View style={styles.quickIconWrap}><FeatureIcon type="speed" /></View>
                            <View style={styles.quickContent}>
                                <Text style={styles.quickTitle}>Hızlı</Text>
                                <Text style={styles.quickText}>30-60 saniyede hazır</Text>
                            </View>
                        </View>
                    </View>
                    <View style={styles.quickCard}>
                        <View style={styles.quickCardRow}>
                            <View style={styles.quickIconWrap}><FeatureIcon type="check" /></View>
                            <View style={styles.quickContent}>
                                <Text style={styles.quickTitle}>Kolay</Text>
                                <Text style={styles.quickText}>3 adımda müşteriye sunum</Text>
                            </View>
                        </View>
                    </View>
                </View>
            )}

            <View style={styles.photoSection}>
                    <Pressable
                        style={({ hovered }: any) => [
                            styles.photoArea,
                            !isWeb && styles.photoAreaMobile,
                            isWeb && styles.photoAreaWeb,
                            roomImage && styles.photoAreaFilled,
                            hovered && styles.photoAreaHover,
                        ]}
                    onPress={pickFromGallery}
                >
                    {roomImage ? (
                        <>
                                    <Image source={{ uri: roomImage }} style={styles.roomImage} resizeMode="cover" />
                                    <View style={styles.imageOverlay}>
                                        <View style={styles.imageOverlayRow}>
                                            <EditIcon />
                                            <Text style={styles.imageOverlayText}>Değiştir</Text>
                                        </View>
                                    </View>
                                </>
                            ) : (
                        <View style={styles.placeholderContent}>
                            <Text style={styles.placeholderIcon}>📷</Text>
                            <Text style={styles.placeholderTitle}>Oda Fotoğrafı</Text>
                            <Text style={styles.placeholderDesc}>
                                Fotoğrafı yükleyin, sistem halıyı otomatik olarak odanızda deneyin.
                            </Text>
                        </View>
                    )}
                </Pressable>

                <View style={styles.actionRow}>
                    <Pressable
                        style={({ hovered }: any) => [styles.actionBtn, hovered && !loading && styles.actionBtnHover]}
                        onPress={takePhoto}
                        disabled={loading}
                    >
                                {loading ? (
                                    <ActivityIndicator color={COLORS.primary} size="small" />
                                ) : (
                                    <>
                                        <ActionIcon type="camera" />
                                        <Text style={styles.actionBtnText}>Kamera</Text>
                                    </>
                                )}
                    </Pressable>

                    <View style={styles.actionDivider} />

                    <Pressable
                        style={({ hovered }: any) => [styles.actionBtn, hovered && !loading && styles.actionBtnHover]}
                        onPress={pickFromGallery}
                        disabled={loading}
                    >
                                {loading ? (
                                    <ActivityIndicator color={COLORS.primary} size="small" />
                                ) : (
                                    <>
                                        <ActionIcon type="gallery" />
                                        <Text style={styles.actionBtnText}>Galeri</Text>
                                    </>
                                )}
                    </Pressable>
                </View>
            </View>

                    <View style={[styles.flowRow, isCompactLayout ? styles.flowRowMobile : styles.flowRowWeb]}>
                        <View style={[styles.flowItem, isCompactLayout && styles.flowItemCompact]}>
                            <View style={[styles.stepBadge, isCompactLayout && styles.stepBadgeCompact]}>
                                <Text style={[styles.stepNum, isCompactLayout && styles.stepNumCompact]}>1</Text>
                            </View>
                            <Text style={[styles.stepText, isCompactLayout && styles.stepTextMobile]}>{step1Label}</Text>
                        </View>
                        {!isCompactLayout && (
                            <View style={styles.stepArrowWrap}>
                                <Text style={styles.stepArrowText}>→</Text>
                            </View>
                        )}
                        <View style={[styles.flowItem, isCompactLayout && styles.flowItemCompact]}>
                            <View style={[styles.stepBadge, isCompactLayout && styles.stepBadgeCompact]}>
                                <Text style={[styles.stepNum, isCompactLayout && styles.stepNumCompact]}>2</Text>
                            </View>
                            <Text style={[styles.stepText, isCompactLayout && styles.stepTextMobile]}>{step2Label}</Text>
                        </View>
                        {!isCompactLayout && (
                            <View style={styles.stepArrowWrap}>
                                <Text style={styles.stepArrowText}>→</Text>
                            </View>
                        )}
                        <View style={[styles.flowItem, isCompactLayout && styles.flowItemCompact]}>
                            <View style={[styles.stepBadge, isCompactLayout && styles.stepBadgeCompact]}>
                                <Text style={[styles.stepNum, isCompactLayout && styles.stepNumCompact]}>3</Text>
                            </View>
                            <Text style={[styles.stepText, isCompactLayout && styles.stepTextMobile]}>{step3Label}</Text>
                        </View>
                    </View>

        </>
    );

    if (isWeb) {
        return (
            <View style={styles.container}>
                <StatusBar barStyle="light-content" backgroundColor={COLORS.background} />
                <View pointerEvents="none" style={styles.bgGlowTop} />
                <View pointerEvents="none" style={styles.bgGlowBottom} />
                <View style={styles.webLayout}>
                    <ScrollView
                        style={[styles.webScroll, isWeb && ({ overflowY: 'auto' } as any)]}
                        contentContainerStyle={[styles.scrollContent, styles.scrollContentWeb]}
                        showsVerticalScrollIndicator={false}
                        keyboardShouldPersistTaps="handled"
                    >
                        <View style={styles.content}>
                            {renderHeader()}
                            {renderBody()}
                        </View>
                    </ScrollView>
                    <View style={styles.webBottomBar}>
                        <View style={styles.webBottomInner}>
                            <Pressable
                                style={({ hovered }: any) => [
                                    styles.nextBtn,
                                    !roomImage && styles.nextBtnDisabled,
                                    hovered && roomImage && styles.nextBtnHover,
                                ]}
                                onPress={handleNext}
                            >
                                <Text style={styles.nextBtnText}>İlerle  →</Text>
                            </Pressable>
                        </View>
                    </View>
                </View>
            </View>
        );
    }

    return (
        <View style={styles.container}>
            <StatusBar barStyle="light-content" backgroundColor={COLORS.background} />
            <View pointerEvents="none" style={styles.bgGlowTop} />
            <View pointerEvents="none" style={styles.bgGlowBottom} />
            <ScrollView
                style={styles.scroll}
                contentContainerStyle={[styles.scrollContent, styles.scrollContentMobile]}
                showsVerticalScrollIndicator={false}
                keyboardShouldPersistTaps="handled"
                stickyHeaderIndices={[0]}
            >
                <View style={styles.mobileStickyHeader}>
                    {renderHeader()}
                </View>
                <View style={styles.content}>
                    {renderBody()}
                </View>
            </ScrollView>
            <View style={styles.stickyBottom}>
                <Pressable
                    style={[
                        styles.nextBtn,
                        !roomImage && styles.nextBtnDisabled,
                    ]}
                    onPress={handleNext}
                >
                    <Text style={styles.nextBtnText}>İlerle  →</Text>
                </Pressable>
            </View>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: COLORS.background,
        minHeight: 0,
    },
    scroll: {
        flex: 1,
    },
    webLayout: {
        flex: 1,
        minHeight: 0,
    },
    webScroll: {
        flex: 1,
        minHeight: 0,
    },
    bgGlowTop: {
        position: 'absolute',
        top: -120,
        left: -120,
        width: 320,
        height: 320,
        borderRadius: 180,
        backgroundColor: 'rgba(200, 134, 10, 0.08)',
    },
    bgGlowBottom: {
        position: 'absolute',
        bottom: -150,
        right: 0,
        width: 240,
        height: 340,
        borderRadius: 190,
        backgroundColor: 'rgba(200, 134, 10, 0.06)',
    },
    scrollContent: {
        paddingHorizontal: SPACING.md,
        paddingTop: isWeb ? SPACING.xxl : SPACING.xxl + SPACING.xs,
        paddingBottom: SPACING.xxl,
    },
    scrollContentMobile: {
        paddingTop: SPACING.lg,
        paddingBottom: 120,
    },
    scrollContentWeb: {
        paddingHorizontal: SPACING.xl,
        paddingBottom: 120,
    },
    content: {
        width: '100%',
        maxWidth: 940,
        alignSelf: 'center',
    },
    header: {
        alignItems: 'center',
        marginBottom: SPACING.md,
        width: '100%',
        backgroundColor: 'transparent',
    },
    accountBar: {
        width: '100%',
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingVertical: 6,
        marginBottom: SPACING.xs,
    },
    accountBarLeft: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
        flex: 1,
        minWidth: 0,
    },
    accountBarName: {
        color: COLORS.textSecondary,
        fontSize: 12,
        fontWeight: '600',
        flexShrink: 1,
    },
    accountBarRight: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
        flexShrink: 0,
    },
    logo: {
        fontSize: 32,
        fontWeight: '800',
        color: COLORS.text,
        letterSpacing: 0.8,
    },
    brandRow: {
        flexDirection: 'row',
        alignItems: 'center',
        alignSelf: 'center',
    },
    logoAiBadge: {
        marginLeft: 8,
        backgroundColor: 'rgba(200, 134, 10, 0.16)',
        borderWidth: 1,
        borderColor: 'rgba(200, 134, 10, 0.45)',
        borderRadius: 8,
        paddingHorizontal: 8,
        paddingVertical: 2,
    },
    logoAi: {
        fontSize: 11,
        fontWeight: '800',
        color: COLORS.primaryLight,
        letterSpacing: 0.5,
        textTransform: 'uppercase',
    },
    subtitle: {
        fontSize: 15,
        color: COLORS.textSecondary,
        marginTop: 4,
        textAlign: 'center',
    },
    accountPrimaryBtnInline: {
        marginTop: SPACING.sm,
        backgroundColor: COLORS.primary,
        borderRadius: RADIUS.sm,
        paddingHorizontal: 14,
        paddingVertical: 8,
    },
    creditBadge: {
        marginTop: 0,
        borderWidth: 1,
        borderColor: 'rgba(200, 134, 10, 0.45)',
        backgroundColor: 'rgba(200, 134, 10, 0.15)',
        borderRadius: RADIUS.sm,
        paddingHorizontal: 7,
        paddingVertical: 4,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 4,
        minWidth: 62,
    },
    creditBadgeText: {
        color: COLORS.primaryLight,
        fontSize: 11,
        fontWeight: '700',
    },
    accountGhostBtn: {
        marginTop: 0,
        paddingHorizontal: 8,
        paddingVertical: 4.5,
        borderRadius: RADIUS.sm,
        borderWidth: 1,
        borderColor: COLORS.border,
    },
    accountGhostBtnHover: {
        backgroundColor: COLORS.surfaceElevated,
    },
    accountGhostBtnText: {
        color: COLORS.textSecondary,
        fontSize: 11,
        fontWeight: '600',
    },
    accountAdminBtn: {
        marginTop: 0,
        paddingHorizontal: 9,
        paddingVertical: 4.5,
        borderRadius: RADIUS.sm,
        borderWidth: 1,
        borderColor: 'rgba(200, 134, 10, 0.35)',
        backgroundColor: 'rgba(200, 134, 10, 0.12)',
    },
    accountAdminBtnHover: {
        backgroundColor: 'rgba(200, 134, 10, 0.2)',
    },
    accountAdminBtnText: {
        color: COLORS.primaryLight,
        fontSize: 11,
        fontWeight: '700',
    },
    accountIconWrap: {
        width: 20,
        height: 20,
        alignItems: 'center',
        justifyContent: 'center',
    },
    accountIconHead: {
        width: 6,
        height: 6,
        borderRadius: 4,
        borderWidth: 1.5,
        borderColor: COLORS.primary,
        marginBottom: 2,
    },
    accountIconBody: {
        width: 10,
        height: 5,
        borderTopLeftRadius: 6,
        borderTopRightRadius: 6,
        borderWidth: 1.5,
        borderBottomWidth: 0,
        borderColor: COLORS.primary,
    },
    creditIconWrap: {
        width: 14,
        height: 14,
        alignItems: 'center',
        justifyContent: 'center',
    },
    creditIconCoinOuter: {
        position: 'absolute',
        width: 11,
        height: 11,
        borderRadius: 6,
        borderWidth: 1.5,
        borderColor: COLORS.primary,
    },
    creditIconCoinInner: {
        position: 'absolute',
        width: 5,
        height: 5,
        borderRadius: 3,
        borderWidth: 1.2,
        borderColor: COLORS.primary,
    },
    creditIconBar: {
        width: 1.5,
        height: 7,
        backgroundColor: COLORS.primary,
        borderRadius: 1,
    },
    guestCard: {
        flexDirection: 'row',
        gap: 6,
    },
    accountPrimaryBtn: {
        backgroundColor: COLORS.primary,
        borderRadius: RADIUS.sm,
        paddingHorizontal: 10,
        paddingVertical: 7,
    },
    accountPrimaryBtnHover: {
        backgroundColor: COLORS.primaryLight,
    },
    accountPrimaryBtnText: {
        color: COLORS.white,
        fontSize: 12,
        fontWeight: '700',
    },
    mobileStickyHeader: {
        backgroundColor: 'transparent',
        zIndex: 20,
        paddingTop: 0,
        paddingBottom: SPACING.xs,
    },
    quickGrid: {
        flexDirection: 'row',
        gap: SPACING.sm,
        marginBottom: SPACING.md,
        flexWrap: 'wrap',
    },
    quickCard: {
        flex: 1,
        minWidth: isWeb ? 220 : 100,
        backgroundColor: COLORS.surface,
        borderRadius: RADIUS.md,
        borderWidth: 1,
        borderColor: COLORS.border,
        paddingVertical: SPACING.sm,
        paddingHorizontal: SPACING.sm,
    },
    quickCardRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: SPACING.sm,
    },
    quickContent: {
        flex: 1,
    },
    quickIconWrap: {
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
    iconBase: {
        width: 16,
        height: 16,
        alignItems: 'center',
        justifyContent: 'center',
    },
    iconTargetOuter: {
        position: 'absolute',
        width: 14,
        height: 14,
        borderRadius: 7,
        borderWidth: 1.8,
        borderColor: COLORS.primary,
    },
    iconTargetInner: {
        position: 'absolute',
        width: 8,
        height: 8,
        borderRadius: 4,
        borderWidth: 1.8,
        borderColor: COLORS.primary,
    },
    iconTargetDot: {
        width: 3,
        height: 3,
        borderRadius: 2,
        backgroundColor: COLORS.primary,
    },
    iconBolt: {
        position: 'absolute',
        width: 8,
        height: 2.5,
        borderRadius: 2,
        backgroundColor: COLORS.primary,
        transform: [{ rotate: '-28deg' }],
        top: 5,
    },
    iconBoltTail: {
        position: 'absolute',
        width: 8,
        height: 2.5,
        borderRadius: 2,
        backgroundColor: COLORS.primary,
        transform: [{ rotate: '-28deg' }],
        top: 10,
        left: 4,
    },
    iconCheckCircle: {
        position: 'absolute',
        width: 14,
        height: 14,
        borderRadius: 7,
        borderWidth: 1.8,
        borderColor: COLORS.primary,
    },
    iconCheckStem: {
        position: 'absolute',
        width: 2,
        height: 6,
        backgroundColor: COLORS.primary,
        borderRadius: 2,
        transform: [{ rotate: '-40deg' }],
        left: 5,
        top: 7,
    },
    iconCheckArm: {
        position: 'absolute',
        width: 2,
        height: 9,
        backgroundColor: COLORS.primary,
        borderRadius: 2,
        transform: [{ rotate: '46deg' }],
        left: 8,
        top: 4,
    },
    quickTitle: {
        color: COLORS.text,
        fontSize: 12,
        fontWeight: '700',
        lineHeight: 14,
        textAlign: 'left',
        marginBottom: 2,
    },
    quickText: {
        color: COLORS.textSecondary,
        fontSize: 11,
        lineHeight: 13,
        textAlign: 'left',
    },
    photoSection: {
        width: '100%',
        marginBottom: SPACING.md,
    },
    photoArea: {
        backgroundColor: COLORS.surface,
        borderRadius: RADIUS.xl,
        borderWidth: 2,
        borderColor: COLORS.border,
        borderStyle: 'dashed',
        overflow: 'hidden',
        justifyContent: 'center',
        alignItems: 'center',
        minHeight: 320,
    },
    photoAreaMobile: {
        minHeight: 260,
        maxHeight: 340,
    },
    photoAreaWeb: {
        minHeight: 380,
    },
    photoAreaFilled: {
        borderStyle: 'solid',
        borderColor: COLORS.primary,
    },
    photoAreaHover: {
        borderColor: '#3E3E3E',
    },
    roomImage: {
        width: '100%',
        height: '100%',
    },
    imageOverlay: {
        position: 'absolute',
        bottom: 12,
        right: 12,
        backgroundColor: 'rgba(0,0,0,0.7)',
        paddingHorizontal: 12,
        paddingVertical: 6,
        borderRadius: RADIUS.full,
    },
    imageOverlayText: {
        color: COLORS.white,
        fontSize: 13,
        fontWeight: '600',
    },
    imageOverlayRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
    },
    placeholderContent: {
        alignItems: 'center',
        padding: SPACING.xl,
    },
    placeholderIcon: {
        fontSize: 56,
        marginBottom: SPACING.md,
    },
    placeholderTitle: {
        fontSize: 20,
        fontWeight: '700',
        color: COLORS.text,
        marginBottom: SPACING.sm,
    },
    placeholderDesc: {
        fontSize: 14,
        color: COLORS.textSecondary,
        textAlign: 'center',
        lineHeight: 20,
    },
    actionRow: {
        flexDirection: 'row',
        backgroundColor: COLORS.surface,
        borderRadius: RADIUS.lg,
        marginTop: SPACING.md,
        overflow: 'hidden',
    },
    actionBtn: {
        flex: 1,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: SPACING.md,
        gap: 8,
    },
    actionBtnHover: {
        backgroundColor: '#242424',
    },
    actionDivider: {
        width: 1,
        backgroundColor: COLORS.border,
        marginVertical: SPACING.sm,
    },
    actionBtnIcon: {
        fontSize: 20,
    },
    actionIconBase: {
        width: 20,
        height: 20,
        alignItems: 'center',
        justifyContent: 'center',
    },
    cameraTop: {
        position: 'absolute',
        top: 2,
        left: 5,
        width: 6,
        height: 2,
        borderRadius: 1,
        backgroundColor: COLORS.primary,
    },
    cameraBody: {
        width: 15,
        height: 11,
        borderRadius: 3,
        borderWidth: 1.8,
        borderColor: COLORS.primary,
        alignItems: 'center',
        justifyContent: 'center',
        marginTop: 3,
    },
    cameraLensOuter: {
        width: 6,
        height: 6,
        borderRadius: 3,
        borderWidth: 1.6,
        borderColor: COLORS.primary,
        alignItems: 'center',
        justifyContent: 'center',
    },
    cameraLensInner: {
        width: 2,
        height: 2,
        borderRadius: 1,
        backgroundColor: COLORS.primary,
    },
    galleryFrame: {
        width: 15,
        height: 12,
        borderRadius: 3,
        borderWidth: 1.8,
        borderColor: COLORS.primary,
        overflow: 'hidden',
        position: 'relative',
    },
    gallerySun: {
        position: 'absolute',
        width: 2.5,
        height: 2.5,
        borderRadius: 2,
        backgroundColor: COLORS.primary,
        top: 2,
        right: 2,
    },
    galleryHillLeft: {
        position: 'absolute',
        bottom: 1,
        left: 1,
        width: 7,
        height: 6,
        borderTopLeftRadius: 5,
        borderTopRightRadius: 5,
        backgroundColor: COLORS.primary,
    },
    galleryHillRight: {
        position: 'absolute',
        bottom: 1,
        right: 1,
        width: 8,
        height: 7,
        borderTopLeftRadius: 6,
        borderTopRightRadius: 6,
        backgroundColor: COLORS.primary,
    },
    editIconWrap: {
        width: 12,
        height: 12,
        alignItems: 'center',
        justifyContent: 'center',
        transform: [{ rotate: '-35deg' }],
    },
    editPencilBody: {
        width: 9,
        height: 2,
        borderRadius: 1,
        backgroundColor: COLORS.white,
    },
    editPencilTip: {
        position: 'absolute',
        right: 0,
        width: 0,
        height: 0,
        borderTopWidth: 2,
        borderBottomWidth: 2,
        borderLeftWidth: 3,
        borderTopColor: 'transparent',
        borderBottomColor: 'transparent',
        borderLeftColor: COLORS.primary,
    },
    actionBtnText: {
        color: COLORS.text,
        fontSize: 15,
        fontWeight: '600',
    },
    flowRow: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: SPACING.xs,
        marginBottom: SPACING.md,
        flexWrap: 'nowrap',
    },
    flowRowMobile: {
        justifyContent: 'space-between',
        gap: 0,
    },
    flowRowWeb: {
        flexWrap: 'wrap',
    },
    flowItem: {
        minWidth: isWeb ? 170 : 0,
        alignItems: 'center',
        gap: 6,
        flex: isWeb ? 0 : 1,
    },
    flowItemCompact: {
        minWidth: 0,
        flex: 1,
        gap: 4,
        flexBasis: '33.33%',
        maxWidth: '33.33%',
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
        paddingHorizontal: 2,
    },
    stepArrowWrap: {
        width: isWeb ? 40 : 22,
        alignItems: 'center',
    },
    stepArrowWrapMobile: {
        width: 0,
        display: 'none',
    },
    stepArrowText: {
        color: COLORS.textMuted,
        fontSize: 16,
    },
    stepArrowTextMobile: {
        fontSize: 14,
    },
    nextBtn: {
        backgroundColor: COLORS.primary,
        borderRadius: RADIUS.lg,
        paddingVertical: SPACING.md + 2,
        alignItems: 'center',
        marginBottom: 0,
        shadowColor: COLORS.primary,
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.4,
        shadowRadius: 12,
        elevation: 8,
    },
    nextBtnHover: {
        backgroundColor: COLORS.primaryLight,
    },
    nextBtnDisabled: {
        backgroundColor: COLORS.border,
        shadowOpacity: 0,
    },
    nextBtnText: {
        color: COLORS.white,
        fontSize: 17,
        fontWeight: '700',
        letterSpacing: 0.3,
    },
    stickyBottom: {
        paddingHorizontal: SPACING.md,
        paddingTop: 10,
        paddingBottom: SPACING.md,
        backgroundColor: 'rgba(15,15,15,0.92)',
        borderTopWidth: 1,
        borderTopColor: 'rgba(46,46,46,0.6)',
    },
    webBottomBar: {
        position: 'fixed' as any,
        bottom: 0,
        left: 0,
        right: 0,
        backgroundColor: 'rgba(15,15,15,0.85)' as any,
        backdropFilter: 'blur(18px)' as any,
        borderTopWidth: 1,
        borderTopColor: 'rgba(46,46,46,0.5)',
        paddingHorizontal: SPACING.xl,
        paddingTop: 10,
        paddingBottom: SPACING.md,
        zIndex: 100,
    },
    webBottomInner: {
        width: '100%',
        maxWidth: 940,
        alignSelf: 'center',
    },
});
