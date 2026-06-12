import { useColorScheme } from '@/components/useColorScheme';
import Colors from '@/constants/Colors';
import { useAuth } from '@/context/AuthContext';
import { authService } from '@/services/api';
import BackButton from '@/components/ui/BackButton';
import GradientButton from '@/components/ui/GradientButton';
import IconCircle from '@/components/ui/IconCircle';
import { useLocalSearchParams, useRouter } from 'expo-router';
import React, { useEffect, useRef, useState } from 'react';
import { Alert, Dimensions, StatusBar, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';

const { width, height } = Dimensions.get('window');

export default function VerifyOtpScreen() {
    const router = useRouter();
    const theme = useColorScheme() ?? "light";
    const params = useLocalSearchParams();
    const { signIn } = useAuth();
    const [otp, setOtp] = useState(['', '', '', '', '', '']);
    const [timer, setTimer] = useState(59);
    const [loading, setLoading] = useState(false);
    const inputs = useRef<TextInput[]>([]);

    useEffect(() => {
        let interval: any;
        if (timer > 0) {
            interval = setInterval(() => {
                setTimer((prev) => prev - 1);
            }, 1000);
        }
        return () => clearInterval(interval);
    }, [timer]);

    const handleChange = (text: string, index: number) => {
        const newOtp = [...otp];
        newOtp[index] = text;
        setOtp(newOtp);
        if (text && index < 5) {
            inputs.current[index + 1]?.focus();
        }
    };

    const handleKeyPress = (e: any, index: number) => {
        if (e.nativeEvent.key === 'Backspace' && !otp[index] && index > 0) {
            inputs.current[index - 1]?.focus();
        }
    };

    const handleValidate = async () => {
        const code = otp.join('');
        if (code.length < 6) {
            Alert.alert('Erreur', 'Veuillez entrer le code de 6 chiffres');
            return;
        }

        setLoading(true);
        try {
            await completeRegistration();
        } catch (error: any) {
            setLoading(false);
            console.error('OTP Error:', error);
            Alert.alert('Erreur', 'Code invalide ou expiré.');
        }
    };

    const completeRegistration = async () => {
        if (params.mode === 'register') {
            const userData = {
                nom: params.fullName,
                num_tel: params.phoneNumber,
                mot_de_passe: params.password,
                role: params.role,
                soldeCoins: 0
            };

            try {
                const response = await authService.register(userData);
                await signIn(response.data);
                setLoading(false);
                router.replace('/(tabs)');
            } catch (backendError: any) {
                setLoading(false);
                const errorMsg = backendError.response?.data || backendError.message;
                Alert.alert('Erreur Backend', `L'OTP est correct, mais le serveur a répondu : ${errorMsg}`);
            }
        } else {
            setLoading(false);
            router.push('/(auth)/reset-password');
        }
    };

    const handleResendCode = () => {
        setTimer(59);
        Alert.alert('Simulation', 'Un nouveau code a été envoyé vers ' + params.phoneNumber);
    };

    return (
        <View style={styles.container}>
            <StatusBar barStyle="light-content" />
            <View style={styles.header}>
                <BackButton onPress={() => router.back()} />
            </View>

            <View style={styles.content}>
                <IconCircle iconName="shield-checkmark-outline" />

                <Text style={styles.title}>Vérification</Text>
                <Text style={styles.subtitle}>Saisissez le code de 6 chiffres envoyé au {'\n'}<Text style={styles.phoneText}>{params.phoneNumber}</Text></Text>

                <View style={styles.otpContainer}>
                    {otp.map((digit, index) => (
                        <TextInput
                            key={index}
                            ref={(ref) => { if (ref) inputs.current[index] = ref; }}
                            style={[
                                styles.otpInput,
                                {
                                    borderColor: digit ? Colors[theme].primary : 'rgba(255,255,255,0.1)',
                                    backgroundColor: digit ? 'rgba(229, 9, 20, 0.05)' : 'rgba(255,255,255,0.03)'
                                }
                            ]}
                            maxLength={1}
                            keyboardType="number-pad"
                            value={digit}
                            onChangeText={(text) => handleChange(text, index)}
                            onKeyPress={(e) => handleKeyPress(e, index)}
                            placeholderTextColor="rgba(255,255,255,0.2)"
                        />
                    ))}
                </View>

                <TouchableOpacity
                    disabled={timer > 0 || loading}
                    onPress={handleResendCode}
                    style={styles.resendContainer}
                >
                    <Text style={styles.resendText}>
                        Vous n'avez pas reçu de code ? {' '}
                        <Text style={[styles.resendLink, timer === 0 && { color: Colors[theme].primary }]}>
                            {timer > 0 ? `Renvoyer (${timer}s)` : 'Renvoyer'}
                        </Text>
                    </Text>
                </TouchableOpacity>

                <GradientButton
                    title="Vérifier le code"
                    onPress={handleValidate}
                    loading={loading}
                    style={styles.validateButton}
                />
            </View>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#0F1014'
    },
    header: {
        paddingTop: 50,
        paddingHorizontal: 20,
    },
    content: {
        flex: 1,
        alignItems: 'center',
        paddingHorizontal: 30,
        paddingTop: 20,
    },
    title: {
        fontSize: 28,
        fontWeight: '900',
        color: 'white',
        marginBottom: 10,
        letterSpacing: -0.5,
    },
    subtitle: {
        fontSize: 15,
        color: 'rgba(255,255,255,0.5)',
        marginBottom: 40,
        textAlign: 'center',
        lineHeight: 22,
    },
    phoneText: {
        color: 'white',
        fontWeight: '700',
    },
    otpContainer: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        width: '100%',
        marginBottom: 40
    },
    otpInput: {
        width: width * 0.12,
        height: 55,
        borderRadius: 12,
        textAlign: 'center',
        fontSize: 24,
        fontWeight: '900',
        color: 'white',
        borderWidth: 2,
    },
    resendContainer: {
        marginBottom: 40,
    },
    resendText: {
        color: 'rgba(255,255,255,0.4)',
        fontSize: 14
    },
    resendLink: {
        fontWeight: '700',
        color: 'rgba(255,255,255,0.6)',
    },
    validateButton: {
        width: '100%',
        height: 60,
        borderRadius: 16,
    },
});
