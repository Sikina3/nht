import { useColorScheme } from '@/components/useColorScheme';
import Colors from '@/constants/Colors';
import { useAuth } from '@/context/AuthContext';
import { authService } from '@/services/api';
import AuthInput from '@/components/ui/AuthInput';
import GradientButton from '@/components/ui/GradientButton';
import { useRouter } from 'expo-router';
import React, { useState } from 'react';
import { Alert, Dimensions, ScrollView, StatusBar, StyleSheet, Text, TouchableOpacity, View } from 'react-native';

const { height } = Dimensions.get('window');

export default function RegisterScreen() {
    const router = useRouter();
    const theme = useColorScheme() ?? "light";
    const { signIn } = useAuth();

    const [role, setRole] = useState('ecrivain');
    const [phoneNumber, setPhoneNumber] = useState('');
    const [fullName, setFullName] = useState('');
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [loading, setLoading] = useState(false);

    const validatePhone = (phone: string) => {
        const clean = phone.replace(/\s+/g, '');
        const regex = /^(03[23478]\d{7}|\+261(0)?3[23478]\d{7})$/;
        return regex.test(clean);
    };

    const handleRegister = async () => {
        if (!phoneNumber || !fullName || !password || !confirmPassword) {
            Alert.alert('Erreur', 'Veuillez remplir tous les champs');
            return;
        }

        if (!validatePhone(phoneNumber)) {
            Alert.alert('Erreur', 'Numéro de téléphone invalide. Utilisez 032, 033, 034, 037 ou 038 (10 chiffres).');
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

        let formattedPhone = phoneNumber;
        if (!formattedPhone.startsWith('+')) {
            formattedPhone = formattedPhone.startsWith('0')
                ? '+261' + formattedPhone.substring(1)
                : '+261' + formattedPhone;
        }

        setLoading(true);
        try {
            const userData = {
                nom: fullName,
                num_tel: formattedPhone,
                mot_de_passe: password,
                role: role.toLowerCase(),
                soldeCoins: 0
            };

            const response = await authService.register(userData);
            await signIn(response.data);
            router.replace('/(tabs)');
        } catch (error: any) {
            setLoading(false);
            const errorMsg = error.response?.data?.message
                ?? error.response?.data
                ?? error.message
                ?? 'Une erreur est survenue.';
            Alert.alert('Erreur', errorMsg);
        }
    };

    return (
        <View style={[styles.container, { backgroundColor: Colors[theme].background }]}>
            <StatusBar barStyle="light-content" />

            <ScrollView contentContainerStyle={styles.scrollContent} keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false}>
                <View style={styles.header}>
                    <Text style={[styles.logo, { color: Colors[theme].primary }]}>NHT</Text>
                    <Text style={styles.title}>Nouveau compte</Text>

                    <View style={styles.roleToggle}>
                        <TouchableOpacity
                            style={[styles.roleButton, role === 'ecrivain' && { backgroundColor: Colors[theme].primary }]}
                            onPress={() => setRole('ecrivain')}
                        >
                            <Text style={[styles.roleButtonText, role === 'ecrivain' && styles.roleButtonTextActive]}>Écrivain</Text>
                        </TouchableOpacity>
                        <TouchableOpacity
                            style={[styles.roleButton, role === 'lecteur' && { backgroundColor: Colors[theme].primary }]}
                            onPress={() => setRole('lecteur')}
                        >
                            <Text style={[styles.roleButtonText, role === 'lecteur' && styles.roleButtonTextActive]}>Lecteur</Text>
                        </TouchableOpacity>
                    </View>
                </View>

                <View style={styles.form}>
                    <AuthInput
                        label="Téléphone"
                        value={phoneNumber}
                        onChangeText={setPhoneNumber}
                        placeholder="03x xx xxx xx"
                        keyboardType="phone-pad"
                    />

                    <AuthInput
                        label="Nom complet"
                        value={fullName}
                        onChangeText={setFullName}
                        placeholder="Votre nom"
                        autoCapitalize="words"
                    />

                    <AuthInput
                        label="Mot de passe"
                        value={password}
                        onChangeText={setPassword}
                        placeholder="••••••••"
                        secureTextEntry
                        showPasswordToggle
                    />

                    <AuthInput
                        label="Confirmer"
                        value={confirmPassword}
                        onChangeText={setConfirmPassword}
                        placeholder="••••••••"
                        secureTextEntry
                        showPasswordToggle
                    />

                    <GradientButton
                        title="Créer mon compte"
                        onPress={handleRegister}
                        loading={loading}
                        style={styles.button}
                    />

                    <View style={styles.footer}>
                        <Text style={styles.footerText}>Déjà inscrit ? </Text>
                        <TouchableOpacity onPress={() => router.push('/login')}>
                            <Text style={[styles.signupText, { color: Colors[theme].primary }]}>Se connecter</Text>
                        </TouchableOpacity>
                    </View>
                </View>

                <View style={{ height: 40 }} />
            </ScrollView>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
    },
    scrollContent: {
        paddingHorizontal: 25,
        flexGrow: 1,
    },
    header: {
        marginTop: height * 0.08,
        marginBottom: 30,
        alignItems: 'center',
    },
    logo: {
        fontSize: 42,
        fontWeight: '900',
        letterSpacing: -2,
        marginBottom: 8,
    },
    title: {
        fontSize: 22,
        fontWeight: '800',
        color: 'white',
        marginBottom: 25,
    },
    roleToggle: {
        flexDirection: 'row',
        backgroundColor: 'rgba(255,255,255,0.05)',
        borderRadius: 14,
        padding: 4,
        width: '100%',
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.1)',
    },
    roleButton: {
        flex: 1,
        paddingVertical: 12,
        alignItems: 'center',
        borderRadius: 10,
    },
    roleButtonText: {
        color: 'rgba(255,255,255,0.5)',
        fontWeight: '700',
        fontSize: 14,
    },
    roleButtonTextActive: {
        color: 'white',
    },
    form: {
        flex: 1,
    },
    button: {
        marginTop: 10,
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
