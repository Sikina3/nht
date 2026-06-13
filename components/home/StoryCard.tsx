import { LinearGradient } from "expo-linear-gradient";
import React from "react";
import { Dimensions, Image, StyleSheet, TouchableOpacity } from "react-native";
import Colors from "@/constants/Colors";
import { useColorScheme } from "../useColorScheme";
import { Text, View } from "../Themed";

const { width } = Dimensions.get("window");

interface StoryCardProps {
  title: string;
  imageUrl: string;
  footerColor?: string; 
  width?: number;
  height?: number;
  storyId?: number;
  onPress?: () => void;
  rating?: string;
}

export default function StoryCard({
  title,
  imageUrl,
  footerColor,
  width: cardWidth = width * 0.42,
  height: cardHeight = 220,
  storyId,
  onPress,
  rating = "0",
}: StoryCardProps) {
  const theme = useColorScheme() ?? "light";

  return (
    <TouchableOpacity
      style={[styles.container, { width: cardWidth }]}
      onPress={onPress}
      activeOpacity={0.4}
    >
      <View style={[styles.card, { height: cardHeight, backgroundColor: Colors[theme].cardBg }]}>
        <Image
          source={{ uri: imageUrl }}
          style={[styles.image, { zIndex: 1 }]}
          resizeMode="cover"
        />

        {/* Gradient pour la lisibilité du texte */}
        <LinearGradient
          colors={["transparent", "rgba(0, 0, 0, 0.7)"]}
          style={[styles.gradient, { zIndex: 2 }]}
        />

        <View style={[styles.contentContainer, { zIndex: 3 }]}>
          <View style={styles.badgeContainer}>
            {footerColor && (
              <View
                style={[styles.indicator, { backgroundColor: footerColor }]}
              />
            )}
          </View>

          <View style={styles.textWrapper}>
            <Text style={styles.title} numberOfLines={2}>
              {title}
            </Text>

            <View style={styles.infoRow}>
              <Text style={styles.rating}>⭐ {rating}</Text>
            </View>
          </View>
        </View>
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  container: {
    marginRight: 15,
    borderRadius: 16,
    overflow: "visible",
  },
  card: {
    width: "100%",
    borderRadius: 16,
    overflow: "hidden",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.3,
    shadowRadius: 10,
    elevation: 8,
  },
  image: {
    ...StyleSheet.absoluteFillObject,
    width: "100%",
    height: "100%",
  },
  gradient: {
    position: "absolute",
    left: 0,
    right: 0,
    bottom: 0,
    height: "100%",
  },
  contentContainer: {
    flex: 1,
    justifyContent: "flex-end",
    backgroundColor: "transparent",
  },
  textWrapper: {
    backgroundColor: "rgba(0, 0, 0, 0.4)",
    paddingHorizontal: 10,
    paddingVertical: 8,
    borderBottomLeftRadius: 16,
    borderBottomRightRadius: 16,
    backdropFilter: "blur(10px)", // Note: works on web, ignored on native unless using specific libs
  },
  badgeContainer: {
    position: "absolute",
    top: 10,
    left: 10,
    flexDirection: "row",
    backgroundColor: "transparent",
  },
  indicator: {
    width: 6,
    height: 6,
    borderRadius: 3,
    marginRight: 4,
  },
  title: {
    color: "white",
    fontSize: 14,
    fontWeight: "bold",
    textShadowColor: "rgba(0, 0, 0, 0.75)",
    textShadowOffset: { width: -1, height: 1 },
    textShadowRadius: 10,
    marginBottom: 4,
  },
  infoRow: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "transparent",
  },
  rating: {
    color: "#FFD700",
    fontSize: 10,
    fontWeight: "600",
  },
});
