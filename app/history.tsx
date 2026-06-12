import { Text, View } from '@/components/Themed';
import { useColorScheme } from '@/components/useColorScheme';
import Colors from '@/constants/Colors';
import { useAuth } from '@/context/AuthContext';
import api from '@/services/api';
import { getImageUrl } from '@/utils/imageHelper';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import React, { useEffect, useState } from 'react';
import {
    ActivityIndicator,
    FlatList,
    Image,
    StyleSheet,
    TouchableOpacity,
    SafeAreaView,
    StatusBar,
} from 'react-native';

interface HistoryItem {
    id: number;
    histoire: {
        id: number;
        titre: string;
        photoCouverture: string;
        auteur?: { nom: string };
    };
    dateConsultation: string;
}

export default function HistoryScreen() {
    const router = useRouter();
    const theme = useColorScheme() ?? 'light';
    const C = Colors[theme];
    const { user } = useAuth();
    const [history, setHistory] = useState<HistoryItem[]>([]);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        loadHistory();
    }, []);

    const loadHistory = async () => {
        if (!user) return;
        try {
            // Utiliser le nouvel endpoint pour l'historique de la semaine
            const res = await api.get(`/history/user/${user.id}/week`);
            setHistory(res.data);
        } catch (error) {
            console.error('Erreur chargement historique:', error);
        } finally {
            setIsLoading(false);
        }
    };

    const formatDate = (dateStr: string) => {
        const date = new Date(dateStr);
        return date.toLocaleDateString('fr-FR', {
            day: '2-digit',
            month: 'short',
            hour: '2-digit',
            minute: '2-digit'
        });
    };

    const renderItem = ({ item }: { item: HistoryItem }) => (
        <TouchableOpacity
            style={styles.itemContainer}
            onPress={() => router.push({ pathname: '/story-details', params: { storyId: item.histoire.id.toString() } })}
        >
            <Image
                source={{ uri: getImageUrl(item.histoire.photoCouverture) }}
                style={styles.coverImage}
            />
            <View style={styles.itemInfo}>
                <Text style={styles.itemTitle} numberOfLines={1}>{item.histoire.titre}</Text>
                <Text style={styles.itemAuthor}>{item.histoire.auteur?.nom || 'Auteur inconnu'}</Text>
                <View style={styles.dateRow}>
                    <Ionicons name="time-outline" size={12} color="rgba(255,255,255,0.5)" />
                    <Text style={styles.itemDate}>{formatDate(item.dateConsultation)}</Text>
                </View>
            </View>
            <Ionicons name="chevron-forward" size={20} color="rgba(255,255,255,0.2)" />
        </TouchableOpacity>
    );

    return (
        <SafeAreaView style={styles.container}>
            <StatusBar barStyle="light-content" />
            <View style={styles.header}>
                <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
                    <Ionicons name="chevron-back" size={28} color="white" />
                </TouchableOpacity>
                <Text style={styles.headerTitle}>Historique de la semaine</Text>
                <View style={{ width: 40 }} />
            </View>

            {isLoading ? (
                <View style={styles.centerContainer}>
                    <ActivityIndicator size="large" color={C.primary} />
                </View>
            ) : history.length === 0 ? (
                <View style={styles.centerContainer}>
                    <Ionicons name="time-outline" size={64} color="rgba(255,255,255,0.1)" />
                    <Text style={styles.emptyText}>Aucune lecture cette semaine</Text>
                </View>
            ) : (
                <FlatList
                    data={history}
                    keyExtractor={(item) => item.id.toString()}
                    renderItem={renderItem}
                    contentContainerStyle={styles.listContent}
                    showsVerticalScrollIndicator={false}
                />
            )}
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#121212',
    },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: 15,
        paddingVertical: 15,
        borderBottomWidth: 1,
        borderBottomColor: 'rgba(255,255,255,0.05)',
    },
    backButton: {
        width: 40,
        height: 40,
        justifyContent: 'center',
        alignItems: 'center',
    },
    headerTitle: {
        fontSize: 18,
        fontWeight: 'bold',
        color: 'white',
    },
    centerContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        padding: 20,
    },
    listContent: {
        padding: 15,
    },
    itemContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: 'rgba(255,255,255,0.03)',
        borderRadius: 12,
        padding: 10,
        marginBottom: 12,
    },
    coverImage: {
        width: 60,
        height: 80,
        borderRadius: 8,
        backgroundColor: 'rgba(255,255,255,0.1)',
    },
    itemInfo: {
        flex: 1,
        marginLeft: 15,
        backgroundColor: 'transparent',
    },
    itemTitle: {
        fontSize: 16,
        fontWeight: 'bold',
        color: 'white',
        marginBottom: 4,
    },
    itemAuthor: {
        fontSize: 13,
        color: 'rgba(255,255,255,0.5)',
        marginBottom: 8,
    },
    dateRow: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: 'transparent',
    },
    itemDate: {
        fontSize: 11,
        color: 'rgba(255,255,255,0.4)',
        marginLeft: 4,
    },
    emptyText: {
        color: 'rgba(255,255,255,0.4)',
        fontSize: 14,
        marginTop: 15,
    },
});
