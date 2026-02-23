import React, { useState, useMemo, useEffect } from 'react';
import {
    View,
    Text,
    StyleSheet,
    TouchableOpacity,
    Pressable,
    Image,
    FlatList,
    ScrollView,
    TextInput,
    Alert,
    StatusBar,
    Dimensions,
    Platform,
} from 'react-native';
import { COLORS, SPACING, RADIUS } from '../constants/theme';
import carpetsData from '../data/carpets.json';
import UsageLimitBadge from '../components/UsageLimitBadge';
import LimitReachedModal from '../components/LimitReachedModal';
import { useUsageLimit } from '../hooks/useUsageLimit';
import { getCarpetThumbnailUrl } from '../services/carpet-image';
import { useAuth } from '../contexts/AuthContext';

const isWeb = Platform.OS === 'web';
const CARPET_IMAGE_RATIO = 1.35;
const WEB_PAGE_SIZE = 60;
const MOBILE_PAGE_SIZE = 40;

function normalizeText(value: string) {
    return value
        .toLocaleLowerCase('tr-TR')
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '');
}

function scoreMatch(field: string, query: string, baseWeight: number) {
    if (!field || !query) return 0;
    const f = normalizeText(field);
    const q = normalizeText(query);
    if (!f.includes(q)) return 0;
    if (f === q) return baseWeight + 120;
    if (f.startsWith(q)) return baseWeight + 90;
    return baseWeight + 60 - Math.min(f.indexOf(q), 40);
}

function getLayout() {
    const w = Dimensions.get('window').width;
    let cols = 2;
    if (isWeb) {
        if (w >= 1400) cols = 5;
        else if (w >= 1100) cols = 4;
        else if (w >= 760) cols = 3;
        else cols = 2;
    }
    const padding = SPACING.md * 2;
    const gaps = SPACING.sm * (cols - 1);
    const cardSize = (w - padding - gaps) / cols;
    return { cols, cardSize };
}

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

interface SelectScreenProps {
    navigation: any;
    route: any;
}

const ALL = 'Tümü';

