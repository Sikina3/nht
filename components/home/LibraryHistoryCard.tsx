import { useColorScheme } from "@/components/useColorScheme";
import Colors from "@/constants/Colors";
import React from "react";
import { Image, StyleSheet, TouchableOpacity, View } from "react-native";
import { Text } from "../Themed";

interface LibraryHistoryCardProps {
  title: string;
  author: string;
  imageUrl: string;
  progress: number; // entre 0 et 100
}

export default function LibraryHistoryCard({
  title,
  author,
  imageUrl,
  progress,
}: LibraryHistoryCardProps) {
  const theme = useColorScheme() ?? "light";

  return (
    <TouchableOpacity style={[styles.container, { backgroundColor: Colors[theme].cardBg, borderColor: Colors[theme].borderColor }]}>
      <Image source={{ uri: imageUrl }} style={styles.image} />
      <View style={styles.info}>
        <Text style={[styles.title, { color: Colors[theme].text }]} numberOfLines={1}>
          {title}
        </Text>
        <Text style={[styles.author, { color: Colors[theme].textMuted }]}>{author}</Text>
        <View style={[styles.progressBg, { backgroundColor: Colors[theme].borderFaint }]}>
          <View style={[styles.progressFill, { width: `${progress}%`, backgroundColor: Colors[theme].primary }]} />
        </View>
        <Text style={[styles.progressText, { color: Colors[theme].textHint }]}>{progress}% lu</Text>
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: "row",
    borderRadius: 16,
    padding: 12,
    marginBottom: 15,
    borderWidth: 1,
  },
  image: {
    width: 65,
    height: 90,
    borderRadius: 10,
  },
  info: {
    flex: 1,
    marginLeft: 15,
    justifyContent: "center",
    backgroundColor: "transparent",
  },
  title: {
    fontSize: 16,
    fontWeight: "bold",
    marginBottom: 4,
  },
  author: {
    fontSize: 14,
    marginBottom: 10,
  },
  progressBg: {
    height: 5,
    borderRadius: 3,
    width: "100%",
    marginBottom: 6,
  },
  progressFill: {
    height: "100%",
    borderRadius: 3,
  },
  progressText: {
    fontSize: 11,
    fontWeight: "600",
  },
});

