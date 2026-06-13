import { useColorScheme } from '@/components/useColorScheme';
import Colors from '@/constants/Colors';
import { Ionicons } from '@expo/vector-icons';
import React from 'react';
import { StyleSheet, TouchableOpacity } from 'react-native';

interface BackButtonProps {
    onPress: () => void;
    color?: string;
    iconSize?: number;
}

export default function BackButton({ onPress, color, iconSize = 24 }: BackButtonProps) {
    const theme = useColorScheme() ?? "light";
    const iconColor = color || Colors[theme].text;

    return (
        <TouchableOpacity style={[styles.backButton, { backgroundColor: Colors[theme].cardBgHover }]} onPress={onPress} activeOpacity={0.7}>
            <Ionicons name="arrow-back" size={iconSize} color={iconColor} />
        </TouchableOpacity>
    );
}

const styles = StyleSheet.create({
    backButton: {
        width: 44,
        height: 44,
        borderRadius: 12,
        justifyContent: 'center',
        alignItems: 'center',
    },
});
