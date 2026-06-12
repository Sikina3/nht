import React from 'react';
import { Dimensions, StyleSheet, Text, View } from 'react-native';

const { width, height } = Dimensions.get('window');
const PAGE_WIDTH = width * 0.45;

interface BookPageProps {
    content: string;
    pageNumber: number;
    isLeft?: boolean;
}

export default function BookPage({ content, pageNumber, isLeft = false }: BookPageProps) {
    return (
        <View style={[styles.page, isLeft ? styles.leftPage : styles.rightPage]}>
            <Text style={styles.content}>{content}</Text>
            <Text style={styles.pageNumber}>{pageNumber}</Text>
        </View>
    );
}

const styles = StyleSheet.create({
    page: {
        width: PAGE_WIDTH,
        height: height * 0.7,
        backgroundColor: '#FFF9E6',
        padding: 20,
        justifyContent: 'space-between',
        borderWidth: 1,
        borderColor: '#D4C5A9',
    },
    leftPage: {
        borderTopLeftRadius: 8,
        borderBottomLeftRadius: 8,
        borderRightWidth: 0.5,
        shadowColor: '#000',
        shadowOffset: { width: -2, height: 0 },
        shadowOpacity: 0.1,
        shadowRadius: 3,
    },
    rightPage: {
        borderTopRightRadius: 8,
        borderBottomRightRadius: 8,
        borderLeftWidth: 0.5,
        shadowColor: '#000',
        shadowOffset: { width: 2, height: 0 },
        shadowOpacity: 0.1,
        shadowRadius: 3,
    },
    content: {
        fontSize: 16,
        lineHeight: 24,
        color: '#2C2416',
        fontFamily: 'serif',
        textAlign: 'justify',
    },
    pageNumber: {
        fontSize: 12,
        color: '#8B7355',
        textAlign: 'center',
        marginTop: 10,
    },
});
