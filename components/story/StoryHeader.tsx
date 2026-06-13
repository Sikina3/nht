import { useColorScheme } from "@/components/useColorScheme";
import Colors from "@/constants/Colors";
import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import React from "react";
import {
    Dimensions,
    Image,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
} from "react-native";

const { width } = Dimensions.get("window");

interface StoryHeaderProps {
  title: string;
  author: string;
  coverImage: string | null;
  category: string;
  chaptersCount: number;
  vues?: number;
  likes?: number;
  onBackPress: () => void;
}

export default function StoryHeader({
  title,
  author,
  coverImage,
  category,
  chaptersCount,
  vues = 0,
  likes = 0,
  onBackPress,
}: StoryHeaderProps) {
  const getCategoryLabel = (cat: string) => {
    switch (cat?.toLowerCase()) {
      case "fitiavana":
        return "Fitiavana";
      case "mampalahelo":
        return "Mampalahelo";
      case "mampatahoatra":
        return "Mampatahoatra";
      case "hafa":
        return "hafa";
      default:
        return cat;
    }
  };

  const theme = useColorScheme() ?? "light";
  const bgColor = Colors[theme].background;

  return (
    <View style={[styles.container, { backgroundColor: bgColor }]}>
      {/* Arrière-plan flou (simulé avec gradient et image) */}
      {coverImage && (
        <Image
          source={{ uri: coverImage }}
          style={styles.bgImage}
          blurRadius={20}
        />
      )}

      <LinearGradient
        colors={["transparent", bgColor, bgColor]}
        style={styles.gradient}
      />

      <View style={styles.content}>
        <View style={styles.topBar}>
          <TouchableOpacity style={[styles.backButton, { backgroundColor: Colors[theme].cardBgHover }]} onPress={onBackPress}>
            <Ionicons name="chevron-back" size={24} color={Colors[theme].text} />
          </TouchableOpacity>
        </View>

        {/* Cover and Info */}
        <View style={styles.mainInfo}>
          <View style={styles.coverWrapper}>
            {coverImage ? (
              <Image source={{ uri: coverImage }} style={styles.coverImage} />
            ) : (
              <View style={[styles.placeholderCover, { backgroundColor: Colors[theme].cardBg, borderColor: Colors[theme].borderColor }]}>
                <Ionicons name="book" size={40} color={Colors[theme].icon} />
              </View>
            )}
          </View>

          <View style={styles.textInfo}>
            <View style={styles.tagRow}>
              <View style={[styles.categoryTag, { backgroundColor: Colors[theme].primaryAlpha5 }]}>
                <Text style={[styles.categoryText, { color: Colors[theme].primary }]}>
                  {getCategoryLabel(category)}
                </Text>
              </View>
              <Text style={[styles.dot, { color: Colors[theme].textHint }]}>•</Text>
              <Text style={[styles.metaText, { color: Colors[theme].textMuted }]}>{chaptersCount} épisodes</Text>
            </View>

            <Text style={[styles.title, { color: Colors[theme].text }]} numberOfLines={3}>
              {title}
            </Text>

            <Text style={[styles.author, { color: Colors[theme].textMuted }]}>Par {author}</Text>

            <View style={styles.statsRow}>
              <View style={styles.statItem}>
                <Ionicons name="star" size={14} color="#FFD700" />
                <Text style={[styles.statText, { color: Colors[theme].text }]}>{likes}</Text>
              </View>
              <View style={[styles.statItem, { marginLeft: 15 }]}>
                <Ionicons name="eye" size={14} color={Colors[theme].icon} />
                <Text style={[styles.statText, { color: Colors[theme].text }]}>{vues}</Text>
              </View>
            </View>
          </View>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    height: 480,
    width: width,
    position: "relative",
  },
  bgImage: {
    ...StyleSheet.absoluteFillObject,
    width: width,
    height: "100%",
    opacity: 0.5,
  },
  gradient: {
    ...StyleSheet.absoluteFillObject,
  },
  content: {
    flex: 1,
    paddingTop: 50,
    paddingHorizontal: 20,
  },
  topBar: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 30,
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: "rgba(255,255,255,0.1)",
    justifyContent: "center",
    alignItems: "center",
  },
  topActions: {
    flexDirection: "row",
    gap: 10,
  },
  iconButton: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: "rgba(255,255,255,0.1)",
    justifyContent: "center",
    alignItems: "center",
  },
  mainInfo: {
    flexDirection: "column",
    alignItems: "center",
  },
  coverWrapper: {
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 12 },
    shadowOpacity: 0.5,
    shadowRadius: 16,
    elevation: 20,
    marginBottom: 10,
  },
  coverImage: {
    width: 180,
    height: 200,
    borderRadius: 16,
  },
  placeholderCover: {
    width: 160,
    height: 240,
    borderRadius: 16,
    backgroundColor: "rgba(255,255,255,0.05)",
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.1)",
  },
  textInfo: {
    alignItems: "center",
    width: "100%",
  },
  tagRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 10,
  },
  categoryTag: {
    backgroundColor: "rgba(229, 9, 20, 0.15)",
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 8,
  },
  categoryText: {
    color: "#E50914",
    fontSize: 12,
    fontWeight: "800",
  },
  dot: {
    color: "rgba(255,255,255,0.3)",
    marginHorizontal: 8,
  },
  metaText: {
    color: "rgba(255,255,255,0.6)",
    fontSize: 12,
    fontWeight: "600",
  },
  title: {
    fontSize: 28,
    fontWeight: "900",
    color: "white",
    textAlign: "center",
    marginBottom: 8,
    letterSpacing: -0.5,
    lineHeight: 34,
  },
  author: {
    fontSize: 15,
    color: "rgba(255,255,255,0.5)",
    marginBottom: 15,
    fontWeight: "600",
  },
  statsRow: {
    flexDirection: "row",
    alignItems: "center",
  },
  statItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
  },
  statText: {
    color: "white",
    fontSize: 13,
    fontWeight: "700",
  },
});
