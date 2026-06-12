import { useColorScheme } from '@/components/useColorScheme';
import Colors from '@/constants/Colors';
import AuthInput from '@/components/ui/AuthInput';
import BackButton from '@/components/ui/BackButton';
import GradientButton from '@/components/ui/GradientButton';
import IconCircle from '@/components/ui/IconCircle';
import { useRouter } from 'expo-router';
import React, { useState } from 'react';
import { ActivityIndicator, Alert, Dimensions, StatusBar, StyleSheet, Text, View } from 'react-native';

const { height } = Dimensions.get('window');

export default function ResetPasswordScreen() {
    const router = useRouter();
    const theme = useColorScheme() ?? "light";
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [loading, setLoading] = useState(false);

    const handleReset = async () => {
        if (!password || !confirmPassword) {
            Alert.alert('Erreur', 'Veuillez remplir tous les champs');
            return;
        }

        if (password.length < 6) {
            Alert.alert('Erreur', 'Le mot de passe doit contenir au moins 6 caractères');
            return;
        }

        if (password !== confirmPassword) {
            Alert.alert('Erreur', 'Les mots de passe ne correspondent pas');
            return;
        }

        setLoading(true);
        try {
            // Ici viendra l'appel API pour réinitialiser le mot de passe
            // const response = await authService.resetPassword(phoneNumber, password);
            Alert.alert('Succès', 'Votre mot de passe a été réinitialisé');
            router.replace('/(auth)/login');
        } catch (error: any) {
            Alert.alert('Erreur', 'Impossible de réinitialiser le mot de passe');
        } finally {
            setLoading(false);
        }
    };

    return (
        <View style={styles.container}>
            <StatusBar barStyle="light-content" />

            <View style={styles.header}>
                <BackButton onPress={() => router.back()} />
            </View>

            <View style={styles.content}>
                <IconCircle iconName="key-outline" />

                <Text style={styles.title}>Nouveau mot de passe</Text>
                <Text style={styles.subtitle}>
                    Créez un nouveau mot de passe sécurisé que vous n'utilisez pas ailleurs.
                </Text>

                <AuthInput
                    label="Nouveau mot de passe"
                    value={password}
                    onChangeText={setPassword}
                    placeholder="Nouveau mot de passe"
                    secureTextEntry
                    showPasswordToggle
                    style={styles.input}
                />

                <AuthInput
                    label="Confirmation"
                    value={confirmPassword}
                    onChangeText={setConfirmPassword}
                    placeholder="Confirmation mot de passe"
                    secureTextEntry
                    showPasswordToggle
                    style={styles.input}
                />

                <GradientButton
                    title="Réinitialiser"
                    onPress={handleReset}
                    loading={loading}
                    style={styles.mainButton}
                />
            </View>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#0F1014',
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
    input: {
        width: '100%',
    },
    mainButton: {
        width: '100%',
        height: 60,
        borderRadius: 16,
        marginTop: 20,
    },
});
