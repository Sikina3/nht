import StoryCard from "@/components/home/StoryCard";
import { Text, View } from "@/components/Themed";
import { useColorScheme } from "@/components/useColorScheme";
import Colors from "@/constants/Colors";
import api from "@/services/api";
import { getImageUrl } from "@/utils/imageHelper";
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import React, { useCallback, useEffect, useMemo, useState } from "react";
import {
  ActivityIndicator,
  Dimensions,
  FlatList,
  Pressable,
  RefreshControl,
  ScrollView,
  StatusBar,
  StyleSheet,
  TextInput,
} from "react-native";

const { width } = Dimensions.get("window");
const CARD_WIDTH = (width - 50) / 2;
const CARD_HEIGHT = 230;

interface Story {
  id: number;
  titre: string;
  description: string;
  photoCouverture: string | null;
  categories: string;
  vues?: number;
  createdAt?: string;
  auteur?: { id: number; nom: string };
}

type SortKey = "recent" | "popular" | "az" | "za";

const SORT_OPTIONS: { key: SortKey; label: string; icon: string }[] = [
  { key: "recent", label: "Récent", icon: "time-outline" },
  { key: "popular", label: "Populaire", icon: "flame-outline" },
  { key: "az", label: "A → Z", icon: "text-outline" },
  { key: "za", label: "Z → A", icon: "text-outline" },
];

function FilterChip({
  label,
  active,
  onPress,
  icon,
}: {
  label: string;
  active: boolean;
  onPress: () => void;
  icon?: string;
}) {
  const theme = useColorScheme() ?? "light";
  return (
    <Pressable
      onPress={onPress}
      style={[
        styles.chip,
        {
          backgroundColor: active ? Colors[theme].primary : Colors[theme].secondary,
          borderColor: active ? Colors[theme].primary : Colors[theme].borderColor,
        },
      ]}
    >
      {icon && (
        <Ionicons
          name={icon as any}
          size={13}
          color={active ? "#fff" : Colors[theme].medium}
          style={{ marginRight: 4 }}
        />
      )}
      <Text style={[styles.chipText, { color: active ? "#fff" : Colors[theme].medium }]}>
        {label}
      </Text>
    </Pressable>
  );
}

