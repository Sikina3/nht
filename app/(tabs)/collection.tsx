import SectionHeader from '@/components/home/SectionHeader';
import { Text, View } from '@/components/Themed';
import { useColorScheme } from '@/components/useColorScheme';
import Colors from '@/constants/Colors';
import { useAuth } from '@/context/AuthContext';
import api from '@/services/api';
import { getImageUrl } from '@/utils/imageHelper';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import React, { useCallback, useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Dimensions,
  Image,
  RefreshControl,
  ScrollView,
  StatusBar,
  StyleSheet,
  TouchableOpacity,
} from 'react-native';

const { width } = Dimensions.get('window');
const CARD_WIDTH = (width - 60) / 2;

interface Story {
  id: number;
  titre: string;
  description: string;
  photoCouverture: string | null;
  categories: string;
  statut?: 'en_cours' | 'termine';
  nombreChapitres?: number;
}

export default function CollectionScreen() {
  const router = useRouter();
  const theme = useColorScheme() ?? "light";
  const { user } = useAuth();
  const [myStories, setMyStories] = useState<Story[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);


  useEffect(() => {
    loadMyStories();
  }, [user]);

  const loadMyStories = async () => {
    if (!user) {
      setIsLoading(false);
      return;
    }

    try {
      const response = await api.get('/stories');
      const allStories: Story[] = response.data;

      const userStories = allStories.filter(
        (story: any) => story.auteur?.id === user.id
      ).sort((a, b) => b.id - a.id);

      setMyStories(userStories);
    } catch (error) {
      console.error('Erreur lors du chargement des histoires:', error);
    } finally {
      setIsLoading(false);
      setRefreshing(false);
    }
  };

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    loadMyStories();
  }, [user]);


  const enCoursStories = myStories.filter(s => s.statut !== 'termine');
  const termineStories = myStories.filter(s => s.statut === 'termine');

  const handleStoryPress = (story: Story) => {
    router.push({
      pathname: '/story-chapters',
      params: {
        storyId: story.id,
        storyTitle: story.titre,
      },
    });
  };

  const renderStoryCard = (story: Story) => {
    const imageUrl = getImageUrl(story.photoCouverture);

    return (
      <TouchableOpacity
        key={story.id}
        style={styles.storyCard}
        onPress={() => handleStoryPress(story)}
        activeOpacity={0.8}
      >
        <View style={styles.imageContainer}>
          {imageUrl ? (
            <Image source={{ uri: imageUrl }} style={styles.storyImage} />
          ) : (
            <View style={[styles.placeholderImage, { backgroundColor: Colors[theme].cardBgHover }]}>
              <Ionicons name="book-outline" size={30} color={Colors[theme].icon} />
            </View>
          )}
          <View style={[styles.badge, { backgroundColor: Colors[theme].primary }]}>
            <Text style={[styles.badgeText, { color: 'white' }]}>Ecrite</Text>
          </View>
        </View>
        <View style={styles.storyTitleContainer}>
          <Text style={[styles.storyTitle, { color: Colors[theme].text }]} numberOfLines={1}>
            {story.titre}
          </Text>
          <Text style={[styles.storySubtitle, { color: Colors[theme].textHint }]}>{story.categories || 'Histoires'}</Text>
        </View>
      </TouchableOpacity>
    );
  };

  if (isLoading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={Colors[theme].primary} />
        <Text style={[styles.loadingText, { color: Colors[theme].textMuted }]}>Vos œuvres arrivent...</Text>
      </View>
    );
  }

  if (user?.role?.toLowerCase() !== 'ecrivain') {
    return (
      <View style={styles.notWriterContainer}>
        <StatusBar barStyle={theme === 'dark' ? 'light-content' : 'dark-content'} />
        <View style={[styles.lockCircle, { backgroundColor: Colors[theme].primaryAlpha5 }]}>
          <Ionicons name="lock-closed" size={40} color={Colors[theme].primary} />
        </View>
        <Text style={[styles.notWriterTitle, { color: Colors[theme].text }]}>Espace Écrivain</Text>
        <Text style={[styles.notWriterText, { color: Colors[theme].textMuted }]}>
          Cette section est réservée aux écrivains passionnés.{'\n'}
          Transformez votre compte pour commencer à publier.
        </Text>
        <TouchableOpacity style={[styles.createButton, { backgroundColor: Colors[theme].primary, marginTop: 30 }]}>
          <Text style={[styles.createButtonText, { color: 'white' }]}>Devenir Écrivain</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <StatusBar barStyle={theme === 'dark' ? 'light-content' : 'dark-content'} />
      <View style={styles.header}>
        <Text style={[styles.headerTitle, { color: Colors[theme].text }]}>Collections</Text>
        <TouchableOpacity style={[styles.notificationBtn, { backgroundColor: Colors[theme].cardBgHover, borderColor: Colors[theme].borderColor }]}>
          <Ionicons name="add" size={24} color={Colors[theme].icon} onPress={() => router.push('/(tabs)/write')} />
        </TouchableOpacity>
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
        <SectionHeader title="Histoires en cours" />
        {enCoursStories.length > 0 ? (
          <View style={styles.storiesGrid}>
            {enCoursStories.map(renderStoryCard)}
          </View>
        ) : (
          <View style={[styles.emptySection, { backgroundColor: Colors[theme].cardBg, borderColor: Colors[theme].borderColor }]}>
            <Text style={[styles.emptyText, { color: Colors[theme].textHint }]}>Votre plume est prête ?</Text>
            <TouchableOpacity
              style={[styles.createButton, { backgroundColor: Colors[theme].primary }]}
              onPress={() => router.push('/(tabs)/write')}
            >
              <Ionicons name="add" size={20} color="white" />
              <Text style={[styles.createButtonText, { color: 'white' }]}>Nouvelle œuvre</Text>
            </TouchableOpacity>
          </View>
        )}

        <View style={{ marginTop: 20 }}>
          <SectionHeader title="Oeuvres terminées" />
        </View>
        {termineStories.length > 0 ? (
          <View style={styles.storiesGrid}>
            {termineStories.map(renderStoryCard)}
          </View>
        ) : (
          <View style={[styles.emptySection, { opacity: 0.5, backgroundColor: Colors[theme].cardBg, borderColor: Colors[theme].borderColor }]}>
            <Text style={[styles.emptyText, { color: Colors[theme].textHint }]}>Aucune histoire terminée</Text>
          </View>
        )}

        <View style={{ height: 120 }} />
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 15,
    color: 'rgba(255,255,255,0.4)',
    fontSize: 14,
    fontWeight: '600',
  },
  notWriterContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 40,
  },
  lockCircle: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: 'rgba(229, 9, 20, 0.1)',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 20,
  },
  notWriterTitle: {
    fontSize: 24,
    fontWeight: '900',
    color: 'white',
    marginBottom: 12,
  },
  notWriterText: {
    fontSize: 15,
    color: 'rgba(255,255,255,0.5)',
    textAlign: 'center',
    lineHeight: 24,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 65,
    paddingBottom: 25,
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: '900',
    color: 'white',
    letterSpacing: -1,
  },
  notificationBtn: {
    width: 44,
    height: 44,
    borderRadius: 14,
    backgroundColor: 'rgba(255,255,255,0.05)',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
  },
  scrollContent: {
    paddingHorizontal: 20,
  },
  storiesGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    marginTop: 10,
  },
  storyCard: {
    width: CARD_WIDTH,
    marginBottom: 25,
  },
  imageContainer: {
    borderRadius: 20,
    overflow: 'hidden',
    backgroundColor: 'rgba(255,255,255,0.05)',
    height: CARD_WIDTH * 1.4,
    position: 'relative',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.05)',
  },
  storyImage: {
    width: '100%',
    height: '100%',
    resizeMode: 'cover',
  },
  placeholderImage: {
    width: '100%',
    height: '100%',
    justifyContent: 'center',
    alignItems: 'center',
  },
  badge: {
    position: 'absolute',
    top: 10,
    right: 10,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
  },
  badgeText: {
    color: 'white',
    fontSize: 10,
    fontWeight: '900',
    textTransform: 'uppercase',
  },
  storyTitleContainer: {
    marginTop: 12,
  },
  storyTitle: {
    color: 'white',
    fontSize: 15,
    fontWeight: '800',
    marginBottom: 4,
  },
  storySubtitle: {
    color: 'rgba(255,255,255,0.4)',
    fontSize: 12,
    fontWeight: '600',
  },
  emptySection: {
    backgroundColor: 'rgba(255,255,255,0.02)',
    borderRadius: 24,
    padding: 40,
    alignItems: 'center',
    marginTop: 10,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.03)',
  },
  emptyText: {
    color: 'rgba(255,255,255,0.3)',
    fontSize: 15,
    marginBottom: 20,
    fontWeight: '500',
  },
  createButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 25,
    paddingVertical: 14,
    borderRadius: 16,
    shadowColor: '#E50914',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 5,
  },
  createButtonText: {
    color: 'white',
    fontWeight: '800',
    fontSize: 15,
    marginLeft: 10,
  },
});

