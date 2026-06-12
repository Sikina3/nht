import { Text, View } from '@/components/Themed';
import { useColorScheme } from '@/components/useColorScheme';
import Colors from '@/constants/Colors';
import { useAuth } from '@/context/AuthContext';
import AuthInput from '@/components/ui/AuthInput';
import ModalSheet from '@/components/ui/ModalSheet';
import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import api from '@/services/api';
import React, { useEffect, useState } from 'react';
import {
    ActivityIndicator,
    Alert,
    Animated,
    Dimensions,
    Image,
    ScrollView,
    StatusBar,
    StyleSheet,
    Text as RNText,
    TouchableOpacity,
} from 'react-native';

const { width } = Dimensions.get('window');

interface UserStats {
    storiesCount: number;
    totalReads: number;
    followers: number;
    following: number;
}

export default function ProfileScreen() {
    const router = useRouter();
    const theme = useColorScheme() ?? "light";
    const { user, signOut, updateUser } = useAuth();
    const [isLoading, setIsLoading] = useState(false);
    const [showEditModal, setShowEditModal] = useState(false);
    const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);
    const [editName, setEditName] = useState(user?.nom || '');
    const [editBio, setEditBio] = useState(user?.bio || '');
    const [stats, setStats] = useState<UserStats>({
        storiesCount: 0,
        totalReads: 0,
        followers: 0,
        following: 0,
    });
    const [showModal, setShowModal] = useState(false);

    const scaleAnim = useState(new Animated.Value(1))[0];

    useEffect(() => {
        if (user) {
            loadUserStats();
        }
    }, [user]);

    const loadUserStats = async () => {
        if (!user) return;
        try {
            const res = await api.get(`/users/${user.id}/stats`);
            setStats(res.data);
        } catch (error) {
            console.error('Error loading stats:', error);
        }
    };

    const handlePickImage = async () => {
        const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();

        if (status !== 'granted') {
            Alert.alert(
                'Permission requise',
                'Nous avons besoin de votre permission pour accéder à votre galerie photos.'
            );
            return;
        }

        const result = await ImagePicker.launchImageLibraryAsync({
            mediaTypes: ['images'],
            allowsEditing: false,
            aspect: [1, 1],
            quality: 0.8,
        });

        if (!result.canceled && result.assets[0]) {
            Animated.sequence([
                Animated.timing(scaleAnim, { toValue: 1.1, duration: 150, useNativeDriver: true }),
                Animated.timing(scaleAnim, { toValue: 1, duration: 150, useNativeDriver: true }),
            ]).start();

            await updateUser({ photoProfile: result.assets[0].uri });
        }
    };

    const handleEditProfile = async () => {
        setIsLoading(true);
        try {
            await updateUser({
                nom: editName,
                bio: editBio,
            });
            setShowEditModal(false);
            Alert.alert('Succès', 'Votre profil a été mis à jour.');
        } catch (error) {
            Alert.alert('Erreur', 'Impossible de mettre à jour le profil.');
        } finally {
            setIsLoading(false);
        }
    };

    const handleLogout = async () => {
        setShowLogoutConfirm(false);
        setIsLoading(true);
        try {
            await signOut();
            router.replace('/(auth)/login');
        } catch (error) {
            Alert.alert('Erreur', 'Impossible de se déconnecter.');
        } finally {
            setIsLoading(false);
        }
    };

    const getRoleBadge = () => {
        const role = user?.role?.toLowerCase();
        if (role === 'ecrivain') {
            return { label: 'Écrivain', color: Colors[theme].primary };
        }
        return { label: 'Lecteur', color: '#54B948' };
    };

    const formatNumber = (num: number) => {
        if (num >= 1000000) return (num / 1000000).toFixed(1) + 'M';
        if (num >= 1000) return (num / 1000).toFixed(1) + 'K';
        return num.toString();
    };

    const roleBadge = getRoleBadge();

    const MenuItem = ({ icon, title, color, onPress }: any) => (
        <TouchableOpacity style={styles.menuItem} onPress={onPress}>
            <View style={[styles.menuIconContainer, { backgroundColor: color + '15' }]}>
                <Ionicons name={icon} size={20} color={color} />
            </View>
            <Text style={styles.menuItemText}>{title}</Text>
            <Ionicons name="chevron-forward" size={20} color="rgba(255,255,255,0.2)" />
        </TouchableOpacity>
    );

    return (
        <View style={styles.container}>
            <StatusBar barStyle="light-content" />
            <ScrollView showsVerticalScrollIndicator={false}>
                {/* Header Section */}
                <View style={styles.header}>
                    <TouchableOpacity
                        style={styles.settingsBtn}
                        onPress={() => setShowEditModal(true)}
                    >
                        <Ionicons name="options-outline" size={22} color="white" />
                    </TouchableOpacity>

                    <View style={styles.profileInfo}>
                        <TouchableOpacity onPress={handlePickImage} activeOpacity={0.8}>
                            <Animated.View style={[styles.avatarContainer, { transform: [{ scale: scaleAnim }] }]}>
                                {user?.photoProfile ? (
                                    <Image source={{ uri: user.photoProfile }} style={styles.avatar} />
                                ) : (
                                    <LinearGradient
                                        colors={[Colors[theme].primary, '#B20610']}
                                        style={styles.avatarPlaceholder}
                                    >
                                        <Text style={styles.avatarInitials}>
                                            {user?.nom?.charAt(0)?.toUpperCase() || 'U'}
                                        </Text>
                                    </LinearGradient>
                                )}
                                <View style={[styles.editAvatarBadge, { backgroundColor: Colors[theme].primary }]}>
                                    <Ionicons name="camera" size={14} color="white" />
                                </View>
                            </Animated.View>
                        </TouchableOpacity>

                        <Text style={styles.userName}>{user?.nom || 'Utilisateur'}</Text>
                        <View style={[styles.roleBadge, { backgroundColor: roleBadge.color + '20' }]}>
                            <Text style={[styles.roleText, { color: roleBadge.color }]}>{roleBadge.label}</Text>
                        </View>

                        {user?.role?.toLowerCase() === 'ecrivain' && user?.bio && (
                            <Text style={styles.userBio}>{user.bio}</Text>
                        )}
                    </View>
                </View>

                {/* Stats Row */}
                <View style={styles.statsContainer}>
                    {user?.role?.toLowerCase() === 'ecrivain' && (
                        <>
                            <View style={styles.statItem}>
                                <Text style={styles.statNumber}>{formatNumber(stats.storiesCount)}</Text>
                                <Text style={styles.statLabel}>Histoires</Text>
                            </View>
                            <View style={styles.statDivider} />
                        </>
                    )}

                    <View style={styles.statItem}>
                        <Text style={styles.statNumber}>{formatNumber(stats.totalReads)}</Text>
                        <Text style={styles.statLabel}>Lectures</Text>
                    </View>

                    {user?.role?.toLowerCase() === 'ecrivain' ? (
                        <>
                            <View style={styles.statDivider} />
                            <View style={styles.statItem}>
                                <Text style={styles.statNumber}>{formatNumber(stats.followers)}</Text>
                                <Text style={styles.statLabel}>Abonnés</Text>
                            </View>
                        </>
                    ) : (
                        <>
                            <View style={styles.statDivider} />
                            <View style={styles.statItem}>
                                <Text style={styles.statNumber}>{formatNumber(stats.following)}</Text>
                                <Text style={styles.statLabel}>Abonnements</Text>
                            </View>
                        </>
                    )}
                </View>

                <View style={styles.contentPadding}>
                    {/* Menu Sections */}
                    <View style={styles.menuSection}>
                        <Text style={styles.sectionTitle}>Contenu </Text>
                        <MenuItem icon="book-outline" title="Mes Histoires" color={Colors[theme].primary} onPress={() => router.push("/library")} />
                        <MenuItem icon="time-outline" title="Historique" color="#2196F3" onPress={() => router.push("/history")} />
                    </View>

                    <View style={styles.menuSection}>
                        <Text style={styles.sectionTitle}>Préférences</Text>
                        <MenuItem icon="notifications-outline" title="Notifications" color="#4CAF50" />
                        <MenuItem icon="color-palette-outline" title="Apparence" color="#9C27B0" onPress={() => setShowModal(true)} />
                        <MenuItem icon="help-circle-outline" title="Aide & Support" color="#607D8B" />
                    </View>

                    <TouchableOpacity
                        style={styles.logoutButton}
                        onPress={() => setShowLogoutConfirm(true)}
                    >
                        <Ionicons name="log-out-outline" size={22} color={Colors[theme].primary} />
                        <Text style={[styles.logoutButtonText, { color: Colors[theme].primary }]}>Déconnexion</Text>
                    </TouchableOpacity>

                    <Text style={styles.versionText}>NHT VERSION 1.0.0</Text>
                </View>
                <View style={{ height: 100 }} />
            </ScrollView>

            {/* Modal Edit Profil */}
            <ModalSheet visible={showEditModal} onClose={() => setShowEditModal(false)} animationType="slide">
                <View style={styles.modalHeader}>
                    <RNText style={styles.modalTitle}>Modifier le profil</RNText>
                    <TouchableOpacity onPress={() => setShowEditModal(false)}>
                        <Ionicons name="close" size={28} color="white" />
                    </TouchableOpacity>
                </View>

                <AuthInput
                    label="Nom complet"
                    value={editName}
                    onChangeText={setEditName}
                    autoCapitalize="words"
                />

                {user?.role?.toLowerCase() === 'ecrivain' && (
                    <AuthInput
                        label="Bio"
                        value={editBio}
                        onChangeText={setEditBio}
                        multiline
                        maxLength={150}
                    />
                )}

                <TouchableOpacity style={[styles.saveButton, { backgroundColor: Colors[theme].primary }]} onPress={handleEditProfile}>
                    {isLoading ? <ActivityIndicator color="white" /> : <RNText style={styles.saveButtonText}>Enregistrer</RNText>}
                </TouchableOpacity>
            </ModalSheet>

            {/* Modal Page non disponible */}
            <ModalSheet visible={showModal} onClose={() => setShowModal(false)} animationType="slide">
                <View style={styles.modalHeader}>
                    <RNText style={styles.modalTitle}>Page non disponible</RNText>
                    <TouchableOpacity onPress={() => setShowModal(false)}>
                        <Ionicons name="close" size={28} color="white" />
                    </TouchableOpacity>
                </View>
                <RNText style={styles.menuFlot}> Cette page n'est pas encore Disponible </RNText>
            </ModalSheet>

            {/* Modal Logout */}
            <ModalSheet visible={showLogoutConfirm} onClose={() => setShowLogoutConfirm(false)} animationType="fade">
                <RNText style={styles.confirmTitle}>Déconnexion</RNText>
                <RNText style={styles.confirmText}>Voulez-vous vraiment quitter ?</RNText>
                <View style={styles.confirmButtons}>
                    <TouchableOpacity style={styles.cancelButton} onPress={() => setShowLogoutConfirm(false)}>
                        <RNText style={styles.cancelButtonText}>Annuler</RNText>
                    </TouchableOpacity>
                    <TouchableOpacity style={[styles.confirmButton, { backgroundColor: Colors[theme].primary }]} onPress={handleLogout}>
                        <RNText style={styles.confirmButtonText}>Quitter</RNText>
                    </TouchableOpacity>
                </View>
            </ModalSheet>
        </View>
    );
}

