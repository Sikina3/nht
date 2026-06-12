import { authService } from '@/services/api';
import Colors from '@/constants/Colors';
import { useAuth } from '@/context/AuthContext';
import { useColorScheme } from '@/components/useColorScheme';
import AuthInput from '@/components/ui/AuthInput';
import GradientButton from '@/components/ui/GradientButton';
import { useRouter } from 'expo-router';
import React, { useState } from 'react';
import { Alert, Dimensions, StatusBar, StyleSheet, Text, TouchableOpacity, View } from 'react-native';

const { height } = Dimensions.get('window');

export default function LoginScreen() {
    const router = useRouter();
    const theme = useColorScheme() ?? "light";
    const { signIn } = useAuth();
    const [phoneNumber, setPhoneNumber] = useState('');
    const [password, setPassword] = useState('');
    const [loading, setLoading] = useState(false);

    const validatePhone = (phone: string) => {
        const clean = phone.replace(/\s+/g, '');
        const regex = /^(03[23478]\d{7}|\+261(0)?3[23478]\d{7})$/;
        return regex.test(clean);
    };

    const handleLogin = async () => {
        if (!phoneNumber || !password) {
            Alert.alert('Erreur', 'Veuillez remplir tous les champs');
            return;
        }

        if (!validatePhone(phoneNumber)) {
            Alert.alert('Erreur', 'Numéro de téléphone invalide. Utilisez 032, 033, 034, 037 ou 038 (10 chiffres).');
            return;
        }

        setLoading(true);
        try {
            const response = await authService.login(phoneNumber, password);
            const userData = response.data;

            // Sauvegarde les vraies données de l'utilisateur dans le contexte
            await signIn({
                id: userData.id,
                nom: userData.nom,
                num_tel: userData.num_tel,
                role: userData.role,
                soldeCoins: userData.soldeCoins ?? 0,
                photoProfile: userData.photoProfile,
                bio: userData.biographie || userData.bio,
                dateInscription: userData.dateInscription,
            });

            router.replace('/(tabs)');
        } catch (error: any) {
            const status = error?.response?.status;
            if (status === 401 || status === 403) {
                Alert.alert('Erreur', 'Numéro de téléphone ou mot de passe incorrect.');
            } else if (status === 404) {
                Alert.alert('Erreur', 'Compte introuvable. Vérifiez votre numéro.');
            } else {
                Alert.alert('Erreur de connexion', 'Impossible de joindre le serveur. Vérifiez votre connexion internet.');
            }
        } finally {
            setLoading(false);
        }
    };

    return (
        <View style={[styles.container, { backgroundColor: Colors[theme].background }]}>
            <StatusBar barStyle="light-content" />

            {/* Top Section / Branding */}
            <View style={styles.header}>
                <Text style={[styles.logo, { color: Colors[theme].primary }]}>NHT</Text>
                <Text style={styles.title}>Content de vous revoir</Text>
                <Text style={styles.subtitle}>Connectez-vous pour continuer votre lecture</Text>
            </View>

            {/* Form Section */}
            <View style={styles.form}>
                <AuthInput
                    label="Téléphone"
                    value={phoneNumber}
                    onChangeText={setPhoneNumber}
                    placeholder="03x xx xxx xx"
                    keyboardType="phone-pad"
                />

                <AuthInput
                    label="Mot de passe"
                    value={password}
                    onChangeText={setPassword}
                    placeholder="••••••••"
                    secureTextEntry
                    showPasswordToggle
                />

                <GradientButton
                    title="Se connecter"
                    onPress={handleLogin}
                    loading={loading}
                    style={styles.button}
                />

                <View style={styles.footer}>
                    <Text style={styles.footerText}>Nouveau sur NHT ? </Text>
                    <TouchableOpacity onPress={() => router.push('/register')}>
                        <Text style={[styles.signupText, { color: Colors[theme].primary }]}>S'inscrire</Text>
                    </TouchableOpacity>
                </View>
            </View>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        paddingHorizontal: 25,
    },
    header: {
        marginTop: height * 0.12,
        marginBottom: 40,
        alignItems: 'center',
    },
    logo: {
        fontSize: 48,
        fontWeight: '900',
        letterSpacing: -2,
        marginBottom: 10,
    },
    title: {
        fontSize: 24,
        fontWeight: '800',
        color: 'white',
        marginBottom: 10,
    },
    subtitle: {
        fontSize: 14,
        color: 'rgba(255,255,255,0.5)',
        textAlign: 'center',
    },
    form: {
        flex: 1,
    },
    button: {
        marginBottom: 25,
    },
    footer: {
        flexDirection: 'row',
        justifyContent: 'center',
        alignItems: 'center',
    },
    footerText: {
        color: 'rgba(255,255,255,0.5)',
        fontSize: 14,
    },
    signupText: {
        fontSize: 14,
        fontWeight: 'bold',
    },
});
