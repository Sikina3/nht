import { useColorScheme } from "@/components/useColorScheme";
import Colors from "@/constants/Colors";
import React from "react";
import { StyleSheet, TouchableOpacity } from "react-native";
import { Text, View } from "../Themed";

interface SectionHeaderProps {
  title: string;
  showSeeMore?: boolean;
  onSeeMorePress?: () => void;
}

export default function SectionHeader({
  title,
  showSeeMore,
  onSeeMorePress,
}: SectionHeaderProps) {
  const theme = useColorScheme() ?? "light";

  return (
    <View style={styles.container}>
      <View style={styles.titleContainer}>
        <View style={[styles.accent, { backgroundColor: Colors[theme].primary }]} />
        <Text style={styles.title}>{title}</Text>
      </View>
      {showSeeMore && (
        <TouchableOpacity onPress={onSeeMorePress} activeOpacity={0.7}>
          <Text style={[styles.seeMore, { color: Colors[theme].medium }]}>
            Voir plus
          </Text>
        </TouchableOpacity>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 20,
    marginTop: 25,
    marginBottom: 15,
    backgroundColor: "transparent",
  },
  titleContainer: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "transparent",
  },
  accent: {
    width: 4,
    height: 18,
    borderRadius: 2,
    marginRight: 10,
  },
  title: {
    fontSize: 18,
    fontWeight: "800",
    letterSpacing: -0.5,
  },
  seeMore: {
    fontSize: 12,
    fontWeight: "600",
    opacity: 0.8,
  },
});