const styles = StyleSheet.create({
    menuFlot: {
        textAlign: "center",
        color: 'white',
    },
    container: {
        flex: 1,
    },
    header: {
        paddingTop: 60,
        paddingBottom: 40,
        alignItems: 'center',
    },
    settingsBtn: {
        position: 'absolute',
        top: 60,
        right: 25,
        width: 44,
        height: 44,
        borderRadius: 14,
        backgroundColor: 'rgba(255,255,255,0.05)',
        justifyContent: 'center',
        alignItems: 'center',
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.1)',
    },
    profileInfo: {
        alignItems: 'center',
        marginTop: 20,
    },
    avatarContainer: {
        position: 'relative',
        marginBottom: 20,
    },
    avatar: {
        width: 110,
        height: 110,
        borderRadius: 40,
        borderWidth: 2,
        borderColor: 'rgba(255,255,255,0.1)',
    },
    avatarPlaceholder: {
        width: 110,
        height: 110,
        borderRadius: 40,
        justifyContent: 'center',
        alignItems: 'center',
        borderWidth: 2,
        borderColor: 'rgba(255,255,255,0.1)',
    },
    avatarInitials: {
        fontSize: 36,
        fontWeight: '900',
        color: 'white',
    },
    editAvatarBadge: {
        position: 'absolute',
        bottom: -5,
        right: -5,
        width: 34,
        height: 34,
        borderRadius: 12,
        justifyContent: 'center',
        alignItems: 'center',
        borderWidth: 3,
        borderColor: '#0F1014',
    },
    userName: {
        fontSize: 26,
        fontWeight: '900',
        color: 'white',
        letterSpacing: -0.5,
        marginBottom: 8,
    },
    roleBadge: {
        paddingHorizontal: 14,
        paddingVertical: 4,
        borderRadius: 8,
        marginBottom: 15,
    },
    roleText: {
        fontSize: 12,
        fontWeight: '900',
        textTransform: 'uppercase',
    },
    userBio: {
        fontSize: 14,
        color: 'rgba(255,255,255,0.5)',
        textAlign: 'center',
        paddingHorizontal: 40,
        lineHeight: 20,
    },
    statsContainer: {
        flexDirection: 'row',
        paddingVertical: 20,
        marginHorizontal: 25,
        backgroundColor: 'rgba(255,255,255,0.03)',
        borderRadius: 24,
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.05)',
    },
    statItem: {
        flex: 1,
        alignItems: 'center',
        backgroundColor: 'rgba(255,255,255,0.001)',
    },
    statNumber: {
        fontSize: 20,
        fontWeight: '900',
        color: 'white',
        marginBottom: 4,
    },
    statLabel: {
        fontSize: 12,
        color: 'rgba(255,255,255,0.4)',
        fontWeight: '600',
    },
    statDivider: {
        width: 1,
        height: '60%',
        backgroundColor: 'rgba(255,255,255,0.05)',
        alignSelf: 'center',
    },
    contentPadding: {
        paddingHorizontal: 25,
    },
    menuSection: {
        marginTop: 35,
    },
    sectionTitle: {
        fontSize: 13,
        fontWeight: '900',
        color: 'rgba(255,255,255,0.3)',
        textTransform: 'uppercase',
        letterSpacing: 1.5,
        marginBottom: 15,
        marginLeft: 5,
    },
    menuItem: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: 'rgba(255,255,255,0.03)',
        padding: 16,
        borderRadius: 18,
        marginBottom: 10,
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.05)',
    },
    menuIconContainer: {
        width: 40,
        height: 40,
        borderRadius: 12,
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 15,
    },
    menuItemText: {
        flex: 1,
        fontSize: 15,
        color: 'white',
        fontWeight: '600',
    },
    logoutButton: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        marginTop: 40,
        padding: 18,
        backgroundColor: 'rgba(229, 9, 20, 0.05)',
        borderRadius: 18,
        borderWidth: 1,
        borderColor: 'rgba(229, 9, 20, 0.1)',
        gap: 10,
    },
    logoutButtonText: {
        fontSize: 16,
        fontWeight: '800',
    },
    versionText: {
        textAlign: 'center',
        color: 'rgba(255,255,255,0.2)',
        fontSize: 10,
        fontWeight: '700',
        marginTop: 30,
        letterSpacing: 2,
    },
    modalHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 30,
        backgroundColor: "transparent",
    },
    modalTitle: {
        fontSize: 22,
        fontWeight: '900',
        color: 'white',
    },
    saveButton: {
        paddingVertical: 16,
        borderRadius: 18,
        alignItems: 'center',
        marginTop: 10,
    },
    saveButtonText: {
        color: 'white',
        fontSize: 16,
        fontWeight: '900',
    },
    confirmTitle: {
        fontSize: 22,
        fontWeight: '900',
        color: 'white',
        marginBottom: 10,
        textAlign: 'center',
    },
    confirmText: {
        fontSize: 15,
        color: 'rgba(255,255,255,0.5)',
        textAlign: 'center',
        marginBottom: 30,
    },
    confirmButtons: {
        backgroundColor: "transparent",
        flexDirection: 'row',
        gap: 15,
    },
    cancelButton: {
        flex: 1,
        paddingVertical: 14,
        borderRadius: 14,
        backgroundColor: 'rgba(255,255,255,0.05)',
        alignItems: 'center',
    },
    cancelButtonText: {
        color: 'white',
        fontWeight: '700',
    },
    confirmButton: {
        flex: 1,
        paddingVertical: 14,
        borderRadius: 14,
        alignItems: 'center',
    },
    confirmButtonText: {
        color: 'white',
        fontWeight: '700',
    },
});
