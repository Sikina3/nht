import React, { createContext, useState, useContext, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';

interface User {
    id: number;
    nom: string;
    num_tel: string;
    role: string;
    soldeCoins: number;
    photoProfile?: string;
    bio?: string;
    dateInscription?: string;
}

interface AuthContextType {
    user: User | null;
    isLoading: boolean;
    signIn: (userData: User) => Promise<void>;
    signOut: () => Promise<void>;
    updateUser: (updates: Partial<User>) => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
    const [user, setUser] = useState<User | null>(null);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        // Check for saved user on mount
        loadUser();
    }, []);

    const loadUser = async () => {
        try {
            const savedUser = await AsyncStorage.getItem('user');
            if (savedUser) {
                setUser(JSON.parse(savedUser));
            }
        } catch (error) {
            console.error('Failed to load user', error);
        } finally {
            setIsLoading(false);
        }
    };

    const signIn = async (userData: User) => {
        try {
            await AsyncStorage.setItem('user', JSON.stringify(userData));
            setUser(userData);
        } catch (error) {
            console.error('Failed to save user', error);
        }
    };

    const signOut = async () => {
        try {
            await AsyncStorage.removeItem('user');
            setUser(null);
        } catch (error) {
            console.error('Failed to remove user', error);
        }
    };

    const updateUser = async (updates: Partial<User>) => {
        try {
            if (user) {
                const updatedUser = { ...user, ...updates };
                await AsyncStorage.setItem('user', JSON.stringify(updatedUser));
                setUser(updatedUser);
            }
        } catch (error) {
            console.error('Failed to update user', error);
        }
    };

    return (
        <AuthContext.Provider value={{ user, isLoading, signIn, signOut, updateUser }}>
            {children}
        </AuthContext.Provider>
    );
}

export function useAuth() {
    const context = useContext(AuthContext);
    if (context === undefined) {
        throw new Error('useAuth must be used within an AuthProvider');
    }
    return context;
}
