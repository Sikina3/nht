import { Text, View } from "@/components/Themed";
import { useColorScheme } from "@/components/useColorScheme";
import Colors from "@/constants/Colors";
import { useAuth } from "@/context/AuthContext";
import {
    DownloadedStory,
    ReadingProgress,
    deleteDownload,
    estimateDownloadSize,
    getAllDownloads,
    getAllReadingProgress,
    getReadingProgress,
} from "@/services/downloadService";
import { getImageUrl } from "@/utils/imageHelper";
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import React, { useCallback, useEffect, useState } from "react";
import {
    Alert,
    Dimensions,
    FlatList,
    Image,
    Pressable,
    RefreshControl,
    ScrollView,
    StyleSheet,
    TouchableOpacity,
} from "react-native";

const { width } = Dimensions.get("window");

// ═══════════════════════════════════════════════════════════════
//  Carte "En cours de lecture"
// ═══════════════════════════════════════════════════════════════
function ReadingCard({
    item,
    onPress,
    C,
}: {
    item: ReadingProgress;
    onPress: () => void;
    C: (typeof Colors)["light"];
}) {
    const imageUri = getImageUrl(item.storyImage);

    const timeAgo = (iso: string) => {
        const diff = Date.now() - new Date(iso).getTime();
        const h = Math.floor(diff / 3600000);
        const d = Math.floor(diff / 86400000);
        if (d > 0) return `il y a ${d}j`;
        if (h > 0) return `il y a ${h}h`;
        return "tout à l'heure";
    };

    return (
        <TouchableOpacity style={[styles.readingCard, { backgroundColor: C.secondary, borderColor: C.borderColor }]} onPress={onPress} activeOpacity={0.75}>
            <Image source={{ uri: imageUri }} style={styles.readingImage} />
            <View style={styles.readingInfo}>
                <Text style={[styles.readingTitle]} numberOfLines={1}>
                    {item.storyTitle}
                </Text>
                <Text style={[styles.readingMeta, { color: C.medium }]}>
                    {item.auteurNom}
                </Text>
                <Text style={[styles.readingChapter, { color: C.medium }]} numberOfLines={1}>
                    Chap. {item.chapterNumber}
                    {item.chapterTitle ? ` — ${item.chapterTitle}` : ""}
                </Text>

                {/* Barre de progression */}
                <View style={styles.progressBg}>
                    <View
                        style={[
                            styles.progressFill,
                            { width: `${item.progress}%`, backgroundColor: C.primary },
                        ]}
                    />
                </View>
                <View style={styles.progressRow}>
                    <Text style={[styles.progressLabel, { color: C.medium }]}>
                        {item.progress}% lu
                    </Text>
                    <Text style={[styles.progressLabel, { color: C.medium }]}>
                        {timeAgo(item.lastReadAt)}
                    </Text>
                </View>
            </View>

            {/* Bouton continuer */}
            <View style={[styles.continueBtn, { backgroundColor: C.primary }]}>
                <Ionicons name="play" size={14} color="#fff" />
            </View>
        </TouchableOpacity>
    );
}

