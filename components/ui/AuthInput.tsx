import { Ionicons } from '@expo/vector-icons';
import React, { useState } from 'react';
import {
    KeyboardTypeOptions,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    View,
    ViewStyle,
} from 'react-native';

interface AuthInputProps {
    label: string;
    value: string;
    onChangeText: (text: string) => void;
    placeholder?: string;
    keyboardType?: KeyboardTypeOptions;
    secureTextEntry?: boolean;
    showPasswordToggle?: boolean;
    multiline?: boolean;
    maxLength?: number;
    autoCapitalize?: 'none' | 'sentences' | 'words' | 'characters';
    style?: ViewStyle;
    inputStyle?: ViewStyle;
}

export default function AuthInput({
    label,
    value,
    onChangeText,
    placeholder = '',
    keyboardType = 'default',
    secureTextEntry = false,
    showPasswordToggle = false,
    multiline = false,
    maxLength,
    autoCapitalize = 'none',
    style,
    inputStyle,
}: AuthInputProps) {
    const [showText, setShowText] = useState(false);
    const isSecure = secureTextEntry && !showText;

    return (
        <View style={[styles.wrapper, style]}>
            <Text style={styles.label}>{label}</Text>
            <View style={[styles.container, showPasswordToggle && styles.passwordContainer]}>
                <TextInput
                    style={[styles.input, showPasswordToggle && styles.passwordInput, multiline && styles.multilineInput, inputStyle]}
                    placeholder={placeholder}
                    placeholderTextColor="rgba(255,255,255,0.3)"
                    keyboardType={keyboardType}
                    value={value}
                    onChangeText={onChangeText}
                    secureTextEntry={isSecure}
                    multiline={multiline}
                    maxLength={maxLength}
                    autoCapitalize={autoCapitalize}
                    textAlignVertical={multiline ? 'top' : 'center'}
                />
                {showPasswordToggle && (
                    <TouchableOpacity onPress={() => setShowText(!showText)} style={styles.eyeIcon}>
                        <Ionicons
                            name={showText ? 'eye-off' : 'eye'}
                            size={24}
                            color="rgba(255,255,255,0.5)"
                        />
                    </TouchableOpacity>
                )}
            </View>
        </View>
    );
}

const styles = StyleSheet.create({
    wrapper: {
        marginBottom: 20,
    },
    label: {
        color: 'rgba(255,255,255,0.6)',
        fontSize: 12,
        fontWeight: 'bold',
        marginBottom: 8,
        textTransform: 'uppercase',
        letterSpacing: 1,
    },
    container: {
        backgroundColor: 'rgba(255,255,255,0.05)',
        borderRadius: 12,
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.1)',
    },
    passwordContainer: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    input: {
        paddingVertical: 15,
        paddingHorizontal: 15,
        color: 'white',
        fontSize: 16,
    },
    passwordInput: {
        flex: 1,
    },
    multilineInput: {
        minHeight: 100,
        paddingTop: 12,
    },
    eyeIcon: {
        padding: 15,
    },
});
