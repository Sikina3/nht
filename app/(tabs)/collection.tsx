import SectionHeader from '@/components/home/SectionHeader';
import { Text, View } from '@/components/Themed';
import { useColorScheme } from '@/components/useColorScheme';
import Colors from '@/constants/Colors';
import { useAuth } from '@/context/AuthContext';
import api from '@/services/api';
import {
  DownloadedStory,
  ReadingProgress,
  deleteDownload,
  estimateDownloadSize,
  getAllDownloads,
  getAllReadingProgress,
  getReadingProgress,
} from '@/services/downloadService';
import { getImageUrl } from '@/utils/imageHelper';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import React, { useCallback, useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Dimensions,
  FlatList,
  Image,
  Pressable,
  RefreshControl,
  ScrollView,
  StatusBar,
  StyleSheet,
  TouchableOpacity,
} from 'react-native';

const { width } = Dimensions.get('window');
const CARD_WIDTH = (width - 60) / 2;

// ─── Types ────────────────────────────────────────────────────────────────────

interface Story {
  id: number;
  titre: string;
  description: string;
  photoCouverture: string | null;
  categories: string;
  statut?: 'en_cours' | 'termine';
  nombreChapitres?: number;
}

type InnerTab = 'oeuvres' | 'bibliotheque';
type LibTab = 'reading' | 'offline';

function ReadingCard({
  item,
  onPress,
  C,
}: {
  item: ReadingProgress;
  onPress: () => void;
  C: (typeof Colors)['light'];
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
    <TouchableOpacity
      style={[styles.readingCard, { backgroundColor: C.cardBg, borderColor: C.borderColor }]}
      onPress={onPress}
      activeOpacity={0.75}
    >
      <Image source={{ uri: imageUri }} style={styles.readingImage} />
      <View style={styles.readingInfo}>
        <Text style={[styles.readingTitle, { color: C.text }]} numberOfLines={1}>
          {item.storyTitle}
        </Text>
        <Text style={[styles.readingMeta, { color: C.medium }]}>{item.auteurNom}</Text>
        <Text style={[styles.readingChapter, { color: C.medium }]} numberOfLines={1}>
          Chap. {item.chapterNumber}
          {item.chapterTitle ? ` — ${item.chapterTitle}` : ''}
        </Text>
        <View style={[styles.progressBg, { backgroundColor: C.borderFaint }]}>
          <View style={[styles.progressFill, { width: `${item.progress}%`, backgroundColor: C.primary }]} />
        </View>
        <View style={styles.progressRow}>
          <Text style={[styles.progressLabel, { color: C.medium }]}>{item.progress}% lu</Text>
          <Text style={[styles.progressLabel, { color: C.medium }]}>{timeAgo(item.lastReadAt)}</Text>
        </View>
      </View>
      <View style={[styles.continueBtn, { backgroundColor: C.primary }]}>
        <Ionicons name="play" size={14} color="#fff" />
      </View>
    </TouchableOpacity>
  );
}

function DownloadCard({
  item,
  onPress,
  onDelete,
  C,
}: {
  item: DownloadedStory;
  onPress: () => void;
  onDelete: () => void;
  C: (typeof Colors)['light'];
}) {
  const imageUri = getImageUrl(item.photoCouverture);
  const size = estimateDownloadSize(item);

  return (
    <TouchableOpacity
      style={[styles.downloadCard, { backgroundColor: C.cardBg, borderColor: C.borderColor }]}
      onPress={onPress}
      activeOpacity={0.75}
    >
      <Image source={{ uri: imageUri }} style={styles.downloadImage} />
      <View style={styles.downloadInfo}>
        <Text style={[styles.downloadTitle, { color: C.text }]} numberOfLines={2}>{item.titre}</Text>
        <Text style={[styles.downloadMeta, { color: C.medium }]}>{item.auteurNom}</Text>
        <View style={styles.downloadBadgeRow}>
          <View style={[styles.dlBadge, { backgroundColor: 'rgba(59,130,246,0.15)' }]}>
            <Ionicons name="cloud-offline-outline" size={11} color="#3B82F6" style={{ marginRight: 4 }} />
            <Text style={[styles.dlBadgeText, { color: '#3B82F6' }]}>Hors-ligne</Text>
          </View>
          <View style={[styles.dlBadge, { backgroundColor: C.cardBgHover }]}>
            <Text style={[styles.dlBadgeText, { color: C.medium }]}>{item.chapters.length} chap.</Text>
          </View>
          <View style={[styles.dlBadge, { backgroundColor: C.cardBgHover }]}>
            <Text style={[styles.dlBadgeText, { color: C.medium }]}>{size}</Text>
          </View>
        </View>
      </View>
      <TouchableOpacity style={styles.deleteBtn} onPress={onDelete} hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
        <Ionicons name="trash-outline" size={18} color="#FF4D4D" />
      </TouchableOpacity>
    </TouchableOpacity>
  );
}