// ═══════════════════════════════════════════════════════════════
//  Carte "Téléchargée / Hors-ligne"
// ═══════════════════════════════════════════════════════════════
function DownloadCard({
    item,
    onPress,
    onDelete,
    C,
}: {
    item: DownloadedStory;
    onPress: () => void;
    onDelete: () => void;
    C: (typeof Colors)["light"];
}) {
    const imageUri = getImageUrl(item.photoCouverture);

    const size = estimateDownloadSize(item);

    return (
        <TouchableOpacity
            style={[styles.downloadCard, { backgroundColor: C.secondary, borderColor: C.borderColor }]}
            onPress={onPress}
            activeOpacity={0.75}
        >
            <Image source={{ uri: imageUri }} style={styles.downloadImage} />
            <View style={styles.downloadInfo}>
                <Text style={styles.downloadTitle} numberOfLines={2}>
                    {item.titre}
                </Text>
                <Text style={[styles.downloadMeta, { color: C.medium }]}>
                    {item.auteurNom}
                </Text>
                <View style={styles.downloadBadgeRow}>
                    <View style={[styles.badge, { backgroundColor: "rgba(59,130,246,0.15)" }]}>
                        <Ionicons name="cloud-offline-outline" size={11} color="#3B82F6" style={{ marginRight: 4 }} />
                        <Text style={[styles.badgeText, { color: "#3B82F6" }]}>Hors-ligne</Text>
                    </View>
                    <View style={[styles.badge, { backgroundColor: C.gray }]}>
                        <Text style={[styles.badgeText, { color: C.medium }]}>
                            {item.chapters.length} chap.
                        </Text>
                    </View>
                    <View style={[styles.badge, { backgroundColor: C.gray }]}>
                        <Text style={[styles.badgeText, { color: C.medium }]}>{size}</Text>
                    </View>
                </View>
            </View>

            {/* Supprimer */}
            <TouchableOpacity
                style={styles.deleteBtn}
                onPress={onDelete}
                hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
            >
                <Ionicons name="trash-outline" size={18} color="#FF4D4D" />
            </TouchableOpacity>
        </TouchableOpacity>
    );
}

// ═══════════════════════════════════════════════════════════════
//  Écran BIBLIOTHÈQUE principal
// ═══════════════════════════════════════════════════════════════
type Tab = "reading" | "offline";

