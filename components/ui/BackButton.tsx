import { Ionicons } from '@expo/vector-icons';
import React from 'react';
import { StyleSheet, TouchableOpacity } from 'react-native';

interface BackButtonProps {
    onPress: () => void;
    color?: string;
    iconSize?: number;
}

export default function BackButton({ onPress, color = 'white', iconSize = 24 }: BackButtonProps) {
    return (
        <TouchableOpacity style={styles.backButton} onPress={onPress} activeOpacity={0.7}>
            <Ionicons name="arrow-back" size={iconSize} color={color} />
        </TouchableOpacity>
    );
}

const styles = StyleSheet.create({
    backButton: {
        width: 44,
        height: 44,
        borderRadius: 12,
        backgroundColor: 'rgba(255,255,255,0.05)',
        justifyContent: 'center',
        alignItems: 'center',
    },
});
