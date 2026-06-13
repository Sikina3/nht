import { useColorScheme } from '@/components/useColorScheme';
import Colors from '@/constants/Colors';
import BackButton from '@/components/ui/BackButton';
import GradientButton from '@/components/ui/GradientButton';
import IconCircle from '@/components/ui/IconCircle';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import React, { useState } from 'react';
import { Dimensions, StatusBar, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';

const { height } = Dimensions.get('window');

export default function ForgotPasswordScreen() {
    const router = useRouter();
    const theme = useColorScheme() ?? "light";
    const [phoneNumber, setPhoneNumber] = useState('');

    return (
        <View style={[styles.container, { backgroundColor: Colors[theme].background }]}>
            <StatusBar barStyle={theme === 'dark' ? 'light-content' : 'dark-content'} />

            {/* Background elements */}
            <View style={styles.bgCircle} />

            <View style={styles.header}>
                <BackButton onPress={() => router.back()} />
            </View>

            <View style={styles.content}>
                <IconCircle iconName="lock-open-outline" />

                <Text style={[styles.title, { color: Colors[theme].text }]}>Mot de passe oublié ?</Text>
                <Text style={[styles.subtitle, { color: Colors[theme].textMuted }]}>
                    Ne vous inquiétez pas ! Entrez votre numéro et nous vous enverrons un code de réinitialisation.
                </Text>

                <View style={[styles.inputContainer, { backgroundColor: Colors[theme].cardBgHover, borderColor: Colors[theme].borderColor }]}>
                    <Ionicons name="call-outline" size={20} color={Colors[theme].icon} style={styles.inputIcon} />
                    <TextInput
                        style={[styles.input, { color: Colors[theme].text }]}
                        placeholder="Numéro de téléphone"
                        placeholderTextColor={Colors[theme].textHint}
                        keyboardType="phone-pad"
                        value={phoneNumber}
                        onChangeText={setPhoneNumber}
                    />
                </View>

                <GradientButton
                    title="Envoyer le code"
                    onPress={() => router.push('/(auth)/verify-otp')}
                    style={styles.mainButton}
                />

                <TouchableOpacity
                    style={styles.footerLink}
                    onPress={() => router.push('/(auth)/register')}
                >
                    <Text style={[styles.footerText, { color: Colors[theme].textMuted }]}>
                        Pas encore de compte ? <Text style={[styles.linkText, { color: Colors[theme].primary }]}>S'inscrire</Text>
                    </Text>
                </TouchableOpacity>
            </View>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
    },
    bgCircle: {
        position: 'absolute',
        top: -100,
        right: -100,
        width: 300,
        height: 300,
        borderRadius: 150,
        backgroundColor: 'rgba(229, 9, 20, 0.05)', // Kept static as it's a primary brand accent
    },
    header: {
        paddingTop: 50,
        paddingHorizontal: 20,
    },
    content: {
        flex: 1,
        paddingHorizontal: 30,
        paddingTop: height * 0.05,
        alignItems: 'center',
    },
    title: {
        fontSize: 28,
        fontWeight: '900',
        textAlign: 'center',
        marginBottom: 15,
        letterSpacing: -0.5,
    },
    subtitle: {
        fontSize: 16,
        textAlign: 'center',
        lineHeight: 24,
        marginBottom: 40,
        paddingHorizontal: 10,
    },
    inputContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        width: '100%',
        height: 60,
        borderRadius: 16,
        borderWidth: 1,
        paddingHorizontal: 15,
        marginBottom: 25,
    },
    inputIcon: {
        marginRight: 12,
    },
    input: {
        flex: 1,
        fontSize: 16,
        fontWeight: '600',
    },
    mainButton: {
        width: '100%',
        height: 60,
        borderRadius: 16,
        marginTop: 10,
    },
    footerLink: {
        marginTop: 30,
    },
    footerText: {
        fontSize: 14,
    },
    linkText: {
        fontWeight: '900',
    },
});