export default function SelectScreen({ navigation, route }: SelectScreenProps) {
    const { roomImageUri } = route.params;
    const { isLoggedIn } = useAuth();
    const [searchQuery, setSearchQuery] = useState('');
    const [selectedBrand, setSelectedBrand] = useState<string>(ALL);
    const [selectedCollection, setSelectedCollection] = useState<string>(ALL);
    const [selectedCarpet, setSelectedCarpet] = useState<Carpet | null>(null);
    const [layout, setLayout] = useState(getLayout());
    const [openDropdown, setOpenDropdown] = useState<'brand' | 'collection' | null>(null);
    const [isSearchFocused, setIsSearchFocused] = useState(false);
    const [showLimitModal, setShowLimitModal] = useState(false);
    const [visibleCount, setVisibleCount] = useState(isWeb ? WEB_PAGE_SIZE : MOBILE_PAGE_SIZE);
    const [isPlacing, setIsPlacing] = useState(false);
    const { remaining, limit, loading: limitLoading, error: limitError, consumeOne, isLimitReached } = useUsageLimit();

    useEffect(() => {
        if (!isWeb) return;
        const handler = () => setLayout(getLayout());
        window.addEventListener('resize', handler);
        return () => window.removeEventListener('resize', handler);
    }, []);

    const allCarpets = carpetsData as Carpet[];

    const brands = useMemo(() => {
        const b = [...new Set(allCarpets.map(c => c.brand))].sort();
        return [ALL, ...b];
    }, []);

    const collections = useMemo(() => {
        const source = selectedBrand === ALL ? allCarpets : allCarpets.filter(c => c.brand === selectedBrand);
        const cols = [...new Set(source.map(c => c.collection))].sort();
        return [ALL, ...cols];
    }, [selectedBrand]);

    const handleBrandSelect = (brand: string) => {
        setSelectedBrand(brand);
        setSelectedCollection(ALL);
        setSelectedCarpet(null);
    };

    const filteredCarpets = useMemo(() => {
        let list = allCarpets;
        if (selectedBrand !== ALL) list = list.filter(c => c.brand === selectedBrand);
        if (selectedCollection !== ALL) list = list.filter(c => c.collection === selectedCollection);

        const query = searchQuery.trim();
        if (!query) return list;

        const terms = query.split(/\s+/).filter(Boolean);
        return list
            .map(carpet => {
                let score = 0;
                for (const term of terms) {
                    const brandScore = scoreMatch(carpet.brand, term, 95);
                    const idScore = scoreMatch(carpet.id, term, 85);
                    const nameScore = scoreMatch(carpet.name, term, 70);
                    const collectionScore = scoreMatch(carpet.collection, term, 60);
                    const bestTermScore = Math.max(brandScore, idScore, nameScore, collectionScore);
                    if (bestTermScore === 0) return null;
                    score += bestTermScore;
                }

                const fullQuery = normalizeText(query);
                const fullText = normalizeText(`${carpet.brand} ${carpet.collection} ${carpet.id} ${carpet.name}`);
                if (fullText.includes(fullQuery)) score += 50;

                return { carpet, score };
            })
            .filter((entry): entry is { carpet: Carpet; score: number } => entry !== null)
            .sort((a, b) => b.score - a.score)
            .map(entry => entry.carpet);
    }, [selectedBrand, selectedCollection, searchQuery]);

    useEffect(() => {
        setVisibleCount(isWeb ? WEB_PAGE_SIZE : MOBILE_PAGE_SIZE);
    }, [selectedBrand, selectedCollection, searchQuery]);

    const visibleCarpets = useMemo(
        () => filteredCarpets.slice(0, visibleCount),
        [filteredCarpets, visibleCount]
    );

    const hasMoreCarpets = visibleCarpets.length < filteredCarpets.length;
    const loadMoreCarpets = () => {
        if (!hasMoreCarpets) return;
        const step = isWeb ? WEB_PAGE_SIZE : MOBILE_PAGE_SIZE;
        setVisibleCount((prev) => Math.min(prev + step, filteredCarpets.length));
    };

    const handleWebGridScroll = (event: any) => {
        const nativeEvent = event?.nativeEvent;
        if (!nativeEvent) return;
        const { layoutMeasurement, contentOffset, contentSize } = nativeEvent;
        const distanceToBottom = contentSize.height - (layoutMeasurement.height + contentOffset.y);
        if (distanceToBottom < 700) {
            loadMoreCarpets();
        }
    };

    const handlePlace = async (mode: 'preview' | 'normal') => {
        if (isPlacing) return;
        if (!isLoggedIn) {
            navigation.navigate('Login');
            return;
        }
        if (!selectedCarpet) {
            Alert.alert('Halı Seçin', 'Lütfen önce bir halı seçin.');
            return;
        }
        if (isLimitReached) {
            setShowLimitModal(true);
            return;
        }
        try {
            setIsPlacing(true);
            const consumeResult = await consumeOne();
            if (!consumeResult.allowed) {
                setShowLimitModal(true);
                return;
            }
            navigation.navigate('Result', { roomImageUri, carpet: selectedCarpet, mode });
        } catch (error: any) {
            Alert.alert('İşlem Başarısız', error?.message || 'Render başlatılamadı. Lütfen tekrar deneyin.');
        } finally {
            setIsPlacing(false);
        }
    };

    const renderCarpetCard = (item: Carpet) => {
        const { cardSize } = layout;
        const isSelected = selectedCarpet?.id === item.id && selectedCarpet?.image === item.image;
        const thumbUri = item.imagePath ? getCarpetThumbnailUrl(item.imagePath, item.thumbPath) : '';
        return (
            <Pressable
                key={`${item.brand}_${item.image}`}
                style={({ hovered }: any) => [
                    styles.carpetCard,
                    { width: cardSize, marginBottom: SPACING.sm },
                    isSelected && styles.carpetCardSelected,
                    hovered && styles.carpetCardHover,
                ]}
                onPress={() => setSelectedCarpet(item)}
            >
                <View style={[styles.imageFrame, { height: cardSize * CARPET_IMAGE_RATIO }]}>
                    {thumbUri ? (
                        <Image source={{ uri: thumbUri }} style={styles.carpetImage} resizeMode="contain" />
                    ) : (
                        <View style={[styles.carpetImage, styles.noImage]}>
                            <Text style={styles.noImageText}>🖼️</Text>
                        </View>
                    )}
                </View>
                {isSelected && (
                    <View style={styles.selectedBadge}>
                        <Text style={styles.selectedBadgeText}>✓</Text>
                    </View>
                )}
                <View style={styles.carpetInfo}>
                    <View style={styles.badgeRow}>
                        <View style={styles.brandBadge}>
                            <Text style={styles.brandBadgeText}>{item.brand}</Text>
                        </View>
                    </View>
                    <Text style={styles.carpetName} numberOfLines={1}>{item.name}</Text>
                    <Text style={styles.carpetCollection} numberOfLines={1}>{item.collection}</Text>
                    {item.size ? <Text style={styles.carpetSize}>{item.size}</Text> : null}
                </View>
            </Pressable>
        );
    };

    // ── Shared sub-components ──────────────────────────────────────────
    const HeaderBar = () => (
        <View style={styles.header}>
            <Pressable onPress={() => navigation.goBack()} style={({ hovered }: any) => [styles.backBtn, hovered && styles.backBtnHover]}>
                <Text style={styles.backBtnText}>← Geri</Text>
            </Pressable>
            <Text style={styles.title}>Halı Seç</Text>
            <View style={{ width: 60 }} />
        </View>
    );



    const FilterDropdown = ({
        label,
        value,
        onPress,
        disabled = false,
    }: {
        label: string;
        value: string;
        onPress: () => void;
        disabled?: boolean;
    }) => (
        <Pressable
            style={({ hovered }: any) => [
                styles.dropdownTrigger,
                disabled && styles.dropdownTriggerDisabled,
                hovered && !disabled && styles.dropdownTriggerHover,
            ]}
            onPress={onPress}
            disabled={disabled}
        >
            <Text style={styles.dropdownLabel}>{label}</Text>
            <Text style={styles.dropdownValue} numberOfLines={1}>
                {value}
            </Text>
            <Text style={styles.dropdownArrow}>▾</Text>
        </Pressable>
    );

    const renderDropdownMenu = (
        type: 'brand' | 'collection',
        options: string[],
        activeValue: string,
        onSelect: (value: string) => void
    ) => {
        if (openDropdown !== type) return null;
        return (
            <View style={styles.dropdownMenu}>
                <ScrollView style={styles.dropdownMenuList} nestedScrollEnabled>
                    {options.map(option => (
                        <Pressable
                            key={option}
                            style={({ hovered }: any) => [
                                styles.dropdownMenuItem,
                                activeValue === option && styles.dropdownMenuItemActive,
                                hovered && styles.dropdownMenuItemHover,
                            ]}
                            onPress={() => {
                                onSelect(option);
                                setOpenDropdown(null);
                            }}
                        >
                            <Text style={[styles.dropdownMenuItemText, activeValue === option && styles.dropdownMenuItemTextActive]}>
                                {option}
                            </Text>
                        </Pressable>
                    ))}
                </ScrollView>
            </View>
        );
    };

    const FilterBar = () => (
        <View style={styles.filterArea}>
            <View style={styles.filterRow}>
                <View style={[styles.dropdownColumn, openDropdown === 'brand' && styles.dropdownColumnOpen]}>
                    <FilterDropdown
                        label="Marka"
                        value={selectedBrand}
                        onPress={() => setOpenDropdown(prev => (prev === 'brand' ? null : 'brand'))}
                    />
                    {renderDropdownMenu('brand', brands, selectedBrand, handleBrandSelect)}
                </View>
                <View style={[styles.dropdownColumn, openDropdown === 'collection' && styles.dropdownColumnOpen]}>
                    <FilterDropdown
                        label="Koleksiyon"
                        value={selectedCollection}
                        onPress={() => setOpenDropdown(prev => (prev === 'collection' ? null : 'collection'))}
                        disabled={collections.length <= 1}
                    />
                    {renderDropdownMenu('collection', collections, selectedCollection, setSelectedCollection)}
                </View>
            </View>
        </View>
    );

    const ResultsText = () => (
        <Text style={styles.resultsText}>
            {filteredCarpets.length} halı
            {selectedBrand !== ALL ? ` · ${selectedBrand}` : ''}
            {selectedCollection !== ALL ? ` · ${selectedCollection}` : ''}
        </Text>
    );

    const BottomBar = () => {
        if (!selectedCarpet) {
            return (
                <View style={styles.bottomBar}>
                    <Text style={styles.hintText}>Bir hali secin, ardindan AI ile yerlestirin</Text>
                    {isLoggedIn ? (
                        <UsageLimitBadge remaining={remaining} limit={limit} loading={limitLoading} />
                    ) : null}
                </View>
            );
        }
        const selectedThumbUri = selectedCarpet.imagePath
            ? getCarpetThumbnailUrl(selectedCarpet.imagePath, selectedCarpet.thumbPath, 240, 70)
            : '';
        return (
            <View style={styles.bottomBar}>
                {selectedThumbUri && (
                    <Image source={{ uri: selectedThumbUri }} style={styles.selectionThumb} resizeMode="cover" />
                )}
                <View style={styles.selectionInfo}>
                    <Text style={styles.selectionBrand}>{selectedCarpet.brand} · {selectedCarpet.collection}</Text>
                    <Text style={styles.selectionName} numberOfLines={1}>{selectedCarpet.name}</Text>
                    {!!limitError && <Text style={styles.limitErrorText}>Limit durumu gecici olarak alinamadi</Text>}
                </View>
                {isLoggedIn ? <UsageLimitBadge remaining={remaining} limit={limit} loading={limitLoading} /> : null}
                <View style={styles.btnGroup}>
                    <Pressable
                        style={({ hovered }: any) => [
                            styles.placeBtn,
                            isPlacing && styles.placeBtnDisabled,
                            hovered && !isPlacing && styles.placeBtnHover,
                        ]}
                        onPress={() => handlePlace('normal')}
                        disabled={isPlacing}
                    >
                        <Text style={styles.placeBtnIcon}>✨</Text>
                        <Text style={styles.placeBtnText}>{isPlacing ? 'Başlatılıyor...' : 'AI ile Yerleştir'}</Text>
                    </Pressable>
                </View>
            </View>
        );
    };

    // ── WEB LAYOUT ────────────────────────────────────────────────────
    if (isWeb) {
        const { cols, cardSize } = layout;
        const rows: Carpet[][] = [];
        for (let i = 0; i < visibleCarpets.length; i += cols) {
            rows.push(visibleCarpets.slice(i, i + cols));
        }

        return (
            <View style={webStyles.root}>
                <StatusBar barStyle="light-content" />

                {/* Top: header + filters (not scrollable) */}
                <View style={webStyles.topSection}>
                    <HeaderBar />
                    {/* Search */}
                    <View style={[styles.searchContainer, isSearchFocused && styles.searchContainerFocused]}>
                        <Text style={styles.searchIcon}>🔍</Text>
                        <TextInput
                            style={[styles.searchInput, isWeb && styles.searchInputWeb]}
                            placeholder="Model adı, kod veya koleksiyon ara..."
                            placeholderTextColor={COLORS.textMuted}
                            value={searchQuery}
                            onChangeText={setSearchQuery}
                            onFocus={() => setIsSearchFocused(true)}
                            onBlur={() => setIsSearchFocused(false)}
                            returnKeyType="search"
                            autoCorrect={false}
                        />
                        {searchQuery.length > 0 && (
                            <TouchableOpacity onPress={() => setSearchQuery('')}>
                                <Text style={styles.clearBtn}>✕</Text>
                            </TouchableOpacity>
                        )}
                    </View>
                    <FilterBar />
                    <ResultsText />
                </View>

                {/* Middle: scrollable grid */}
                <ScrollView
                    style={webStyles.gridScroll}
                    contentContainerStyle={[webStyles.gridContent, { paddingHorizontal: SPACING.md }]}
                    showsVerticalScrollIndicator={false}
                    onScroll={handleWebGridScroll}
                    scrollEventThrottle={100}
                >
                    {rows.map((row, i) => (
                        <View key={i} style={webStyles.row}>
                            {row.map(item => renderCarpetCard(item))}
                        </View>
                    ))}
                    {filteredCarpets.length === 0 && (
                        <View style={styles.emptyContainer}>
                            <Text style={styles.emptyIcon}>🔎</Text>
                            <Text style={styles.emptyText}>Halı bulunamadı</Text>
                            <Text style={styles.emptySubtext}>Farklı filtre veya arama terimi deneyin</Text>
                        </View>
                    )}
                    {hasMoreCarpets && (
                        <Pressable style={({ hovered }: any) => [styles.loadMoreBtn, hovered && styles.loadMoreBtnHover]} onPress={loadMoreCarpets}>
                            <Text style={styles.loadMoreBtnText}>Daha fazla halı yükle</Text>
                        </Pressable>
                    )}
                </ScrollView>

                {/* Bottom: always visible action bar */}
                <BottomBar />
                <LimitReachedModal
                    visible={showLimitModal}
                    onClose={() => setShowLimitModal(false)}
                    onBack={() => setShowLimitModal(false)}
                    remaining={remaining}
                    limit={limit}
                />

            </View>
        );
    }

    // ── MOBILE LAYOUT ─────────────────────────────────────────────────
    return (
        <View style={styles.container}>
            <StatusBar barStyle="light-content" backgroundColor={COLORS.background} />
            <HeaderBar />
            {/* Search */}
            <View style={[styles.searchContainer, isSearchFocused && styles.searchContainerFocused]}>
                <Text style={styles.searchIcon}>🔍</Text>
                <TextInput
                    style={[styles.searchInput, isWeb && styles.searchInputWeb]}
                    placeholder="Model adı, kod veya koleksiyon ara..."
                    placeholderTextColor={COLORS.textMuted}
                    value={searchQuery}
                    onChangeText={setSearchQuery}
                    onFocus={() => setIsSearchFocused(true)}
                    onBlur={() => setIsSearchFocused(false)}
                    returnKeyType="search"
                    autoCorrect={false}
                />
                {searchQuery.length > 0 && (
                    <TouchableOpacity onPress={() => setSearchQuery('')}>
                        <Text style={styles.clearBtn}>✕</Text>
                    </TouchableOpacity>
                )}
            </View>
            <FilterBar />
            <ResultsText />
            <FlatList
                data={visibleCarpets}
                renderItem={({ item }) => renderCarpetCard(item)}
                keyExtractor={item => `${item.brand}_${item.image}`}
                numColumns={2}
                columnWrapperStyle={styles.mobileRow}
                contentContainerStyle={styles.listContent}
                showsVerticalScrollIndicator={false}
                initialNumToRender={8}
                maxToRenderPerBatch={8}
                windowSize={7}
                removeClippedSubviews
                onEndReachedThreshold={0.4}
                onEndReached={loadMoreCarpets}
                ListEmptyComponent={
                    <View style={styles.emptyContainer}>
                        <Text style={styles.emptyIcon}>🔎</Text>
                        <Text style={styles.emptyText}>Halı bulunamadı</Text>
                        <Text style={styles.emptySubtext}>Farklı filtre deneyin</Text>
                    </View>
                }
                ListFooterComponent={
                    hasMoreCarpets ? (
                        <Pressable style={styles.mobileLoadMoreBtn} onPress={loadMoreCarpets}>
                            <Text style={styles.mobileLoadMoreText}>Daha fazla halı yükle</Text>
                        </Pressable>
                    ) : null
                }
            />
            <View style={styles.mobileBottomBar}>
                <BottomBar />
            </View>
            <LimitReachedModal
                visible={showLimitModal}
                onClose={() => setShowLimitModal(false)}
                onBack={() => setShowLimitModal(false)}
                remaining={remaining}
                limit={limit}
            />

        </View>
    );
}

