import React, { useState } from 'react';
import { Dimensions, StyleSheet, Text, View } from 'react-native';
import { GestureDetector, Gesture } from 'react-native-gesture-handler';
import Animated, {
    useSharedValue,
    useAnimatedStyle,
    withTiming,
    runOnJS,
    interpolate,
    Extrapolate,
} from 'react-native-reanimated';

const { width, height } = Dimensions.get('window');
const PAGE_WIDTH = width * 0.9;
const PAGE_HEIGHT = height * 0.90;

interface BookFlipProps {
    pages: string[];
    currentPage: number;
    onPageChange: (page: number) => void;
}

export default function BookFlip({ pages, currentPage, onPageChange }: BookFlipProps) {
    const [localPage, setLocalPage] = useState(currentPage);
    const flipProgress = useSharedValue(0);
    const startX = useSharedValue(0);

    const canGoNext = localPage < pages.length - 1;
    const canGoPrev = localPage > 0;

    const goToNextPage = () => {
        if (canGoNext) {
            const newPage = localPage + 1;
            setLocalPage(newPage);
            onPageChange(newPage);
        }
    };

    const goToPrevPage = () => {
        if (canGoPrev) {
            const newPage = localPage - 1;
            setLocalPage(newPage);
            onPageChange(newPage);
        }
    };

    const panGesture = Gesture.Pan()
        .onStart((event) => {
            startX.value = event.translationX;
        })
        .onUpdate((event) => {
            const delta = event.translationX - startX.value;

            // Swipe vers la gauche (page suivante)
            if (delta < 0 && canGoNext) {
                flipProgress.value = Math.max(-1, delta / PAGE_WIDTH);
            }
            // Swipe vers la droite (page précédente)
            else if (delta > 0 && canGoPrev) {
                flipProgress.value = Math.min(1, delta / PAGE_WIDTH);
            }
        })
        .onEnd((event) => {
            const delta = event.translationX - startX.value;
            const velocity = event.velocityX;

            // Déterminer si on change de page
            if (Math.abs(delta) > PAGE_WIDTH * 0.3 || Math.abs(velocity) > 500) {
                if (delta < 0 && canGoNext) {
                    // Aller à la page suivante
                    flipProgress.value = withTiming(-1, { duration: 300 }, () => {
                        runOnJS(goToNextPage)();
                        flipProgress.value = 0;
                    });
                } else if (delta > 0 && canGoPrev) {
                    // Aller à la page précédente
                    flipProgress.value = withTiming(1, { duration: 300 }, () => {
                        runOnJS(goToPrevPage)();
                        flipProgress.value = 0;
                    });
                } else {
                    // Revenir à la position initiale
                    flipProgress.value = withTiming(0, { duration: 200 });
                }
            } else {
                // Revenir à la position initiale
                flipProgress.value = withTiming(0, { duration: 200 });
            }
        });

    // Animation de la page actuelle (celle qui se tourne)
    const currentPageStyle = useAnimatedStyle(() => {
        // Rotation : Swipe gauche (-1) -> rotation vers la gauche (-180)
        // Rotation : Swipe droite (1) -> rotation vers la droite (180)
        const rotateY = interpolate(
            flipProgress.value,
            [-1, 0, 1],
            [-180, 0, 180],
            Extrapolate.CLAMP
        );

        // Translation : Swipe gauche (-1) -> sort à gauche (-WIDTH)
        // Translation : Swipe droite (1) -> sort à droite (WIDTH)
        const translateX = interpolate(
            flipProgress.value,
            [-1, 0, 1],
            [-PAGE_WIDTH, 0, PAGE_WIDTH],
            Extrapolate.CLAMP
        );

        // Effet de pliure/courbure (mise à l'échelle légère pendant le tournage)
        const scale = interpolate(
            Math.abs(flipProgress.value),
            [0, 0.5, 1],
            [1, 0.95, 0.9],
            Extrapolate.CLAMP
        );

        return {
            transform: [
                { perspective: 1200 },
                { rotateY: `${rotateY}deg` }, // Rotation plus douce
                { translateX: translateX }, // Sortie latérale
                { scale: scale },
            ],
            backfaceVisibility: 'hidden', // Cache l'arrière de la page pendant la rotation
            opacity: interpolate(
                Math.abs(flipProgress.value),
                [0, 0.8, 1],
                [1, 0.5, 0],
                Extrapolate.CLAMP
            ),
        };
    });

    // Animation de la page suivante (qui apparaît par le dessous)
    const nextPageStyle = useAnimatedStyle(() => {
        const opacity = interpolate(
            flipProgress.value,
            [-1, -0.5, 0],
            [1, 0.3, 0],
            Extrapolate.CLAMP
        );

        const scale = interpolate(
            flipProgress.value,
            [-1, 0],
            [1, 0.9],
            Extrapolate.CLAMP
        );

        return {
            opacity,
            transform: [{ scale }],
        };
    });

    // Animation de la page précédente (qui apparaît par le dessous)
    const prevPageStyle = useAnimatedStyle(() => {
        const opacity = interpolate(
            flipProgress.value,
            [0, 0.5, 1],
            [0, 0.3, 1],
            Extrapolate.CLAMP
        );

        const scale = interpolate(
            flipProgress.value,
            [0, 1],
            [0.9, 1],
            Extrapolate.CLAMP
        );

        return {
            opacity,
            transform: [{ scale }],
        };
    });

    return (
        <View style={styles.container}>
            {/* Page précédente (en dessous) */}
            {canGoPrev && (
                <Animated.View style={[styles.pageContainer, styles.backPage, prevPageStyle]}>
                    <View style={styles.page}>
                        <Text style={styles.pageContent}>{pages[localPage - 1]}</Text>
                        <Text style={styles.pageNumber}>
                            {localPage} / {pages.length}
                        </Text>
                    </View>
                </Animated.View>
            )}

            {/* Page suivante (en dessous) */}
            {canGoNext && (
                <Animated.View style={[styles.pageContainer, styles.backPage, nextPageStyle]}>
                    <View style={styles.page}>
                        <Text style={styles.pageContent}>{pages[localPage + 1]}</Text>
                        <Text style={styles.pageNumber}>
                            {localPage + 2} / {pages.length}
                        </Text>
                    </View>
                </Animated.View>
            )}

            {/* Page actuelle (qui se tourne) */}
            <GestureDetector gesture={panGesture}>
                <Animated.View style={[styles.pageContainer, currentPageStyle]}>
                    <View style={styles.page}>
                        <Text style={styles.pageContent}>{pages[localPage]}</Text>
                        <Text style={styles.pageNumber}>
                            {localPage + 1} / {pages.length}
                        </Text>
                    </View>
                </Animated.View>
            </GestureDetector>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: '#2C2416',
    },
    pageContainer: {
        position: 'absolute',
        width: PAGE_WIDTH,
        height: PAGE_HEIGHT,
    },
    backPage: {
        zIndex: 0,
    },
    page: {
        width: '100%',
        height: '100%',
        backgroundColor: '#FFF9E6',
        borderRadius: 8,
        padding: 25,
        justifyContent: 'space-between',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 8,
        elevation: 8,
        borderWidth: 1,
        borderColor: '#D4C5A9',
    },
    pageContent: {
        fontSize: 14,
        lineHeight: 28,
        color: '#2C2416',
        textAlign: 'justify',
        fontFamily: 'serif',
    },
    pageNumber: {
        fontSize: 13,
        color: '#8B7355',
        textAlign: 'center',
        marginTop: 15,
    },
});
