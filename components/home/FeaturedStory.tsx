import { useColorScheme } from "@/components/useColorScheme";
import Colors from "@/constants/Colors";
import { LinearGradient } from "expo-linear-gradient";
import React from "react";
import {
    Dimensions,
    Image,
    StyleSheet,
    TouchableOpacity,
} from "react-native";
import { Text, View } from "../Themed";

const { width } = Dimensions.get("window");

interface FeaturedStoryProps {
    title: string;
    description: string;
    imageUrl: string;
    onPress: () => void;
}

export default function FeaturedStory({
    title,
    description,
    imageUrl,
    onPress,
}: FeaturedStoryProps) {
    const theme = useColorScheme() ?? "light";
    const gradientColors = theme === 'dark' 
        ? ["transparent", "rgba(15, 16, 20, 0.5)", "rgba(15, 16, 20, 0.95)"]
        : ["transparent", "rgba(248, 249, 250, 0.5)", "rgba(248, 249, 250, 0.95)"];

    return (
        <TouchableOpacity
            activeOpacity={0.9}
            onPress={onPress}
            style={styles.container}
        >
            <View style={[styles.card, { backgroundColor: Colors[theme].cardBg }]}>
                <Image
                    source={{ uri: imageUrl }}
                    style={styles.image}
                    resizeMode="cover"
                />

                <LinearGradient
                    colors={gradientColors as any}
                    style={styles.gradient}
                />

                <View style={styles.content}>
                    <View style={styles.badge}>
                        <Text style={styles.badgeText}>À LA UNE</Text>
                    </View>

                    <Text style={[styles.title, { color: Colors[theme].text }]} numberOfLines={2}>
                        {title}
                    </Text>

                    <Text style={[styles.description, { color: Colors[theme].textMuted }]} numberOfLines={2}>
                        {description}
                    </Text>

                    <View style={styles.buttonContainer}>
                        <TouchableOpacity style={[styles.button, { backgroundColor: theme === 'dark' ? 'white' : Colors[theme].text }]} onPress={onPress}>
                            <Text style={[styles.buttonText, { color: theme === 'dark' ? 'black' : Colors[theme].background }]}>Lire maintenant</Text>
                        </TouchableOpacity>
                    </View>
                </View>
            </View>
        </TouchableOpacity>
    );
}

const styles = StyleSheet.create({
    container: {
        width: width,
        paddingHorizontal: 0,
        marginBottom: 10,
    },
    card: {
        height: 300,
        width: "100%",
        borderBottomLeftRadius: 24,
        borderBottomRightRadius: 24,
        overflow: "hidden",
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
        height: "80%",
    },
    content: {
        position: "absolute",
        bottom: 0,
        left: 0,
        right: 0,
        padding: 20,
        backgroundColor: "transparent",
    },
    badge: {
        backgroundColor: "#E50914",
        paddingHorizontal: 8,
        paddingVertical: 3,
        borderRadius: 6,
        alignSelf: "flex-start",
        marginBottom: 8,
    },
    badgeText: {
        color: "white",
        fontSize: 10,
        fontWeight: "900",
        letterSpacing: 1,
    },
    title: {
        fontSize: 24,
        fontWeight: "900",
        marginBottom: 4,
        lineHeight: 28,
        letterSpacing: -0.5,
    },
    description: {
        fontSize: 13,
        marginBottom: 15,
        lineHeight: 18,
    },
    buttonContainer: {
        backgroundColor: "transparent",
    },
    button: {
        paddingHorizontal: 20,
        paddingVertical: 10,
        borderRadius: 10,
        alignSelf: "flex-start",
    },
    buttonText: {
        fontSize: 14,
        fontWeight: "900",
    },
});
