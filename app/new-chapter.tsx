import { Text, View } from '@/components/Themed';
import { useColorScheme } from '@/components/useColorScheme';
import Colors from '@/constants/Colors';
import api from '@/services/api';
import BackButton from '@/components/ui/BackButton';
import GradientButton from '@/components/ui/GradientButton';
import { useLocalSearchParams, useRouter } from 'expo-router';
import React, { useState } from 'react';
import {
    Alert,
    Dimensions,
    KeyboardAvoidingView,
    Platform,
    ScrollView,
    StatusBar,
    StyleSheet,
    TextInput,
} from 'react-native';

const { width } = Dimensions.get('window');

export default function NewChapterScreen() {
    const router = useRouter();
    const theme = useColorScheme() ?? "light";
    const params = useLocalSearchParams();
    const storyId = params.storyId as string;
    const storyTitle = params.storyTitle as string;
    const chapterNumber = parseInt(params.chapterNumber as string) || 1;

    const [sousTitre, setSousTitre] = useState('');
    const [contenu, setContenu] = useState('');
    const [isLoading, setIsLoading] = useState(false);

    const wordCount = contenu.trim() ? contenu.trim().split(/\s+/).length : 0;

    const handlePublish = async () => {
        if (!contenu.trim()) {
            Alert.alert('Erreur', 'Veuillez écrire le contenu du chapitre.');
            return;
        }

        setIsLoading(true);

        try {
            const chapterData = {
                sousTitre: sousTitre || `Chapitre ${chapterNumber}`,
                contenu: contenu,
                numeroChapitre: chapterNumber,
                histoireId: parseInt(storyId),
                coutCoins: 0,
            };

            await api.post('/chapters/add', chapterData);

            Alert.alert(
                'Succès !',
                `Le chapitre ${chapterNumber} a été publié avec succès.`,
                [{ text: 'OK', onPress: () => router.back() }]
            );
        } catch (error: any) {
            Alert.alert('Erreur', 'Une erreur est survenue lors de la publication.');
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <KeyboardAvoidingView
            style={[styles.container, { backgroundColor: Colors[theme].background }]}
            behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        >
            <StatusBar barStyle={theme === 'dark' ? 'light-content' : 'dark-content'} />

            {/* Header */}
            <View style={styles.header}>
                <BackButton onPress={() => router.back()} />
                <View style={styles.headerTitleContainer}>
                    <Text style={[styles.headerTitle, { color: Colors[theme].text }]}>Nouveau Chapitre</Text>
                    <Text style={[styles.storyName, { color: Colors[theme].textMuted }]} numberOfLines={1}>{storyTitle}</Text>
                </View>
            </View>

            <ScrollView
                contentContainerStyle={styles.scrollContent}
                showsVerticalScrollIndicator={false}
                keyboardShouldPersistTaps="handled"
            >
                <View style={[styles.chapterCircle, { backgroundColor: Colors[theme].primaryAlpha5, borderColor: Colors[theme].primaryAlpha5 }]}>
                    <Text style={[styles.chapterCircleText, { color: Colors[theme].text }]}>{chapterNumber}</Text>
                    <Text style={[styles.chapterCircleLabel, { color: Colors[theme].textHint }]}>NUMÉRO</Text>
                </View>

                <View style={styles.inputGroup}>
                    <Text style={[styles.label, { color: Colors[theme].textMuted }]}>Titre du chapitre</Text>
                    <TextInput
                        style={[styles.input, { color: Colors[theme].text, backgroundColor: Colors[theme].cardBgHover, borderColor: Colors[theme].borderColor }]}
                        placeholder="Ex: La rencontre inattendue"
                        placeholderTextColor={Colors[theme].textHint}
                        value={sousTitre}
                        onChangeText={setSousTitre}
                    />
                </View>

                <View style={styles.inputGroup}>
                    <View style={styles.contentHeader}>
                        <Text style={[styles.label, { color: Colors[theme].textMuted }]}>Contenu du chapitre</Text>
                        <Text style={[styles.wordCount, { color: Colors[theme].textHint }]}>{wordCount} mots</Text>
                    </View>
                    <TextInput
                        style={[styles.contentInput, { color: Colors[theme].text, backgroundColor: Colors[theme].cardBg, borderColor: Colors[theme].borderColor }]}
                        placeholder="Il était une fois..."
                        placeholderTextColor={Colors[theme].textHint}
                        value={contenu}
                        onChangeText={setContenu}
                        multiline
                        textAlignVertical="top"
                    />
                </View>

                <View style={{ height: 150 }} />
            </ScrollView>

            <View style={[styles.footer, { borderTopColor: Colors[theme].borderColor }]}>
                <GradientButton
                    title="Publier le chapitre"
                    onPress={handlePublish}
                    loading={isLoading}
                    style={styles.publishButton}
                />
            </View>
        </KeyboardAvoidingView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
    },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 20,
        paddingTop: 60,
        paddingBottom: 20,
        backgroundColor: 'transparent',
    },
    headerTitleContainer: {
        flex: 1,
        marginLeft: 15,
        backgroundColor: 'transparent',
    },
    headerTitle: {
        fontSize: 20,
        fontWeight: '900',
        color: 'white',
        letterSpacing: -0.5,
    },
    storyName: {
        fontSize: 13,
        color: 'rgba(255,255,255,0.4)',
        marginTop: 2,
    },
    scrollContent: {
        paddingHorizontal: 20,
        paddingTop: 20,
    },
    chapterCircle: {
        width: 80,
        height: 80,
        borderRadius: 40,
        borderWidth: 2,
        borderColor: 'rgba(229, 9, 20, 0.3)',
        justifyContent: 'center',
        alignItems: 'center',
        alignSelf: 'center',
        marginBottom: 30,
        backgroundColor: 'rgba(229, 9, 20, 0.05)',
    },
    chapterCircleText: {
        fontSize: 28,
        fontWeight: '900',
        color: 'white',
    },
    chapterCircleLabel: {
        fontSize: 8,
        fontWeight: '900',
        color: 'rgba(255,255,255,0.4)',
        letterSpacing: 1,
    },
    inputGroup: {
        marginBottom: 25,
    },
    label: {
        fontSize: 14,
        fontWeight: '700',
        color: 'rgba(255,255,255,0.5)',
        marginBottom: 10,
        marginLeft: 5,
    },
    input: {
        width: '100%',
        height: 56,
        borderRadius: 16,
        paddingHorizontal: 16,
        color: 'white',
        backgroundColor: 'rgba(255,255,255,0.05)',
        fontSize: 16,
        fontWeight: '600',
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.05)',
    },
    contentHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        backgroundColor: 'transparent',
    },
    wordCount: {
        fontSize: 12,
        fontWeight: '600',
        color: 'rgba(255,255,255,0.3)',
    },
    contentInput: {
        width: '100%',
        minHeight: 300,
        borderRadius: 20,
        padding: 20,
        color: 'white',
        backgroundColor: 'rgba(255,255,255,0.03)',
        fontSize: 16,
        lineHeight: 24,
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.05)',
    },
    footer: {
        position: 'absolute',
        bottom: 0,
        left: 0,
        right: 0,
        paddingHorizontal: 20,
        paddingBottom: 40,
        paddingTop: 20,
        borderTopWidth: 1,
        borderTopColor: 'rgba(255,255,255,0.05)',
    },
    publishButton: {
        width: '100%',
        height: 60,
        borderRadius: 18,
        shadowColor: '#E50914',
        shadowOffset: { width: 0, height: 8 },
        shadowOpacity: 0.3,
        shadowRadius: 12,
        elevation: 8,
    },
});
