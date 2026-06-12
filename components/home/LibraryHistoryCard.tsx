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
    <TouchableOpacity style={styles.container}>
      <Image source={{ uri: imageUrl }} style={styles.image} />
      <View style={styles.info}>
        <Text style={styles.title} numberOfLines={1}>
          {title}
        </Text>
        <Text style={styles.author}>{author}</Text>
        <View style={styles.progressBg}>
          <View style={[styles.progressFill, { width: `${progress}%`, backgroundColor: Colors[theme].primary }]} />
        </View>
        <Text style={styles.progressText}>{progress}% lu</Text>
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: "row",
    backgroundColor: "#1A1C22",
    borderRadius: 16,
    padding: 12,
    marginBottom: 15,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.05)",
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
    color: "#FFFFFF",
    marginBottom: 4,
  },
  author: {
    fontSize: 14,
    color: "rgba(255,255,255,0.5)",
    marginBottom: 10,
  },
  progressBg: {
    height: 5,
    backgroundColor: "rgba(255,255,255,0.1)",
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
    color: "rgba(255,255,255,0.4)",
    fontWeight: "600",
  },
});