export default function CollectionScreen() {
  const router = useRouter();
  const theme = useColorScheme() ?? 'light';
  const C = Colors[theme];
  const { user } = useAuth();

  const [innerTab, setInnerTab] = useState<InnerTab>('oeuvres');

  const [myStories, setMyStories] = useState<Story[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const [libTab, setLibTab] = useState<LibTab>('reading');
  const [readingList, setReadingList] = useState<ReadingProgress[]>([]);
  const [downloads, setDownloads] = useState<DownloadedStory[]>([]);
  const [libLoading, setLibLoading] = useState(true);
  const [libRefreshing, setLibRefreshing] = useState(false);

  useEffect(() => {
    loadMyStories();
    loadLibData();
  }, [user]);

  const loadMyStories = async () => {
    if (!user) { setIsLoading(false); return; }
    try {
      const response = await api.get('/stories');
      const allStories: Story[] = response.data;
      const userStories = allStories
        .filter((story: any) => story.auteur?.id === user.id)
        .sort((a, b) => b.id - a.id);
      setMyStories(userStories);
    } catch (error) {
      console.error('Erreur lors du chargement des histoires:', error);
    } finally {
      setIsLoading(false);
      setRefreshing(false);
    }
  };

  const loadLibData = async () => {
    try {
      const [reading, dl] = await Promise.all([getAllReadingProgress(), getAllDownloads()]);
      setReadingList(reading);
      setDownloads(dl);
    } catch (e) {
      console.error('Library load error:', e);
    } finally {
      setLibLoading(false);
      setLibRefreshing(false);
    }
  };

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    loadMyStories();
  }, [user]);

  const onLibRefresh = useCallback(() => {
    setLibRefreshing(true);
    loadLibData();
  }, []);


  const enCoursStories = myStories.filter(s => s.statut !== 'termine');
  const termineStories = myStories.filter(s => s.statut === 'termine');

  const handleStoryPress = (story: Story) => {
    router.push({ pathname: '/story-chapters', params: { storyId: story.id, storyTitle: story.titre } });
  };

  const handleContinueReading = (item: ReadingProgress) => {
    router.push({
      pathname: '/read-chapter',
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
    const progress = await getReadingProgress(story.id);
    let targetChapter = story.chapters[0];
    if (progress) {
      const found = story.chapters.find(ch => ch.id === progress.chapterId);
      if (found) targetChapter = found;
    }
    router.push({
      pathname: '/read-chapter',
      params: {
        chapterId: targetChapter.id.toString(),
        storyId: story.id.toString(),
        storyTitle: story.titre,
        chapterNumber: targetChapter.numeroChapitre.toString(),
        offline: 'true',
      },
    });
  };

  const handleDeleteDownload = (storyId: number, titre: string) => {
    Alert.alert(
      'Supprimer le téléchargement',
      `Voulez-vous supprimer "${titre}" de vos téléchargements ?`,
      [
        { text: 'Annuler', style: 'cancel' },
        {
          text: 'Supprimer',
          style: 'destructive',
          onPress: async () => {
            await deleteDownload(storyId);
            setDownloads(prev => prev.filter(d => d.id !== storyId));
          },
        },
      ],
    );
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
            <View style={[styles.placeholderImage, { backgroundColor: C.cardBgHover }]}>
              <Ionicons name="book-outline" size={30} color={C.icon} />
            </View>
          )}
          <View style={[styles.badge, { backgroundColor: C.primary }]}>
            <Text style={[styles.badgeText, { color: 'white' }]}>Ecrite</Text>
          </View>
        </View>
        <View style={styles.storyTitleContainer}>
          <Text style={[styles.storyTitle, { color: C.text }]} numberOfLines={1}>{story.titre}</Text>
          <Text style={[styles.storySubtitle, { color: C.textHint }]}>{story.categories || 'Histoires'}</Text>
        </View>
      </TouchableOpacity>
    );
  };

  const EmptyLibState = ({ icon, title, subtitle }: { icon: string; title: string; subtitle: string }) => (
    <View style={styles.emptyContainer}>
      <View style={[styles.emptyIconBox, { backgroundColor: C.cardBgHover }]}>
        <Ionicons name={icon as any} size={44} color={C.medium} />
      </View>
      <Text style={[styles.emptyTitle, { color: C.text }]}>{title}</Text>
      <Text style={[styles.emptySubtitle, { color: C.medium }]}>{subtitle}</Text>
      <Pressable style={[styles.emptyBtn, { backgroundColor: C.primary }]} onPress={() => router.push('/')}>
        <Text style={styles.emptyBtnText}>Explorer les histoires</Text>
      </Pressable>
    </View>
  );


  if (isLoading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={C.primary} />
        <Text style={[styles.loadingText, { color: C.textMuted }]}>Vos œuvres arrivent...</Text>
      </View>
    );
  }

  if (user?.role?.toLowerCase() !== 'ecrivain') {
    return (
      <View style={styles.notWriterContainer}>
        <StatusBar barStyle={theme === 'dark' ? 'light-content' : 'dark-content'} />
        <View style={[styles.lockCircle, { backgroundColor: C.primaryAlpha5 }]}>
          <Ionicons name="lock-closed" size={40} color={C.primary} />
        </View>
        <Text style={[styles.notWriterTitle, { color: C.text }]}>Espace Écrivain</Text>
        <Text style={[styles.notWriterText, { color: C.textMuted }]}>
          Cette section est réservée aux écrivains.{'\n'}
          Le rôle est défini une fois pour toutes lors de l'inscription.
        </Text>
        <View style={[styles.roleFixedBadge, { borderColor: C.borderColor }]}>
          <Ionicons name="shield-checkmark-outline" size={14} color={C.textHint} />
          <Text style={[styles.roleFixedText, { color: C.textHint }]}>
            Votre compte est enregistré comme Lecteur
          </Text>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <StatusBar barStyle={theme === 'dark' ? 'light-content' : 'dark-content'} />

      <View style={[styles.header, { backgroundColor: C.background }]}>
        <Text style={[styles.headerTitle, { color: C.text }]}>Mon Espace</Text>
        {innerTab === 'oeuvres' && (
          <TouchableOpacity
            style={[styles.addBtn, { backgroundColor: C.cardBgHover, borderColor: C.borderColor }]}
            onPress={() => router.push('/(tabs)/write')}
          >
            <Ionicons name="add" size={24} color={C.icon} />
          </TouchableOpacity>
        )}
      </View>

      <View style={[styles.innerTabBar, { borderBottomColor: C.borderColor, backgroundColor: C.background }]}>
        <Pressable
          style={[styles.innerTabBtn, innerTab === 'oeuvres' && { borderBottomColor: C.primary, borderBottomWidth: 2 }]}
          onPress={() => setInnerTab('oeuvres')}
        >
          <Ionicons name="library-sharp" size={16} color={innerTab === 'oeuvres' ? C.primary : C.medium} style={{ marginRight: 6 }} />
          <Text style={[styles.innerTabLabel, { color: innerTab === 'oeuvres' ? C.primary : C.medium }]}>
            Mes Œuvres
          </Text>
          {myStories.length > 0 && (
            <View style={[styles.innerTabBadge, { backgroundColor: C.primary }]}>
              <Text style={styles.innerTabBadgeText}>{myStories.length}</Text>
            </View>
          )}
        </Pressable>

        <Pressable
          style={[styles.innerTabBtn, innerTab === 'bibliotheque' && { borderBottomColor: C.primary, borderBottomWidth: 2 }]}
          onPress={() => setInnerTab('bibliotheque')}
        >
          <Ionicons name="book-sharp" size={16} color={innerTab === 'bibliotheque' ? C.primary : C.medium} style={{ marginRight: 6 }} />
          <Text style={[styles.innerTabLabel, { color: innerTab === 'bibliotheque' ? C.primary : C.medium }]}>
            Ma Bibliothèque
          </Text>
          {readingList.length > 0 && (
            <View style={[styles.innerTabBadge, { backgroundColor: C.primary }]}>
              <Text style={styles.innerTabBadgeText}>{readingList.length}</Text>
            </View>
          )}
        </Pressable>
      </View>

      {innerTab === 'oeuvres' && (
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={[C.primary]} tintColor={C.primary} />
          }
        >
          <SectionHeader title="Histoires en cours" />
          {enCoursStories.length > 0 ? (
            <View style={styles.storiesGrid}>
              {enCoursStories.map(renderStoryCard)}
            </View>
          ) : (
            <View style={[styles.emptySection, { backgroundColor: C.cardBg, borderColor: C.borderColor }]}>
              <Text style={[styles.emptyText, { color: C.textHint }]}>Votre plume est prête ?</Text>
              <TouchableOpacity
                style={[styles.createButton, { backgroundColor: C.primary }]}
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
            <View style={[styles.emptySection, { opacity: 0.5, backgroundColor: C.cardBg, borderColor: C.borderColor }]}>
              <Text style={[styles.emptyText, { color: C.textHint }]}>Aucune histoire terminée</Text>
            </View>
          )}
          <View style={{ height: 120 }} />
        </ScrollView>
      )}

      {innerTab === 'bibliotheque' && (
        <View style={{ flex: 1 }}>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            style={styles.statsRow}
            contentContainerStyle={{ paddingHorizontal: 20, gap: 12 }}
          >
            {[
              { icon: 'book-outline', value: readingList.length, label: 'En cours', color: C.primary },
              { icon: 'cloud-offline-outline', value: downloads.length, label: 'Téléchargés', color: '#3B82F6' },
              { icon: 'checkmark-circle-outline', value: readingList.filter(r => r.progress === 100).length, label: 'Terminés', color: '#4ADE80' },
            ].map(stat => (
              <View key={stat.label} style={[styles.statCard, { backgroundColor: C.cardBg, borderColor: C.borderColor }]}>
                <Ionicons name={stat.icon as any} size={22} color={stat.color} />
                <Text style={[styles.statValue, { color: stat.color }]}>{stat.value}</Text>
                <Text style={[styles.statLabel, { color: C.medium }]}>{stat.label}</Text>
              </View>
            ))}
          </ScrollView>

          <View style={[styles.libTabBar, { borderBottomColor: C.borderColor }]}>
            {([
              { tab: 'reading' as LibTab, label: 'En cours', icon: 'book-outline' },
              { tab: 'offline' as LibTab, label: 'Hors-ligne', icon: 'cloud-offline-outline' },
            ]).map(({ tab, label, icon }) => (
              <Pressable
                key={tab}
                style={[styles.libTabBtn, libTab === tab && { borderBottomColor: C.primary, borderBottomWidth: 2 }]}
                onPress={() => setLibTab(tab)}
              >
                <Ionicons name={icon as any} size={18} color={libTab === tab ? C.primary : C.medium} style={{ marginRight: 6 }} />
                <Text style={[styles.libTabLabel, { color: libTab === tab ? C.primary : C.medium }]}>{label}</Text>
                {((tab === 'reading' && readingList.length > 0) || (tab === 'offline' && downloads.length > 0)) && (
                  <View style={[styles.libTabBadge, { backgroundColor: C.primary }]}>
                    <Text style={styles.libTabBadgeText}>{tab === 'reading' ? readingList.length : downloads.length}</Text>
                  </View>
                )}
              </Pressable>
            ))}
          </View>

          {libTab === 'reading' ? (
            <FlatList
              data={readingList}
              keyExtractor={item => item.storyId.toString()}
              contentContainerStyle={styles.listContent}
              showsVerticalScrollIndicator={false}
              refreshControl={<RefreshControl refreshing={libRefreshing} onRefresh={onLibRefresh} colors={[C.primary]} tintColor={C.primary} />}
              renderItem={({ item }) => (
                <ReadingCard item={item} onPress={() => handleContinueReading(item)} C={C} />
              )}
              ListEmptyComponent={
                !libLoading ? (
                  <EmptyLibState icon="book-outline" title="Aucune lecture en cours" subtitle="Commencez à lire une histoire et elle apparaîtra ici automatiquement." />
                ) : null
              }
              ListFooterComponent={() => <View style={{ height: 100 }} />}
            />
          ) : (
            <FlatList
              data={downloads}
              keyExtractor={item => item.id.toString()}
              contentContainerStyle={styles.listContent}
              showsVerticalScrollIndicator={false}
              refreshControl={<RefreshControl refreshing={libRefreshing} onRefresh={onLibRefresh} colors={[C.primary]} tintColor={C.primary} />}
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
                    <Text style={[styles.offlineInfoText, { color: C.medium }]}>Ces histoires sont disponibles sans connexion internet.</Text>
                  </View>
                ) : null
              }
              ListEmptyComponent={
                !libLoading ? (
                  <EmptyLibState icon="cloud-offline-outline" title="Aucun téléchargement" subtitle="Téléchargez des histoires depuis leur page de détails pour les lire sans connexion." />
                ) : null
              }
              ListFooterComponent={() => <View style={{ height: 100 }} />}
            />
          )}
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  loadingContainer: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  loadingText: { marginTop: 15, fontSize: 14, fontWeight: '600' },

  notWriterContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', paddingHorizontal: 40 },
  lockCircle: { width: 100, height: 100, borderRadius: 50, justifyContent: 'center', alignItems: 'center', marginBottom: 20 },
  notWriterTitle: { fontSize: 24, fontWeight: '900', marginBottom: 12 },
  notWriterText: { fontSize: 15, textAlign: 'center', lineHeight: 24, marginBottom: 8 },
  roleFixedBadge: { flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 20, paddingHorizontal: 16, paddingVertical: 10, borderRadius: 12, borderWidth: 1, opacity: 0.6 },
  roleFixedText: { fontSize: 13, fontWeight: '600' },

  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 65,
    paddingBottom: 12,
  },
  headerTitle: { fontSize: 28, fontWeight: '900', letterSpacing: -1 },
  addBtn: { width: 44, height: 44, borderRadius: 14, justifyContent: 'center', alignItems: 'center', borderWidth: 1 },

  innerTabBar: {
    flexDirection: 'row',
    borderBottomWidth: 1,
    paddingHorizontal: 20,
    marginBottom: 4,
  },
  innerTabBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    marginRight: 24,
  },
  innerTabLabel: { fontSize: 14, fontWeight: '700' },
  innerTabBadge: { marginLeft: 6, minWidth: 18, height: 18, borderRadius: 9, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 4 },
  innerTabBadgeText: { fontSize: 10, color: '#fff', fontWeight: '700' },

  scrollContent: { paddingHorizontal: 20, paddingTop: 12 },
  storiesGrid: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between', marginTop: 10 },
  storyCard: { width: CARD_WIDTH, marginBottom: 25 },
  imageContainer: { borderRadius: 20, overflow: 'hidden', height: CARD_WIDTH * 1.4, position: 'relative', borderWidth: 1, borderColor: 'rgba(255,255,255,0.05)' },
  storyImage: { width: '100%', height: '100%', resizeMode: 'cover' },
  placeholderImage: { width: '100%', height: '100%', justifyContent: 'center', alignItems: 'center' },
  badge: { position: 'absolute', top: 10, right: 10, paddingHorizontal: 8, paddingVertical: 4, borderRadius: 8 },
  badgeText: { fontSize: 10, fontWeight: '900', textTransform: 'uppercase' },
  storyTitleContainer: { marginTop: 12 },
  storyTitle: { fontSize: 15, fontWeight: '800', marginBottom: 4 },
  storySubtitle: { fontSize: 12, fontWeight: '600' },
  emptySection: { borderRadius: 24, padding: 40, alignItems: 'center', marginTop: 10, borderWidth: 1 },
  emptyText: { fontSize: 15, marginBottom: 20, fontWeight: '500' },
  createButton: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 25, paddingVertical: 14, borderRadius: 16, shadowColor: '#E50914', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.3, shadowRadius: 8, elevation: 5 },
  createButtonText: { fontWeight: '800', fontSize: 15, marginLeft: 10 },

  statsRow: { flexGrow: 0, marginBottom: 16, marginTop: 12 },
  statCard: { alignItems: 'center', paddingVertical: 14, paddingHorizontal: 20, borderRadius: 16, borderWidth: 1, gap: 4, minWidth: 90 },
  statValue: { fontSize: 22, fontWeight: '800' },
  statLabel: { fontSize: 11, fontWeight: '500' },

  libTabBar: { flexDirection: 'row', borderBottomWidth: 1, marginHorizontal: 20, marginBottom: 4 },
  libTabBtn: { flexDirection: 'row', alignItems: 'center', paddingVertical: 10, paddingHorizontal: 4, marginRight: 24 },
  libTabLabel: { fontSize: 14, fontWeight: '600' },
  libTabBadge: { marginLeft: 6, minWidth: 18, height: 18, borderRadius: 9, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 4 },
  libTabBadgeText: { fontSize: 10, color: '#fff', fontWeight: '700' },

  listContent: { paddingHorizontal: 20, paddingTop: 12 },
  readingCard: { flexDirection: 'row', borderRadius: 16, padding: 12, marginBottom: 12, borderWidth: 1, alignItems: 'center' },
  readingImage: { width: 60, height: 85, borderRadius: 10 },
  readingInfo: { flex: 1, marginLeft: 14, backgroundColor: 'transparent' },
  readingTitle: { fontSize: 15, fontWeight: '700', marginBottom: 2 },
  readingMeta: { fontSize: 12, marginBottom: 4 },
  readingChapter: { fontSize: 12, marginBottom: 8 },
  progressBg: { height: 4, borderRadius: 2, overflow: 'hidden', marginBottom: 4 },
  progressFill: { height: '100%', borderRadius: 2 },
  progressRow: { flexDirection: 'row', justifyContent: 'space-between', backgroundColor: 'transparent' },
  progressLabel: { fontSize: 10, fontWeight: '500' },
  continueBtn: { width: 34, height: 34, borderRadius: 17, justifyContent: 'center', alignItems: 'center', marginLeft: 10 },
  downloadCard: { flexDirection: 'row', borderRadius: 16, padding: 12, marginBottom: 12, borderWidth: 1, alignItems: 'center' },
  downloadImage: { width: 60, height: 85, borderRadius: 10 },
  downloadInfo: { flex: 1, marginLeft: 14, backgroundColor: 'transparent' },
  downloadTitle: { fontSize: 15, fontWeight: '700', marginBottom: 3 },
  downloadMeta: { fontSize: 12, marginBottom: 8 },
  downloadBadgeRow: { flexDirection: 'row', gap: 6, flexWrap: 'wrap', backgroundColor: 'transparent' },
  dlBadge: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 8, paddingVertical: 3, borderRadius: 6 },
  dlBadgeText: { fontSize: 10, fontWeight: '600' },
  deleteBtn: { padding: 8, marginLeft: 4 },
  offlineInfo: { flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 12, backgroundColor: 'transparent' },
  offlineInfoText: { fontSize: 12, flex: 1 },

  emptyContainer: { alignItems: 'center', paddingTop: 60, paddingHorizontal: 30, gap: 12, backgroundColor: 'transparent' },
  emptyIconBox: { width: 90, height: 90, borderRadius: 45, justifyContent: 'center', alignItems: 'center', marginBottom: 8 },
  emptyTitle: { fontSize: 18, fontWeight: '700' },
  emptySubtitle: { fontSize: 14, textAlign: 'center', lineHeight: 20 },
  emptyBtn: { marginTop: 8, paddingHorizontal: 24, paddingVertical: 12, borderRadius: 24 },
  emptyBtnText: { color: '#fff', fontWeight: '700', fontSize: 14 },
});