// ── Web styles (not StyleSheet — uses web-specific values) ────────────
const webStyles = {
    root: {
        display: 'flex' as any,
        flexDirection: 'column' as any,
        height: '100dvh',
        backgroundColor: COLORS.background,
        overflow: 'hidden' as any,
    } as any,
    topSection: {
        flexShrink: 0,
        position: 'relative' as any,
        zIndex: 200 as any,
        overflow: 'visible' as any,
    } as any,
    gridScroll: {
        flex: 1,
        overflowY: 'auto' as any,
        position: 'relative' as any,
        zIndex: 1 as any,
    } as any,
    gridContent: {
        paddingBottom: 16,
    } as any,
    row: {
        flexDirection: 'row' as any,
        gap: SPACING.sm,
        marginBottom: SPACING.sm,
    } as any,
};

// ── Shared StyleSheet ─────────────────────────────────────────────────
const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: COLORS.background },

    header: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: SPACING.md,
        paddingTop: SPACING.xxl,
        paddingBottom: SPACING.sm,
    },
    backBtn: { paddingVertical: SPACING.xs, paddingRight: SPACING.sm },
    backBtnHover: { opacity: 0.85 },
    backBtnText: { color: COLORS.primary, fontSize: 16, fontWeight: '600' },
    title: { fontSize: 20, fontWeight: '800', color: COLORS.text },

    searchContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: COLORS.surface,
        borderRadius: RADIUS.lg,
        marginHorizontal: SPACING.md,
        paddingHorizontal: SPACING.md,
        marginBottom: SPACING.sm,
        borderWidth: 1,
        borderColor: COLORS.border,
        height: 48,
    },
    searchContainerFocused: {
        borderColor: COLORS.primary,
        shadowColor: COLORS.primary,
        shadowOffset: { width: 0, height: 0 },
        shadowOpacity: 0.25,
        shadowRadius: 8,
        elevation: 4,
    },
    searchIcon: { fontSize: 15, marginRight: SPACING.sm },
    searchInput: { flex: 1, color: COLORS.text, fontSize: 14 },
    searchInputWeb: {
        outlineStyle: 'none',
        outlineWidth: 0,
        boxShadow: 'none',
    } as any,
    clearBtn: { color: COLORS.textMuted, fontSize: 16, padding: 4 },

    filterArea: {
        marginHorizontal: SPACING.md,
        marginBottom: SPACING.xs,
        position: 'relative',
        zIndex: 120,
    },
    filterRow: {
        flexDirection: 'row',
        gap: SPACING.xs,
        zIndex: 30,
    },
    dropdownColumn: {
        flex: 1,
        position: 'relative',
    },
    dropdownColumnOpen: {
        zIndex: 40,
    },
    dropdownTrigger: {
        backgroundColor: COLORS.surface,
        borderRadius: RADIUS.lg,
        borderWidth: 1,
        borderColor: COLORS.border,
        paddingHorizontal: SPACING.sm,
        paddingVertical: 8,
    },
    dropdownTriggerDisabled: { opacity: 0.5 },
    dropdownTriggerHover: { borderColor: '#444444' },
    dropdownLabel: {
        color: COLORS.textMuted,
        fontSize: 10,
        fontWeight: '700',
        textTransform: 'uppercase',
        letterSpacing: 0.6,
        marginBottom: 2,
    },
    dropdownValue: {
        color: COLORS.text,
        fontSize: 13,
        fontWeight: '600',
        paddingRight: 18,
    },
    dropdownArrow: {
        position: 'absolute',
        right: 10,
        top: 18,
        color: COLORS.textSecondary,
        fontSize: 12,
    },

    resultsText: {
        color: COLORS.textMuted,
        fontSize: 12,
        marginHorizontal: SPACING.md,
        marginTop: SPACING.xs,
        marginBottom: SPACING.sm,
    },

    listContent: { paddingHorizontal: SPACING.md, paddingBottom: 130 },
    mobileRow: { justifyContent: 'space-between', marginBottom: SPACING.sm },
    loadMoreBtn: {
        marginTop: SPACING.sm,
        marginBottom: SPACING.sm,
        alignSelf: 'center',
        borderWidth: 1,
        borderColor: COLORS.border,
        backgroundColor: COLORS.surface,
        borderRadius: RADIUS.lg,
        paddingHorizontal: SPACING.lg,
        paddingVertical: SPACING.sm,
    },
    loadMoreBtnHover: {
        borderColor: '#4A4A4A',
    },
    loadMoreBtnText: {
        color: COLORS.textSecondary,
        fontSize: 13,
        fontWeight: '700',
    },
    mobileLoadMoreBtn: {
        marginTop: SPACING.sm,
        marginBottom: SPACING.md,
        alignSelf: 'center',
        borderWidth: 1,
        borderColor: COLORS.border,
        backgroundColor: COLORS.surface,
        borderRadius: RADIUS.lg,
        paddingHorizontal: SPACING.lg,
        paddingVertical: SPACING.sm,
    },
    mobileLoadMoreText: {
        color: COLORS.textSecondary,
        fontSize: 13,
        fontWeight: '700',
    },

    carpetCard: {
        backgroundColor: COLORS.surface,
        borderRadius: RADIUS.lg,
        overflow: 'hidden',
        borderWidth: 2,
        borderColor: 'transparent',
    },
    carpetCardHover: { borderColor: '#343434' },
    carpetCardSelected: { borderColor: COLORS.primary },
    imageFrame: {
        width: '100%',
        backgroundColor: COLORS.surfaceElevated,
        padding: SPACING.xs,
    },
    carpetImage: { width: '100%', height: '100%' },
    noImage: { backgroundColor: COLORS.surfaceElevated, alignItems: 'center', justifyContent: 'center' },
    noImageText: { fontSize: 32 },
    selectedBadge: {
        position: 'absolute', top: 8, right: 8,
        width: 26, height: 26, borderRadius: 13,
        backgroundColor: COLORS.primary, alignItems: 'center', justifyContent: 'center',
    },
    selectedBadgeText: { color: COLORS.white, fontSize: 13, fontWeight: '700' },
    carpetInfo: { padding: SPACING.sm },
    badgeRow: { flexDirection: 'row', marginBottom: 4 },
    brandBadge: {
        backgroundColor: COLORS.surfaceElevated,
        borderRadius: RADIUS.sm,
        paddingHorizontal: 6, paddingVertical: 2,
    },
    brandBadgeText: { color: COLORS.primary, fontSize: 10, fontWeight: '700', letterSpacing: 0.5 },
    carpetName: { color: COLORS.text, fontSize: 13, fontWeight: '600', marginBottom: 2 },
    carpetCollection: { color: COLORS.textSecondary, fontSize: 11, marginBottom: 2 },
    carpetSize: { color: COLORS.textMuted, fontSize: 11 },

    emptyContainer: { alignItems: 'center', paddingTop: 60 },
    emptyIcon: { fontSize: 48, marginBottom: SPACING.md },
    emptyText: { color: COLORS.text, fontSize: 18, fontWeight: '700', marginBottom: SPACING.xs },
    emptySubtext: { color: COLORS.textSecondary, fontSize: 14 },

    dropdownMenu: {
        position: 'absolute',
        top: '100%',
        left: 0,
        right: 0,
        marginTop: 6,
        backgroundColor: COLORS.surface,
        borderRadius: RADIUS.lg,
        borderWidth: 1,
        borderColor: COLORS.border,
        paddingVertical: SPACING.xs,
        shadowColor: COLORS.black,
        shadowOffset: { width: 0, height: 6 },
        shadowOpacity: 0.25,
        shadowRadius: 10,
        elevation: 8,
        zIndex: 999,
    },
    dropdownMenuList: {
        maxHeight: 220,
        paddingHorizontal: SPACING.xs,
    },
    dropdownMenuItem: {
        borderRadius: RADIUS.md,
        paddingHorizontal: SPACING.md,
        paddingVertical: SPACING.sm,
    },
    dropdownMenuItemHover: { backgroundColor: '#232323' },
    dropdownMenuItemActive: { backgroundColor: COLORS.surfaceElevated },
    dropdownMenuItemText: { color: COLORS.textSecondary, fontSize: 14, fontWeight: '600' },
    dropdownMenuItemTextActive: { color: COLORS.primary },

    // Bottom bar — shared between web and mobile
    bottomBar: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: COLORS.surfaceElevated,
        paddingHorizontal: SPACING.md,
        paddingVertical: SPACING.md,
        ...(isWeb ? ({ paddingBottom: 'max(12px, env(safe-area-inset-bottom))' } as any) : {}),
        borderTopWidth: 1,
        borderTopColor: COLORS.border,
        gap: SPACING.md,
        minHeight: 72,
    },
    mobileBottomBar: {
        position: 'absolute',
        bottom: 0, left: 0, right: 0,
    },
    hintText: { color: COLORS.textMuted, fontSize: 13, textAlign: 'center', flex: 1 },
    selectionThumb: { width: 52, height: 52, borderRadius: RADIUS.md },
    selectionInfo: { flex: 1 },
    selectionBrand: { color: COLORS.primary, fontSize: 11, fontWeight: '700' },
    selectionName: { color: COLORS.text, fontSize: 15, fontWeight: '600' },
    limitErrorText: { color: '#CC7B7B', fontSize: 11, marginTop: 2 },
    btnGroup: { flexDirection: 'column', gap: 6 },
    placeBtn: {
        backgroundColor: COLORS.primary,
        borderRadius: RADIUS.lg,
        paddingHorizontal: SPACING.md, paddingVertical: 7,
        alignItems: 'center', flexDirection: 'row', gap: 4,
        shadowColor: COLORS.primary,
        shadowOffset: { width: 0, height: 3 },
        shadowOpacity: 0.4, shadowRadius: 6, elevation: 5,
    },
    placeBtnHover: { backgroundColor: COLORS.primaryLight },
    placeBtnDisabled: {
        opacity: 0.65,
    },
    placeBtnIcon: { fontSize: 15 },
    placeBtnText: { color: COLORS.white, fontSize: 13, fontWeight: '700' },
});
