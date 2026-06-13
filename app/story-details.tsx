import { Text, View } from '@/components/Themed';
import StoryHeader from '@/components/story/StoryHeader';
import { useColorScheme } from '@/components/useColorScheme';
import Colors from '@/constants/Colors';
import { useAuth } from '@/context/AuthContext';
import api from '@/services/api';
import {
    DownloadedStory,
    deleteDownload,
    isDownloaded,
    saveDownload,
} from '@/services/downloadService';
import { getImageUrl } from '@/utils/imageHelper';
import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useLocalSearchParams, useRouter } from 'expo-router';
import React, { useCallback, useEffect, useState } from 'react';
import {
    ActivityIndicator,
    Alert,
    RefreshControl,
    ScrollView,
    StyleSheet,
    TouchableOpacity,
} from 'react-native';


interface Story {
    id: number;
    titre: string;
    description: string;
    photoCouverture: string | null;
    categories: string;
    prixCoins: number;
    vues?: number;
    likes?: number;
    auteur?: { id: number; nom: string };
}

interface Chapter {
    id: number;
    sousTitre: string;
    numeroChapitre: number;
    coutCoins: number;
    contenu?: string;
    dateCreation?: string;
}

export default function StoryDetailsScreen() {
    const router = useRouter();
    const theme = useColorScheme() ?? 'light';
    const C = Colors[theme];
    const params = useLocalSearchParams();
    const { user } = useAuth();
    const storyId = params.storyId as string;

    const [story, setStory] = useState<Story | null>(null);
    const [chapters, setChapters] = useState<Chapter[]>([]);
    const [isSubscribed, setIsSubscribed] = useState(false);
    const [isLoading, setIsLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [downloaded, setDownloaded] = useState(false);
    const [downloading, setDownloading] = useState(false);


    useEffect(() => {
        loadStoryDetails();
    }, [storyId]);

    useEffect(() => {
        isDownloaded(parseInt(storyId)).then(setDownloaded);
    }, [storyId]);

    const loadStoryDetails = async () => {
        try {
            const storyResponse = await api.get(`/stories/${storyId}`);
            const storyData = storyResponse.data;
            setStory(storyData);

            const chaptersResponse = await api.get(`/chapters/story/${storyId}`);
            setChapters(chaptersResponse.data);

            if (user) {
                api.post(`/history/add?userId=${user.id}&storyId=${storyId}`).catch(e => console.error(e));
            }

            if (user && storyData?.auteur?.id) {
                try {
                    const followRes = await api.get(`/users/${user.id}/is-following/${storyData.auteur.id}`);
                    setIsSubscribed(followRes.data.following);
                } catch (followError) {
                    console.error("Erreur vérification abonnement:", followError);
                }
            }
        } catch (error) {
            console.error('Erreur lors du chargement:', error);
        } finally {
            setIsLoading(false);
            setRefreshing(false);
        }
    };

    const onRefresh = useCallback(() => {
        setRefreshing(true);
        loadStoryDetails();
    }, [storyId]);

    const persistStoryMeta = async () => {
        if (!story) return;
        const coverUrl = getImageUrl(story.photoCouverture);
        const auteurNom = story.auteur?.nom ?? 'Auteur inconnu';
        await Promise.all([
            coverUrl
                ? AsyncStorage.setItem(`story_cover_${storyId}`, coverUrl)
                : Promise.resolve(),
            AsyncStorage.setItem(`story_auteur_${storyId}`, auteurNom),
        ]);
    };

    const handleReadChapter = async (chapter: Chapter) => {
        await persistStoryMeta(); 
        router.push({
            pathname: '/read-chapter',
            params: {
                chapterId: chapter.id.toString(),
                storyId: storyId,
                storyTitle: story?.titre ?? '',
                chapterNumber: chapter.numeroChapitre.toString(),
            },
        });
    };

    const handleSubscribe = async () => {
        if (!user) {
            Alert.alert('Connexion requise', 'Veuillez vous connecter pour vous abonner.');
            return;
        }
        if (!story?.auteur?.id) return;

        try {
            if (isSubscribed) {
                await api.post(`/users/${user.id}/unfollow/${story.auteur.id}`);
                setIsSubscribed(false);
            } else {
                await api.post(`/users/${user.id}/follow/${story.auteur.id}`);
                setIsSubscribed(true);
            }
        } catch (error) {
            console.error(error);
            Alert.alert('Erreur', 'Impossible de modifier l\'abonnement.');
        }
    };

    const handleDownload = async () => {
        if (!story) return;

        if (downloaded) {
            Alert.alert(
                'Supprimer le téléchargement',
                `Voulez-vous supprimer "${story.titre}" de vos téléchargements ?`,
                [
                    { text: 'Annuler', style: 'cancel' },
                    {
                        text: 'Supprimer',
                        style: 'destructive',
                        onPress: async () => {
                            await deleteDownload(story.id);
                            setDownloaded(false);
                        },
                    },
                ]
            );
            return;
        }

        setDownloading(true);
        try {
            let fullChapters = chapters;
            if (chapters.length > 0 && !chapters[0].contenu) {
                const response = await api.get(`/chapters/story/${storyId}`);
                fullChapters = response.data;
            }

            if (fullChapters.length === 0) {
                Alert.alert('Aucun chapitre', 'Cette histoire ne contient pas encore de chapitres à télécharger.');
                return;
            }

            const storyToSave: DownloadedStory = {
                id: story.id,
                titre: story.titre,
                description: story.description,
                photoCouverture: getImageUrl(story.photoCouverture),
                categories: story.categories,
                auteurNom: story.auteur?.nom ?? 'Auteur inconnu',
                chapters: fullChapters.map((ch) => ({
                    id: ch.id,
                    numeroChapitre: ch.numeroChapitre,
                    sousTitre: ch.sousTitre,
                    contenu: ch.contenu ?? '',
                })),
                downloadedAt: new Date().toISOString(),
                totalChapters: fullChapters.length,
            };

            await saveDownload(storyToSave);
            setDownloaded(true);
            Alert.alert(
                '✅ Téléchargé !',
                `"${story.titre}" est maintenant disponible hors-ligne dans votre bibliothèque.`
            );
        } catch (error) {
            console.error('Erreur téléchargement:', error);
            Alert.alert('Erreur', 'Impossible de télécharger cette histoire. Vérifiez votre connexion.');
        } finally {
            setDownloading(false);
        }
    };

    if (isLoading) {
        return (
            <View style={styles.loadingContainer}>
                <ActivityIndicator size="large" color={C.primary} />
            </View>
        );
    }

    if (!story) {
        return (
            <View style={styles.errorContainer}>
                <Text style={{ color: C.text }}>Histoire introuvable</Text>
            </View>
        );
    }

    return (
        <View style={styles.container}>
            <ScrollView
                showsVerticalScrollIndicator={false}
                refreshControl={
                    <RefreshControl
                        refreshing={refreshing}
                        onRefresh={onRefresh}
                        colors={[C.primary]}
                        tintColor={C.primary}
                    />
                }
            >
                {/* Header avec couverture */}
                <StoryHeader
                    title={story.titre}
                    author={story.auteur?.nom || 'Auteur inconnu'}
                    coverImage={getImageUrl(story.photoCouverture)}
                    category={story.categories}
                    chaptersCount={chapters.length}
                    vues={story.vues ?? 0}
                    likes={story.likes ?? 0}
                    onBackPress={() => router.back()}
                />

                {/* Boutons d'action */}
                <View style={styles.actionSection}>
                    {/* S'abonner */}
                    <TouchableOpacity
                        style={[
                            styles.subscribeButton,
                            { backgroundColor: C.primary, shadowColor: C.primary },
                            isSubscribed && [styles.subscribedButton, { backgroundColor: C.cardBgHover, borderColor: C.borderColor }],
                        ]}
                        onPress={handleSubscribe}
                        activeOpacity={0.85}
                    >
                        <Ionicons
                            name={isSubscribed ? 'checkmark-circle' : 'person-add'}
                            size={20}
                            color="white"
                        />
                        <Text style={[styles.subscribeButtonText, { color: isSubscribed ? C.text : 'white' }]}>
                            {isSubscribed ? 'Déjà abonné' : "S'abonner à l'auteur"}
                        </Text>
                    </TouchableOpacity>

                    {/* Télécharger */}
                    <TouchableOpacity
                        style={[
                            styles.downloadButton,
                            { backgroundColor: C.primaryAlpha5, borderColor: C.primary },
                            downloaded && styles.downloadedButton,
                            downloading && styles.downloadingButton,
                        ]}
                        onPress={handleDownload}
                        disabled={downloading}
                        activeOpacity={0.85}
                    >
                        {downloading ? (
                            <ActivityIndicator size="small" color={C.primary} />
                        ) : (
                            <Ionicons
                                name={
                                    downloaded
                                        ? 'cloud-done'
                                        : 'cloud-download-outline'
                                }
                                size={20}
                                color={downloaded ? '#4ADE80' : C.primary}
                            />
                        )}
                        <Text
                            style={[
                                styles.downloadButtonText,
                                { color: downloaded ? '#4ADE80' : C.primary },
                            ]}
                        >
                            {downloading
                                ? 'Téléchargement...'
                                : downloaded
                                    ? 'Téléchargé ✓'
                                    : 'Lire hors-ligne'}
                        </Text>
                    </TouchableOpacity>
                </View>

                <View style={styles.section}>
                    <Text style={[styles.sectionTitle, { color: C.text }]}>Synopsis</Text>
                    <Text style={[styles.description, { color: C.textMuted }]}>{story.description}</Text>
                </View>

                {/* Liste des chapitres */}
                <View style={[styles.section, { marginBottom: 40 }]}>
                    <View style={styles.chapterHeader}>
                        <Text style={[styles.sectionTitle, { color: C.text }]}>Chapitres</Text>
                        <Text style={[styles.chapterCount, { color: C.textHint }]}>{chapters.length} Chapitres</Text>
                    </View>

                    {chapters.length > 0 ? (
                        chapters.map((chapter) => (
                            <TouchableOpacity
                                key={chapter.id}
                                style={[styles.chapterItem, { backgroundColor: C.cardBg, borderColor: C.borderColor }]}
                                onPress={() => handleReadChapter(chapter)}
                                activeOpacity={0.7}
                            >
                                <View style={styles.chapterLeft}>
                                    <View
                                        style={[
                                            styles.chapterNumberBadge,
                                            { backgroundColor: C.primary + '20' },
                                        ]}
                                    >
                                        <Text
                                            style={[
                                                styles.chapterNumberText,
                                                { color: C.primary },
                                            ]}
                                        >
                                            {chapter.numeroChapitre}
                                        </Text>
                                    </View>
                                    <View style={styles.chapterInfo}>
                                        <Text style={[styles.chapterTitle, { color: C.text }]} numberOfLines={1}>
                                            {chapter.sousTitre ||
                                                `Chapitre ${chapter.numeroChapitre}`}
                                        </Text>
                                        <View style={styles.chapterMeta}>
                                            {chapter.coutCoins > 0 && (
                                                <View style={styles.coinsBadge}>
                                                    <Ionicons
                                                        name="flash"
                                                        size={10}
                                                        color="#FFD700"
                                                    />
                                                    <Text style={styles.coinsText}>
                                                        {chapter.coutCoins} coins
                                                    </Text>
                                                </View>
                                            )}
                                        </View>
                                    </View>
                                </View>
                                <Ionicons
                                    name="play-circle"
                                    size={28}
                                    color={C.primary}
                                />
                            </TouchableOpacity>
                        ))
                    ) : (
                        <View style={[styles.emptyChapters, { backgroundColor: C.cardBg }]}>
                            <Ionicons
                                name="book-outline"
                                size={40}
                                color={C.icon}
                            />
                            <Text style={[styles.emptyText, { color: C.textHint }]}>
                                Aucun chapitre disponible
                            </Text>
                        </View>
                    )}
                </View>
            </ScrollView>
        </View>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1 },
    loadingContainer: { flex: 1, justifyContent: 'center', alignItems: 'center' },
    errorContainer: { flex: 1, justifyContent: 'center', alignItems: 'center' },

    // Boutons d'action
    actionSection: {
        paddingHorizontal: 20,
        marginTop: 10,
        zIndex: 100,
        gap: 10,
    },
    subscribeButton: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: 14,
        borderRadius: 16,
        gap: 10,
        shadowOffset: { width: 0, height: 8 },
        shadowOpacity: 0.3,
        shadowRadius: 12,
        elevation: 10,
    },
    subscribedButton: {
        shadowOpacity: 0,
        elevation: 0,
        borderWidth: 1,
    },
    subscribeButtonText: {
        color: 'white',
        fontSize: 15,
        fontWeight: '800',
    },
    downloadButton: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: 13,
        borderRadius: 16,
        gap: 8,
        borderWidth: 1.5,
    },
    downloadedButton: {
        backgroundColor: 'rgba(74,222,128,0.08)',
        borderColor: '#4ADE80',
    },
    downloadingButton: {
        opacity: 0.6,
    },
    downloadButtonText: {
        fontSize: 14,
        fontWeight: '700',
    },

    // Sections
    section: { paddingHorizontal: 20, marginTop: 30 },
    sectionTitle: {
        fontSize: 18,
        fontWeight: '900',
        marginBottom: 12,
        letterSpacing: -0.5,
    },
    description: {
        fontSize: 15,
        lineHeight: 24,
        color: 'rgba(255,255,255,0.7)',
        textAlign: 'justify',
    },

    // Chapitres
    chapterHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 20,
    },
    chapterCount: {
        fontSize: 13,
        color: 'rgba(255,255,255,0.4)',
        fontWeight: '600',
    },
    chapterItem: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        backgroundColor: 'rgba(255,255,255,0.03)',
        padding: 16,
        borderRadius: 20,
        marginBottom: 12,
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.05)',
    },
    chapterLeft: {
        flexDirection: 'row',
        alignItems: 'center',
        flex: 1,
        gap: 15,
        backgroundColor: 'transparent',
    },
    chapterNumberBadge: {
        width: 38,
        height: 38,
        borderRadius: 12,
        justifyContent: 'center',
        alignItems: 'center',
    },
    chapterNumberText: { fontSize: 14, fontWeight: '900' },
    chapterInfo: { flex: 1, backgroundColor: 'transparent' },
    chapterTitle: { fontSize: 15, fontWeight: '700', marginBottom: 4 },
    chapterMeta: { flexDirection: 'row', alignItems: 'center', gap: 10 },
    coinsBadge: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 4,
        backgroundColor: 'rgba(255, 215, 0, 0.1)',
        paddingHorizontal: 6,
        paddingVertical: 2,
        borderRadius: 4,
    },
    coinsText: { fontSize: 10, color: '#FFD700', fontWeight: '800' },
    emptyChapters: {
        alignItems: 'center',
        paddingVertical: 60,
        backgroundColor: 'rgba(255,255,255,0.02)',
        borderRadius: 20,
    },
    emptyText: {
        fontSize: 14,
        color: 'rgba(255,255,255,0.3)',
        marginTop: 15,
        fontWeight: '500',
    },
});