export default function LibraryScreen() {
    const theme = useColorScheme() ?? "light";
    const C = Colors[theme];
    const router = useRouter();
    const { user } = useAuth();

    const [activeTab, setActiveTab] = useState<Tab>("reading");
    const [readingList, setReadingList] = useState<ReadingProgress[]>([]);
    const [downloads, setDownloads] = useState<DownloadedStory[]>([]);
    const [refreshing, setRefreshing] = useState(false);
    const [isLoading, setIsLoading] = useState(true);

    const loadData = async () => {
        try {
            const [reading, dl] = await Promise.all([
                getAllReadingProgress(),
                getAllDownloads(),
            ]);
            setReadingList(reading);
            setDownloads(dl);
        } catch (e) {
            console.error("Library load error:", e);
        } finally {
            setIsLoading(false);
            setRefreshing(false);
        }
    };

    useEffect(() => {
        loadData();
    }, []);

    const onRefresh = useCallback(() => {
        setRefreshing(true);
        loadData();
    }, []);

    const handleContinueReading = (item: ReadingProgress) => {
        router.push({
            pathname: "/read-chapter",
            params: {
                chapterId: item.chapterId.toString(),
                storyId: item.storyId.toString(),
                storyTitle: item.storyTitle,
                chapterNumber: item.chapterNumber.toString(),
            },
        });
    };

    const handleOpenOffline = async (story: DownloadedStory) => {
        if (story.chapters.length === 0) return;

        // Chercher la progression de lecture pour reprendre au bon chapitre
        const progress = await getReadingProgress(story.id);

        let targetChapter = story.chapters[0]; // chapitre par défaut : le premier
        if (progress) {
            // Trouver le chapitre correspondant à la progression sauvegardée
            const found = story.chapters.find((ch) => ch.id === progress.chapterId);
            if (found) targetChapter = found;
        }

        router.push({
            pathname: "/read-chapter",
            params: {
                chapterId: targetChapter.id.toString(),
                storyId: story.id.toString(),
                storyTitle: story.titre,
                chapterNumber: targetChapter.numeroChapitre.toString(),
                offline: "true",
            },
        });
    };

    const handleDeleteDownload = (storyId: number, titre: string) => {
        Alert.alert(
            "Supprimer le téléchargement",
            `Voulez-vous supprimer "${titre}" de vos téléchargements ?`,
            [
                { text: "Annuler", style: "cancel" },
                {
                    text: "Supprimer",
                    style: "destructive",
                    onPress: async () => {
                        await deleteDownload(storyId);
                        setDownloads((prev) => prev.filter((d) => d.id !== storyId));
                    },
                },
            ]
        );
    };

    // ── Onglets ────────────────────────────────────────────────
    const TabBtn = ({ tab, label, icon }: { tab: Tab; label: string; icon: string }) => (
        <Pressable
            style={[
                styles.tabBtn,
                activeTab === tab && { borderBottomColor: C.primary, borderBottomWidth: 2 },
            ]}
            onPress={() => setActiveTab(tab)}
        >
            <Ionicons
                name={icon as any}
                size={18}
                color={activeTab === tab ? C.primary : C.medium}
                style={{ marginRight: 6 }}
            />
            <Text
                style={[
                    styles.tabLabel,
                    { color: activeTab === tab ? C.primary : C.medium },
                ]}
            >
                {label}
            </Text>
            {/* Badge compteur */}
            {((tab === "reading" && readingList.length > 0) ||
                (tab === "offline" && downloads.length > 0)) && (
                    <View style={[styles.tabBadge, { backgroundColor: C.primary }]}>
                        <Text style={styles.tabBadgeText}>
                            {tab === "reading" ? readingList.length : downloads.length}
                        </Text>
                    </View>
                )}
        </Pressable>
    );

    // ── État vide ───────────────────────────────────────────────
    const EmptyState = ({
        icon,
        title,
        subtitle,
    }: {
        icon: string;
        title: string;
        subtitle: string;
    }) => (
        <View style={styles.emptyContainer}>
            <View style={[styles.emptyIconBox, { backgroundColor: C.secondary }]}>
                <Ionicons name={icon as any} size={44} color={C.medium} />
            </View>
            <Text style={[styles.emptyTitle, { color: C.text }]}>{title}</Text>
            <Text style={[styles.emptySubtitle, { color: C.medium }]}>{subtitle}</Text>
            <Pressable
                style={[styles.emptyBtn, { backgroundColor: C.primary }]}
                onPress={() => router.push("/")}
            >
                <Text style={styles.emptyBtnText}>Explorer les histoires</Text>
            </Pressable>
        </View>
    );

    return (
        <View style={[styles.container, { backgroundColor: C.background }]}>
            {/* ── En-tête utilisateur ── */}
            <View style={[styles.userHeader, { backgroundColor: C.background }]}>
                <View>
                    <Text style={[styles.greet, { color: C.medium }]}>Bonjour,</Text>
                    <Text style={[styles.userName]}>{user?.nom ?? "Lecteur"}</Text>
                </View>
                <View style={[styles.coinsBox, { backgroundColor: C.secondary }]}>
                    <Ionicons name="logo-bitcoin" size={16} color="#FFD700" />
                    <Text style={[styles.coinsText, { color: "#FFD700" }]}>
                        {user?.soldeCoins ?? 0}
                    </Text>
                </View>
            </View>

            {/* ── Stats rapides ── */}
            <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                style={styles.statsRow}
                contentContainerStyle={{ paddingHorizontal: 20, gap: 12 }}
            >
                {[
                    {
                        icon: "book-outline",
                        value: readingList.length,
                        label: "En cours",
                        color: C.primary,
                    },
                    {
                        icon: "cloud-offline-outline",
                        value: downloads.length,
                        label: "Téléchargés",
                        color: "#3B82F6",
                    },
                    {
                        icon: "checkmark-circle-outline",
                        value: readingList.filter((r) => r.progress === 100).length,
                        label: "Terminés",
                        color: "#4ADE80",
                    },
                ].map((stat) => (
                    <View
                        key={stat.label}
                        style={[styles.statCard, { backgroundColor: C.secondary, borderColor: C.borderColor }]}
                    >
                        <Ionicons name={stat.icon as any} size={22} color={stat.color} />
                        <Text style={[styles.statValue, { color: stat.color }]}>
                            {stat.value}
                        </Text>
                        <Text style={[styles.statLabel, { color: C.medium }]}>
                            {stat.label}
                        </Text>
                    </View>
                ))}
            </ScrollView>

            {/* ── Onglets ── */}
            <View style={[styles.tabBar, { borderBottomColor: C.borderColor }]}>
                <TabBtn tab="reading" label="En cours" icon="book-outline" />
                <TabBtn tab="offline" label="Hors-ligne" icon="cloud-offline-outline" />
            </View>

            {/* ── Contenu ── */}
            {activeTab === "reading" ? (
                <FlatList
                    data={readingList}
                    keyExtractor={(item) => item.storyId.toString()}
                    contentContainerStyle={styles.listContent}
                    showsVerticalScrollIndicator={false}
                    refreshControl={
                        <RefreshControl
                            refreshing={refreshing}
                            onRefresh={onRefresh}
                            colors={[C.primary]}
                            tintColor={C.primary}
                        />
                    }
                    renderItem={({ item }) => (
                        <ReadingCard
                            item={item}
                            onPress={() => handleContinueReading(item)}
                            C={C}
                        />
                    )}
                    ListEmptyComponent={
                        !isLoading ? (
                            <EmptyState
                                icon="book-outline"
                                title="Aucune lecture en cours"
                                subtitle="Commencez à lire une histoire et elle apparaîtra ici automatiquement."
                            />
                        ) : null
                    }
                    ListFooterComponent={() => <View style={{ height: 100 }} />}
                />
            ) : (
                <FlatList
                    data={downloads}
                    keyExtractor={(item) => item.id.toString()}
                    contentContainerStyle={styles.listContent}
                    showsVerticalScrollIndicator={false}
                    refreshControl={
                        <RefreshControl
                            refreshing={refreshing}
                            onRefresh={onRefresh}
                            colors={[C.primary]}
                            tintColor={C.primary}
                        />
                    }
                    renderItem={({ item }) => (
                        <DownloadCard
                            item={item}
                            onPress={() => handleOpenOffline(item)}
                            onDelete={() => handleDeleteDownload(item.id, item.titre)}
                            C={C}
                        />
                    )}
                    ListHeaderComponent={
                        downloads.length > 0 ? (
                            <View style={styles.offlineInfo}>
                                <Ionicons name="information-circle-outline" size={14} color={C.medium} />
                                <Text style={[styles.offlineInfoText, { color: C.medium }]}>
                                    Ces histoires sont disponibles sans connexion internet.
                                </Text>
                            </View>
                        ) : null
                    }
                    ListEmptyComponent={
                        !isLoading ? (
                            <EmptyState
                                icon="cloud-offline-outline"
                                title="Aucun téléchargement"
                                subtitle="Téléchargez des histoires depuis leur page de détails pour les lire sans connexion."
                            />
                        ) : null
                    }
                    ListFooterComponent={() => <View style={{ height: 100 }} />}
                />
            )}
        </View>
    );
}

