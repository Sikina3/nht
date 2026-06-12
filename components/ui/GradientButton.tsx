import Colors from '@/constants/Colors';
import { useColorScheme } from '@/components/useColorScheme';
import { LinearGradient } from 'expo-linear-gradient';
import React from 'react';
import { ActivityIndicator, StyleSheet, Text, TouchableOpacity, ViewStyle } from 'react-native';

interface GradientButtonProps {
    title: string;
    onPress: () => void;
    loading?: boolean;
    disabled?: boolean;
    style?: ViewStyle;
    colors?: readonly [string, string, ...string[]];
}

export default function GradientButton({
    title,
    onPress,
    loading = false,
    disabled = false,
    style,
    colors,
}: GradientButtonProps) {
    const theme = useColorScheme() ?? 'light';
    const gradientColors = colors ?? [Colors[theme].primary, '#B20610'] as const;

    return (
        <TouchableOpacity
            style={[styles.button, style]}
            onPress={onPress}
            disabled={disabled || loading}
            activeOpacity={0.8}
        >
            <LinearGradient
                colors={gradientColors}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
                style={styles.gradient}
            >
                {loading
                    ? <ActivityIndicator color="white" />
                    : <Text style={styles.buttonText}>{title}</Text>
                }
            </LinearGradient>
        </TouchableOpacity>
    );
}

const styles = StyleSheet.create({
    button: {
        height: 56,
        borderRadius: 16,
        overflow: 'hidden',
    },
    gradient: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },
    buttonText: {
        color: 'white',
        fontSize: 16,
        fontWeight: 'bold',
    },
});
