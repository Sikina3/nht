import { Text, View } from "@/components/Themed";
import FeaturedStory from "@/components/home/FeaturedStory";
import SectionHeader from "@/components/home/SectionHeader";
import StoryCard from "@/components/home/StoryCard";
import { useColorScheme } from "@/components/useColorScheme";
import Colors from "@/constants/Colors";
import api from "@/services/api";
import { getImageUrl } from "@/utils/imageHelper";
import { useRouter } from "expo-router";
import React, { useCallback, useEffect, useState } from "react";
import {
  ActivityIndicator,
  Dimensions,
  FlatList,
  RefreshControl,
  StatusBar,
  StyleSheet,
} from "react-native";

const { width } = Dimensions.get("window");

interface Story {
  id: number;
  titre: string;
  description: string;
  photoCouverture: string | null;
  categories: string;
  auteur?: {
    id: number;
    nom: string;
  };
}

export default function HomeScreen() {
  const router = useRouter();
  const theme = useColorScheme() ?? "light";
  const [stories, setStories] = useState<Story[]>([]);
  const [topStories, setTopStories] = useState<Story[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);


  useEffect(() => {
    loadStories();
  }, []);

  const loadStories = async () => {
    try {
      const response = await api.get("/stories");
      const allStories: Story[] = response.data;

      // Top 3 = les 3 premières histoires
      setTopStories(allStories.slice(0, 3));

      // Suggestions = le reste des histoires
      setStories(allStories.slice(0, 10));
    } catch (error) {
      console.error("Erreur lors du chargement des histoires:", error);
    } finally {
      setIsLoading(false);
      setRefreshing(false);
    }
  };

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    loadStories();
  }, []);


  const handleStoryPress = (storyId: number) => {
    router.push({
      pathname: "/story-details",
      params: { storyId: storyId.toString() },
    });
  };

  const HeaderComponent = () => (
    <View style={styles.headerContainer}>
      <StatusBar barStyle={theme === 'dark' ? 'light-content' : 'dark-content'} />
      {/* SECTION : Top 3 - MovieBox Style */}
      {topStories.length > 0 && (
        <View style={styles.featuredSection}>
          <FlatList
            data={topStories}
            horizontal
            pagingEnabled
            showsHorizontalScrollIndicator={false}
            keyExtractor={(item) => `featured-${item.id}`}
            renderItem={({ item }) => (
              <FeaturedStory
                title={item.titre}
                description={
                  item.description || "Une histoire passionnante à découvrir..."
                }
                imageUrl={getImageUrl(item.photoCouverture)}
                onPress={() => handleStoryPress(item.id)}
              />
            )}
          />
        </View>
      )}

      {/* SECTION : Suggestion pour vous */}
      <SectionHeader
        title="Suggestion pour vous"
        showSeeMore={stories.length > 3}
        onSeeMorePress={() => router.push({ pathname: "/stories" })}
      />
    </View>
  );

  if (isLoading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={Colors[theme].primary} />
        <Text style={[styles.loadingText, { color: Colors[theme].textMuted }]}>Chargement des histoires...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <FlatList
        data={stories.length > 0 ? stories : []}
        numColumns={2}
        keyExtractor={(item) => item.id.toString()}
        ListHeaderComponent={HeaderComponent}
        columnWrapperStyle={styles.columnWrapper}
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
        renderItem={({ item }) => (
          <StoryCard
            title={item.titre}
            imageUrl={getImageUrl(item.photoCouverture)}
            footerColor={Colors[theme].primary}
            width={(width - 50) / 2}
            height={230}
            storyId={item.id}
            onPress={() => handleStoryPress(item.id)}
          />
        )}
        ListEmptyComponent={() =>
          !isLoading && stories.length === 0 ? (
            <View style={styles.emptyContainer}>
              <Text style={[styles.emptyText, { color: Colors[theme].textMuted }]}>Aucune suggestion disponible</Text>
            </View>
          ) : null
        }
        ListFooterComponent={() => <View style={{ height: 100 }} />}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  headerContainer: {
    backgroundColor: "transparent",
  },
  featuredSection: {
    marginTop: 0,
    backgroundColor: "transparent",
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  loadingText: {
    marginTop: 15,
    fontSize: 14,
  },
  scrollContent: {
    paddingTop: 10,
  },
  columnWrapper: {
    justifyContent: "space-between",
    paddingHorizontal: 20,
    paddingVertical: 10,
    backgroundColor: "transparent",
  },
  emptyContainer: {
    paddingVertical: 40,
    alignItems: "center",
    backgroundColor: "transparent",
  },
  emptyText: {
    fontSize: 14,
  },
});