// ─── Styles ───────────────────────────────────────────────────
const styles = StyleSheet.create({
    container: { flex: 1 },

    // Header utilisateur
    userHeader: {
        flexDirection: "row",
        justifyContent: "space-between",
        alignItems: "center",
        paddingHorizontal: 20,
        paddingTop: 10,
        paddingBottom: 16,
    },
    greet: { fontSize: 13, fontWeight: "500" },
    userName: { fontSize: 20, fontWeight: "800", color: "#fff", marginTop: 2 },
    coinsBox: {
        flexDirection: "row",
        alignItems: "center",
        paddingHorizontal: 12,
        paddingVertical: 7,
        borderRadius: 20,
        gap: 6,
    },
    coinsText: { fontSize: 14, fontWeight: "700" },

    // Stats
    statsRow: { flexGrow: 0, marginBottom: 16 },
    statCard: {
        alignItems: "center",
        paddingVertical: 14,
        paddingHorizontal: 20,
        borderRadius: 16,
        borderWidth: 1,
        gap: 4,
        minWidth: 90,
    },
    statValue: { fontSize: 22, fontWeight: "800" },
    statLabel: { fontSize: 11, fontWeight: "500" },

    // Onglets
    tabBar: {
        flexDirection: "row",
        borderBottomWidth: 1,
        marginHorizontal: 20,
        marginBottom: 4,
    },
    tabBtn: {
        flexDirection: "row",
        alignItems: "center",
        paddingVertical: 12,
        paddingHorizontal: 4,
        marginRight: 24,
    },
    tabLabel: { fontSize: 14, fontWeight: "600" },
    tabBadge: {
        marginLeft: 6,
        minWidth: 18,
        height: 18,
        borderRadius: 9,
        alignItems: "center",
        justifyContent: "center",
        paddingHorizontal: 4,
    },
    tabBadgeText: { fontSize: 10, color: "#fff", fontWeight: "700" },

    // Liste
    listContent: { paddingHorizontal: 20, paddingTop: 12 },

    // Carte "En cours"
    readingCard: {
        flexDirection: "row",
        borderRadius: 16,
        padding: 12,
        marginBottom: 12,
        borderWidth: 1,
        alignItems: "center",
    },
    readingImage: { width: 60, height: 85, borderRadius: 10 },
    readingInfo: { flex: 1, marginLeft: 14, backgroundColor: "transparent" },
    readingTitle: {
        fontSize: 15,
        fontWeight: "700",
        color: "#fff",
        marginBottom: 2,
    },
    readingMeta: { fontSize: 12, marginBottom: 4 },
    readingChapter: { fontSize: 12, marginBottom: 8 },
    progressBg: {
        height: 4,
        backgroundColor: "rgba(255,255,255,0.1)",
        borderRadius: 2,
        overflow: "hidden",
        marginBottom: 4,
    },
    progressFill: { height: "100%", borderRadius: 2 },
    progressRow: {
        flexDirection: "row",
        justifyContent: "space-between",
        backgroundColor: "transparent",
    },
    progressLabel: { fontSize: 10, fontWeight: "500" },
    continueBtn: {
        width: 34,
        height: 34,
        borderRadius: 17,
        justifyContent: "center",
        alignItems: "center",
        marginLeft: 10,
    },

    // Carte "Téléchargée"
    downloadCard: {
        flexDirection: "row",
        borderRadius: 16,
        padding: 12,
        marginBottom: 12,
        borderWidth: 1,
        alignItems: "center",
    },
    downloadImage: { width: 60, height: 85, borderRadius: 10 },
    downloadInfo: { flex: 1, marginLeft: 14, backgroundColor: "transparent" },
    downloadTitle: {
        fontSize: 15,
        fontWeight: "700",
        color: "#fff",
        marginBottom: 3,
    },
    downloadMeta: { fontSize: 12, marginBottom: 8 },
    downloadBadgeRow: {
        flexDirection: "row",
        gap: 6,
        flexWrap: "wrap",
        backgroundColor: "transparent",
    },
    badge: {
        flexDirection: "row",
        alignItems: "center",
        paddingHorizontal: 8,
        paddingVertical: 3,
        borderRadius: 6,
    },
    badgeText: { fontSize: 10, fontWeight: "600" },
    deleteBtn: { padding: 8, marginLeft: 4 },

    // Bandeau info hors-ligne
    offlineInfo: {
        flexDirection: "row",
        alignItems: "center",
        gap: 6,
        marginBottom: 12,
        backgroundColor: "transparent",
    },
    offlineInfoText: { fontSize: 12, flex: 1 },

    // État vide
    emptyContainer: {
        alignItems: "center",
        paddingTop: 60,
        paddingHorizontal: 30,
        gap: 12,
        backgroundColor: "transparent",
    },
    emptyIconBox: {
        width: 90,
        height: 90,
        borderRadius: 45,
        justifyContent: "center",
        alignItems: "center",
        marginBottom: 8,
    },
    emptyTitle: { fontSize: 18, fontWeight: "700" },
    emptySubtitle: { fontSize: 14, textAlign: "center", lineHeight: 20 },
    emptyBtn: {
        marginTop: 8,
        paddingHorizontal: 24,
        paddingVertical: 12,
        borderRadius: 24,
    },
    emptyBtnText: { color: "#fff", fontWeight: "700", fontSize: 14 },
});
