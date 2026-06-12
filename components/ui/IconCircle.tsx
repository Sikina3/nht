import Colors from '@/constants/Colors';
import { useColorScheme } from '@/components/useColorScheme';
import { Ionicons } from '@expo/vector-icons';
import React from 'react';
import { StyleSheet, View } from 'react-native';

interface IconCircleProps {
    iconName: keyof typeof Ionicons.glyphMap;
    color?: string;
    size?: number;
    circleSize?: number;
}

export default function IconCircle({ iconName, color, size = 40, circleSize = 100 }: IconCircleProps) {
    const theme = useColorScheme() ?? 'light';
    const iconColor = color ?? Colors[theme].primary;

    return (
        <View
            style={[
                styles.circle,
                {
                    width: circleSize,
                    height: circleSize,
                    borderRadius: circleSize / 2,
                },
            ]}
        >
            <Ionicons name={iconName} size={size} color={iconColor} />
        </View>
    );
}

const styles = StyleSheet.create({
    circle: {
        backgroundColor: 'rgba(229, 9, 20, 0.1)',
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 30,
    },
});
