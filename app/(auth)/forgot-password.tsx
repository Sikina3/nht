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
        <View style={styles.container}>
            <StatusBar barStyle="light-content" />

            {/* Background elements */}
            <View style={styles.bgCircle} />

            <View style={styles.header}>
                <BackButton onPress={() => router.back()} />
            </View>

            <View style={styles.content}>
                <IconCircle iconName="lock-open-outline" />

                <Text style={styles.title}>Mot de passe oublié ?</Text>
                <Text style={styles.subtitle}>
                    Ne vous inquiétez pas ! Entrez votre numéro et nous vous enverrons un code de réinitialisation.
                </Text>

                <View style={[styles.inputContainer, { borderColor: 'rgba(255,255,255,0.1)' }]}>
                    <Ionicons name="call-outline" size={20} color="rgba(255,255,255,0.4)" style={styles.inputIcon} />
                    <TextInput
                        style={styles.input}
                        placeholder="Numéro de téléphone"
                        placeholderTextColor="rgba(255,255,255,0.3)"
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
                    <Text style={styles.footerText}>
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
        backgroundColor: '#0F1014',
    },
    bgCircle: {
        position: 'absolute',
        top: -100,
        right: -100,
        width: 300,
        height: 300,
        borderRadius: 150,
        backgroundColor: 'rgba(229, 9, 20, 0.05)',
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
        color: 'white',
        textAlign: 'center',
        marginBottom: 15,
        letterSpacing: -0.5,
    },
    subtitle: {
        fontSize: 16,
        color: 'rgba(255,255,255,0.5)',
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
        backgroundColor: 'rgba(255,255,255,0.03)',
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
        color: 'white',
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
        color: 'rgba(255,255,255,0.5)',
    },
    linkText: {
        fontWeight: '900',
    },
});
