import { Text, View } from '@/components/Themed';
import { useColorScheme } from '@/components/useColorScheme';
import Colors from '@/constants/Colors';
import api from '@/services/api';
import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { LinearGradient } from 'expo-linear-gradient';
import { useLocalSearchParams, useRouter } from 'expo-router';
import React, { useCallback, useEffect, useState } from 'react';
import {
    ActivityIndicator,
    Dimensions,
    RefreshControl,
    ScrollView,
    StatusBar,
    StyleSheet,
    TouchableOpacity,
} from 'react-native';

const { width } = Dimensions.get('window');

interface Chapter {
    id: number;
    sousTitre: string;
    contenu: string;
    numeroChapitre: number;
    coutCoins: number;
    dateCreation?: string;
}

export default function StoryChaptersScreen() {
    const router = useRouter();
    const theme = useColorScheme() ?? "light";
    const params = useLocalSearchParams();
    const storyId = params.storyId as string;
    const storyTitle = params.storyTitle as string;
    const storyCover = params.storyCover as string | undefined;
    const storyAuteur = params.storyAuteur as string | undefined;

    const [chapters, setChapters] = useState<Chapter[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);

    useEffect(() => {
        loadChapters();
    }, [storyId]);

    const loadChapters = async () => {
        try {
            const response = await api.get(`/chapters/story/${storyId}`);
            setChapters(response.data);
        } catch (error) {
            console.error('Erreur lors du chargement des chapitres:', error);
        } finally {
            setIsLoading(false);
            setRefreshing(false);
        }
    };

    const onRefresh = useCallback(() => {
        setRefreshing(true);
        loadChapters();
    }, [storyId]);

    const formatDate = (dateString?: string) => {
        if (!dateString) return '';
        const date = new Date(dateString);
        return date.toLocaleDateString('fr-FR', {
            day: 'numeric',
            month: 'long',
        });
    };

    const countWords = (text: string) => {
        if (!text) return 0;
        return text.trim().split(/\s+/).length;
    };

    const handleAddChapter = () => {
        const nextChapterNumber = chapters.length + 1;
        router.push({
            pathname: '/new-chapter',
            params: {
                storyId: storyId,
                storyTitle: storyTitle,
                chapterNumber: nextChapterNumber,
            },
        });
    };

    const handleViewChapter = async (chapter: Chapter) => {
        // Sauvegarde les métadonnées pour la bibliothèque
        if (storyCover) {
            await AsyncStorage.setItem(`story_cover_${storyId}`, storyCover);
        }
        if (storyAuteur) {
            await AsyncStorage.setItem(`story_auteur_${storyId}`, storyAuteur);
        }
        router.push({
            pathname: '/read-chapter',
            params: {
                chapterId: chapter.id.toString(),
                storyId: storyId,
                storyTitle: storyTitle,
                chapterNumber: chapter.numeroChapitre.toString(),
            },
        });
    };

    if (isLoading) {
        return (
            <View style={styles.loadingContainer}>
                <ActivityIndicator size="large" color={Colors[theme].primary} />
                <Text style={styles.loadingText}>Vos chapitres arrivent...</Text>
            </View>
        );
    }

    return (
        <View style={styles.container}>
            <StatusBar barStyle="light-content" />

            {/* Header */}
            <View style={styles.header}>
                <TouchableOpacity
                    style={styles.backButton}
                    onPress={() => router.back()}
                >
                    <Ionicons name="arrow-back" size={24} color="white" />
                </TouchableOpacity>
                <View style={styles.headerInfo}>
                    <Text style={styles.storyTitle} numberOfLines={1}>
                        {storyTitle}
                    </Text>
                    <Text style={styles.chapterCount}>
                        {chapters.length} chapitre{chapters.length > 1 ? 's' : ''} publié{chapters.length > 1 ? 's' : ''}
                    </Text>
                </View>
            </View>

            <ScrollView
                contentContainerStyle={styles.scrollContent}
                showsVerticalScrollIndicator={false}
                refreshControl={
                    <RefreshControl
                        refreshing={refreshing}
                        onRefresh={onRefresh}
                        colors={[Colors[theme].primary]}
                        tintColor={Colors[theme].primary}
                    />
                }
            >
                {chapters.length > 0 ? (
                    chapters.map((chapter) => (
                        <TouchableOpacity
                            key={chapter.id}
                            style={styles.chapterCard}
                            onPress={() => handleViewChapter(chapter)}
                            activeOpacity={0.8}
                        >
                            <View style={styles.chapterNumberBadge}>
                                <Text style={styles.chapterNumberText}>#{chapter.numeroChapitre}</Text>
                            </View>

                            <View style={styles.chapterMainInfo}>
                                <Text style={styles.chapterSousTitre} numberOfLines={1}>
                                    {chapter.sousTitre || 'Sans titre'}
                                </Text>
                                <View style={styles.chapterMeta}>
                                    <View style={styles.metaItem}>
                                        <Ionicons name="document-text-outline" size={14} color="rgba(255,255,255,0.4)" />
                                        <Text style={styles.metaText}>
                                            {countWords(chapter.contenu)} mots
                                        </Text>
                                    </View>
                                    <View style={styles.metaItem}>
                                        <Ionicons name="calendar-outline" size={14} color="rgba(255,255,255,0.4)" />
                                        <Text style={styles.metaText}>
                                            {formatDate(chapter.dateCreation) || 'Récemment'}
                                        </Text>
                                    </View>
                                </View>
                            </View>

                            <TouchableOpacity style={styles.editBtn} onPress={() => handleViewChapter(chapter)}>
                                <Ionicons name="eye-outline" size={20} color="white" />
                            </TouchableOpacity>
                        </TouchableOpacity>
                    ))
                ) : (
                    <View style={styles.emptyContainer}>
                        <View style={styles.emptyIconCircle}>
                            <Ionicons name="book-outline" size={60} color="rgba(255,255,255,0.05)" />
                        </View>
                        <Text style={styles.emptyTitle}>Page blanche...</Text>
                        <Text style={styles.emptyText}>
                            Votre histoire attend son premier chapitre.{'\n'}
                            Lancez-vous !
                        </Text>
                    </View>
                )}

                <View style={{ height: 150 }} />
            </ScrollView>

            {/* Bouton Fixe en bas */}
            <View style={styles.footer}>
                <TouchableOpacity
                    style={styles.addChapterButton}
                    onPress={handleAddChapter}
                    activeOpacity={0.9}
                >
                    <LinearGradient
                        colors={[Colors[theme].primary, '#B20610']}
                        start={{ x: 0, y: 0 }}
                        end={{ x: 1, y: 0 }}
                        style={styles.gradientButton}
                    >
                        <Ionicons name="add" size={24} color="white" />
                        <Text style={styles.addChapterButtonText}>
                            Publier un nouveau chapitre
                        </Text>
                    </LinearGradient>
                </TouchableOpacity>
            </View>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#0F1014',
    },
    loadingContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: '#0F1014',
    },
    loadingText: {
        marginTop: 15,
        color: 'rgba(255,255,255,0.4)',
        fontSize: 14,
        fontWeight: '600',
    },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 20,
        paddingTop: 60,
        paddingBottom: 25,
    },
    backButton: {
        width: 44,
        height: 44,
        borderRadius: 12,
        backgroundColor: 'rgba(255,255,255,0.05)',
        justifyContent: 'center',
        alignItems: 'center',
    },
    headerInfo: {
        flex: 1,
        marginLeft: 15,
    },
    storyTitle: {
        fontSize: 22,
        fontWeight: '900',
        color: 'white',
        letterSpacing: -0.5,
    },
    chapterCount: {
        fontSize: 13,
        color: 'rgba(255,255,255,0.4)',
        marginTop: 2,
    },
    scrollContent: {
        paddingHorizontal: 20,
    },
    chapterCard: {
        backgroundColor: 'rgba(255,255,255,0.03)',
        borderRadius: 20,
        padding: 16,
        marginBottom: 12,
        flexDirection: 'row',
        alignItems: 'center',
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.05)',
    },
    chapterNumberBadge: {
        width: 44,
        height: 44,
        borderRadius: 12,
        backgroundColor: 'rgba(255,255,255,0.05)',
        justifyContent: 'center',
        alignItems: 'center',
    },
    chapterNumberText: {
        fontSize: 14,
        fontWeight: '900',
        color: 'white',
    },
    chapterMainInfo: {
        flex: 1,
        marginLeft: 15,
    },
    chapterSousTitre: {
        fontSize: 16,
        fontWeight: '700',
        color: 'white',
        marginBottom: 4,
    },
    chapterMeta: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    metaItem: {
        flexDirection: 'row',
        alignItems: 'center',
        marginRight: 15,
    },
    metaText: {
        fontSize: 11,
        color: 'rgba(255,255,255,0.3)',
        marginLeft: 4,
        fontWeight: '600',
    },
    editBtn: {
        width: 36,
        height: 36,
        borderRadius: 10,
        backgroundColor: 'rgba(255,255,255,0.05)',
        justifyContent: 'center',
        alignItems: 'center',
    },
    emptyContainer: {
        alignItems: 'center',
        paddingVertical: 80,
    },
    emptyIconCircle: {
        width: 120,
        height: 120,
        borderRadius: 60,
        backgroundColor: 'rgba(255,255,255,0.02)',
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 20,
    },
    emptyTitle: {
        fontSize: 20,
        fontWeight: '900',
        color: 'white',
        marginTop: 15,
    },
    emptyText: {
        fontSize: 14,
        color: 'rgba(255,255,255,0.4)',
        marginTop: 8,
        textAlign: 'center',
        lineHeight: 20,
    },
    footer: {
        position: 'absolute',
        bottom: 0,
        left: 0,
        right: 0,
        paddingHorizontal: 20,
        paddingBottom: 40,
        paddingTop: 20,
        backgroundColor: '#0F1014',
        borderTopWidth: 1,
        borderTopColor: 'rgba(255,255,255,0.05)',
    },
    addChapterButton: {
        width: '100%',
        height: 60,
        borderRadius: 20,
        overflow: 'hidden',
        shadowColor: '#E50914',
        shadowOffset: { width: 0, height: 8 },
        shadowOpacity: 0.3,
        shadowRadius: 12,
        elevation: 8,
    },
    gradientButton: {
        flex: 1,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
    },
    addChapterButtonText: {
        color: 'white',
        fontSize: 16,
        fontWeight: '900',
        marginLeft: 10,
    },
});
