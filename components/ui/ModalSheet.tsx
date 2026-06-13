import { useColorScheme } from '@/components/useColorScheme';
import Colors from '@/constants/Colors';
import { Ionicons } from '@expo/vector-icons';
import React, { ReactNode } from 'react';
import { Modal, StyleSheet, TouchableOpacity, View } from 'react-native';

interface ModalSheetProps {
    visible: boolean;
    onClose: () => void;
    children: ReactNode;
    animationType?: 'slide' | 'fade' | 'none';
    /** Si true, le modal monte depuis le bas (bottom sheet). Sinon centré. */
    bottomSheet?: boolean;
    showCloseButton?: boolean;
}

export default function ModalSheet({
    visible,
    onClose,
    children,
    animationType = 'slide',
    bottomSheet = false,
    showCloseButton = false,
}: ModalSheetProps) {
    const theme = useColorScheme() ?? 'light';

    return (
        <Modal
            visible={visible}
            animationType={animationType}
            transparent={true}
            onRequestClose={onClose}
        >
            <TouchableOpacity
                style={[styles.overlay, bottomSheet && styles.overlayBottom]}
                activeOpacity={1}
                onPress={onClose}
            >
                <TouchableOpacity
                    activeOpacity={1}
                    style={[styles.content, bottomSheet && styles.contentBottom, { backgroundColor: Colors[theme].background, borderColor: Colors[theme].borderColor }]}
                    onPress={() => {}}
                >
                    {bottomSheet && <View style={[styles.bar, { backgroundColor: Colors[theme].borderColor }]} />}
                    {showCloseButton && (
                        <TouchableOpacity style={styles.closeBtn} onPress={onClose}>
                            <Ionicons name="close" size={28} color={Colors[theme].icon} />
                        </TouchableOpacity>
                    )}
                    {children}
                </TouchableOpacity>
            </TouchableOpacity>
        </Modal>
    );
}

const styles = StyleSheet.create({
    overlay: {
        flex: 1,
        backgroundColor: 'rgba(0,0,0,0.8)',
        justifyContent: 'center',
        padding: 25,
    },
    overlayBottom: {
        justifyContent: 'flex-end',
        padding: 0,
        backgroundColor: 'rgba(0,0,0,0.7)',
    },
    content: {
        borderRadius: 32,
        padding: 30,
        borderWidth: 1,
    },
    contentBottom: {
        borderRadius: 0,
        borderTopLeftRadius: 30,
        borderTopRightRadius: 30,
        padding: 24,
        paddingBottom: 40,
    },
    bar: {
        width: 40,
        height: 5,
        borderRadius: 3,
        alignSelf: 'center',
        marginBottom: 20,
    },
    closeBtn: {
        position: 'absolute',
        top: 20,
        right: 20,
    },
});
