import Colors from '@/constants/Colors';
import { useColorScheme } from '@/components/useColorScheme';
import React from 'react';
import { ActivityIndicator, StyleSheet, Text, TouchableOpacity, View } from 'react-native';

interface ModalActionButtonsProps {
    onCancel: () => void;
    onConfirm: () => void;
    cancelLabel?: string;
    confirmLabel?: string;
    loading?: boolean;
    confirmColor?: string;
}

export default function ModalActionButtons({
    onCancel,
    onConfirm,
    cancelLabel = 'Annuler',
    confirmLabel = 'Confirmer',
    loading = false,
    confirmColor,
}: ModalActionButtonsProps) {
    const theme = useColorScheme() ?? 'light';
    const bgColor = confirmColor ?? Colors[theme].primary;

    return (
        <View style={styles.container}>
            <TouchableOpacity style={styles.cancelBtn} onPress={onCancel}>
                <Text style={styles.cancelText}>{cancelLabel}</Text>
            </TouchableOpacity>
            <TouchableOpacity
                style={[styles.confirmBtn, { backgroundColor: bgColor }]}
                onPress={onConfirm}
                disabled={loading}
            >
                {loading
                    ? <ActivityIndicator color="white" size="small" />
                    : <Text style={styles.confirmText}>{confirmLabel}</Text>
                }
            </TouchableOpacity>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flexDirection: 'row',
        gap: 15,
    },
    cancelBtn: {
        flex: 1,
        height: 50,
        borderRadius: 12,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: 'rgba(255,255,255,0.05)',
    },
    cancelText: {
        color: 'white',
        fontWeight: '700',
        fontSize: 15,
    },
    confirmBtn: {
        flex: 2,
        height: 50,
        borderRadius: 12,
        justifyContent: 'center',
        alignItems: 'center',
    },
    confirmText: {
        color: 'white',
        fontWeight: '800',
        fontSize: 15,
    },
});