export default function SearchScreen() {
  const router = useRouter();
  const theme = useColorScheme() ?? "light";
  const C = Colors[theme];

  const [allStories, setAllStories] = useState<Story[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [selectedAuthor, setSelectedAuthor] = useState<string | null>(null);
  const [selectedSort, setSelectedSort] = useState<SortKey>("recent");
  const [showAuthorFilter, setShowAuthorFilter] = useState(false);

  const loadStories = async () => {
    try {
      const response = await api.get("/stories");
      setAllStories(response.data || []);
    } catch (error) {
      console.error("Erreur chargement histoires:", error);
    } finally {
      setIsLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    loadStories();
  }, []);

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    loadStories();
  }, []);

  const categories = useMemo(() => {
    const cats = new Set<string>();
    allStories.forEach((s) => {
      if (s.categories) s.categories.split(",").forEach((c) => cats.add(c.trim()));
    });
    return Array.from(cats).filter(Boolean);
  }, [allStories]);

  const authors = useMemo(() => {
    const map = new Map<number, string>();
    allStories.forEach((s) => {
      if (s.auteur) map.set(s.auteur.id, s.auteur.nom);
    });
    return Array.from(map.entries()).map(([id, nom]) => ({ id, nom }));
  }, [allStories]);

  const filtered = useMemo(() => {
    let list = [...allStories];

    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      list = list.filter(
        (s) =>
          s.titre.toLowerCase().includes(q) ||
          (s.auteur?.nom.toLowerCase().includes(q) ?? false) ||
          s.categories?.toLowerCase().includes(q)
      );
    }
    if (selectedCategory) {
      list = list.filter((s) =>
        s.categories?.split(",").map((c) => c.trim()).includes(selectedCategory)
      );
    }
    if (selectedAuthor) {
      list = list.filter((s) => s.auteur?.nom === selectedAuthor);
    }

    switch (selectedSort) {
      case "popular":
        list.sort((a, b) => (b.vues ?? 0) - (a.vues ?? 0));
        break;
      case "az":
        list.sort((a, b) => a.titre.localeCompare(b.titre));
        break;
      case "za":
        list.sort((a, b) => b.titre.localeCompare(a.titre));
        break;
      default:
        list.sort(
          (a, b) =>
            new Date(b.createdAt ?? 0).getTime() -
            new Date(a.createdAt ?? 0).getTime()
        );
    }
    return list;
  }, [allStories, searchQuery, selectedCategory, selectedAuthor, selectedSort]);

  const handleStoryPress = (storyId: number) => {
    router.push({ pathname: "/story-details", params: { storyId: storyId.toString() } });
  };

  const listHeader = (
    <View style={[styles.listHeader, { backgroundColor: C.background }]}>
      {/* Barre de recherche */}
      <View style={[styles.searchBar, { backgroundColor: C.secondary, borderColor: C.borderColor }]}>
        <Ionicons name="search-outline" size={18} color={C.medium} style={{ marginRight: 8 }} />
        <TextInput
          placeholder="Titre, auteur, catégorie..."
          placeholderTextColor={C.medium}
          value={searchQuery}
          onChangeText={setSearchQuery}
          style={[styles.searchInput, { color: C.text }]}
          autoCorrect={false}
          returnKeyType="search"
        />
        {searchQuery.length > 0 && (
          <Pressable onPress={() => setSearchQuery("")}>
            <Ionicons name="close-circle" size={18} color={C.medium} />
          </Pressable>
        )}
      </View>

      {/* Tri */}
      <Text style={[styles.filterLabel, { color: C.medium }]}>Trier par</Text>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.chipRow}>
        {SORT_OPTIONS.map((opt) => (
          <FilterChip
            key={opt.key}
            label={opt.label}
            icon={opt.icon}
            active={selectedSort === opt.key}
            onPress={() => setSelectedSort(opt.key)}
          />
        ))}
      </ScrollView>

      {/* Catégories */}
      {categories.length > 0 && (
        <>
          <Text style={[styles.filterLabel, { color: C.medium }]}>Catégories</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.chipRow}>
            <FilterChip label="Toutes" active={selectedCategory === null} onPress={() => setSelectedCategory(null)} />
            {categories.map((cat) => (
              <FilterChip
                key={cat}
                label={cat}
                active={selectedCategory === cat}
                onPress={() => setSelectedCategory(selectedCategory === cat ? null : cat)}
              />
            ))}
          </ScrollView>
        </>
      )}

      {/* Auteurs */}
      {authors.length > 0 && (
        <>
          <Pressable style={styles.authorToggle} onPress={() => setShowAuthorFilter((v) => !v)}>
            <Text style={[styles.filterLabel, { color: C.medium, marginBottom: 0 }]}>Auteurs</Text>
            <Ionicons name={showAuthorFilter ? "chevron-up" : "chevron-down"} size={16} color={C.medium} />
          </Pressable>
          {showAuthorFilter && (
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.chipRow}>
              <FilterChip label="Tous" active={selectedAuthor === null} onPress={() => setSelectedAuthor(null)} />
              {authors.map((a) => (
                <FilterChip
                  key={a.id}
                  label={a.nom}
                  active={selectedAuthor === a.nom}
                  onPress={() => setSelectedAuthor(selectedAuthor === a.nom ? null : a.nom)}
                />
              ))}
            </ScrollView>
          )}
        </>
      )}

      {/* Compteur */}
      <View style={styles.resultRow}>
        <Text style={[styles.resultCount, { color: C.medium }]}>
          {filtered.length} histoire{filtered.length !== 1 ? "s" : ""}
        </Text>
        {(selectedCategory || selectedAuthor || searchQuery) && (
          <Pressable onPress={() => { setSelectedCategory(null); setSelectedAuthor(null); setSearchQuery(""); }}>
            <Text style={[styles.clearAll, { color: C.primary }]}>Tout effacer</Text>
          </Pressable>
        )}
      </View>
    </View>
  );

  if (isLoading) {
    return (
      <View style={[styles.centered, { backgroundColor: C.background }]}>
        <StatusBar barStyle={theme === "dark" ? "light-content" : "dark-content"} />
        <ActivityIndicator size="large" color={C.primary} />
        <Text style={[styles.loadingText, { color: C.medium }]}>Chargement...</Text>
      </View>
    );
  }

  return (
    <View style={[styles.container, { backgroundColor: C.background }]}>
      <StatusBar barStyle={theme === "dark" ? "light-content" : "dark-content"} />
      <FlatList
        data={filtered}
        numColumns={2}
        keyExtractor={(item) => item.id.toString()}
        ListHeaderComponent={listHeader}
        columnWrapperStyle={styles.columnWrapper}
        contentContainerStyle={styles.scrollContent}
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
          <StoryCard
            title={item.titre}
            imageUrl={getImageUrl(item.photoCouverture)}
            footerColor={C.primary}
            width={CARD_WIDTH}
            height={CARD_HEIGHT}
            storyId={item.id}
            onPress={() => handleStoryPress(item.id)}
          />
        )}
        ListEmptyComponent={() => (
          <View style={styles.emptyContainer}>
            <Ionicons name="search-outline" size={52} color={C.icon} />
            <Text style={[styles.emptyTitle, { color: C.text }]}>Aucune histoire trouvée</Text>
            <Text style={[styles.emptySubtitle, { color: C.medium }]}>
              Essayez d'autres filtres ou mots-clés
            </Text>
          </View>
        )}
        ListFooterComponent={() => <View style={{ height: 100 }} />}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  centered: { flex: 1, justifyContent: "center", alignItems: "center" },
  loadingText: { marginTop: 14, fontSize: 14 },

  listHeader: { paddingHorizontal: 16, paddingTop: 12, paddingBottom: 8 },

  searchBar: {
    flexDirection: "row",
    alignItems: "center",
    borderRadius: 12,
    borderWidth: 1,
    paddingHorizontal: 14,
    paddingVertical: 10,
    marginBottom: 16,
  },
  searchInput: { flex: 1, fontSize: 14, padding: 0 },

  filterLabel: {
    fontSize: 12,
    fontWeight: "600",
    textTransform: "uppercase",
    letterSpacing: 0.8,
    marginBottom: 8,
  },
  chipRow: { flexDirection: "row", marginBottom: 14 },
  chip: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 20,
    borderWidth: 1,
    marginRight: 8,
  },
  chipText: { fontSize: 13, fontWeight: "500" },

  authorToggle: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 8,
  },

  resultRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 10,
    marginTop: 2,
  },
  resultCount: { fontSize: 13, fontWeight: "500" },
  clearAll: { fontSize: 13, fontWeight: "600" },

  scrollContent: { paddingBottom: 20 },
  columnWrapper: {
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingVertical: 8,
  },

  emptyContainer: {
    alignItems: "center",
    paddingTop: 60,
    paddingHorizontal: 30,
    gap: 10,
    backgroundColor: "transparent",
  },
  emptyTitle: { fontSize: 17, fontWeight: "700", marginTop: 8 },
  emptySubtitle: { fontSize: 14, textAlign: "center", lineHeight: 20 },
});
