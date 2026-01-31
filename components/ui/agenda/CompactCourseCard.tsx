import { Colors } from '@/constants/Colors';
import { AgendaEvent } from '@/types/agenda';
import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

interface CompactCourseCardProps {
    event: AgendaEvent;
}

// Simple hash function to generate a color from a string
const stringToColor = (str: string) => {
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
        hash = str.charCodeAt(i) + ((hash << 5) - hash);
    }
    const c = (hash & 0x00FFFFFF)
        .toString(16)
        .toUpperCase();

    // Make the color lighter
    let color = "00000".substring(0, 6 - c.length) + c;
    let finalColor = "#";
    for (let i = 0; i < 3; i++) {
        const value = parseInt(color.substring(i*2, i*2+2), 16);
        finalColor += ("00" + Math.floor((value + 255) / 2).toString(16)).slice(-2);
    }
    return finalColor;
};

const formatTime = (start: Date, end: Date) => {
    const format = (date: Date) => `${date.getHours()}h${String(date.getMinutes()).padStart(2, '0')}`;
    return `${format(start)} - ${format(end)}`;
};

export default function CompactCourseCard({ event }: CompactCourseCardProps) {
    const [isExpanded, setIsExpanded] = useState(false);
    const bgColor = stringToColor(event.title);

    const timeText = formatTime(event.start, event.end);

    return (
        <TouchableOpacity activeOpacity={0.7} onPress={() => setIsExpanded(!isExpanded)} style={[styles.card, { backgroundColor: bgColor }]}>
            {isExpanded ? (
                // Expanded View
                <>
                    <View style={styles.infoRow}>
                        <Ionicons name="time-outline" size={12} color={Colors.text.primary} style={styles.icon} />
                        <Text style={styles.infoText}>{timeText}</Text>
                    </View>
                    <View style={styles.infoRow}>
                         <Ionicons name="school-outline" size={12} color={Colors.text.primary} style={styles.icon} />
                        <Text style={styles.infoText}>{event.title}</Text>
                    </View>
                    <View style={styles.infoRow}>
                        <Ionicons name="location-outline" size={12} color={Colors.text.primary} style={styles.icon} />
                        <Text style={styles.infoText}>{event.location}</Text>
                    </V>
                    <View style={styles.infoRow}>
                        <Ionicons name="person-outline" size={12} color={Colors.text.primary} style={styles.icon} />
                        <Text style={styles.infoText}>{event.professors}</Text>
                    </View>
                </>
            ) : (
                // Compact View
                <>
                    <Text style={styles.titleText} numberOfLines={1}>{timeText}</Text>
                    <Text style={styles.titleText} numberOfLines={2}>{event.title}</Text>
                    
                    <View style={styles.infoRow}>
                        <Ionicons name="location-outline" size={12} color={Colors.text.primary} style={styles.icon} />
                        <Text style={styles.infoText} numberOfLines={1}>{event.location}</Text>
                    </View>
                    
                    <View style={styles.infoRow}>
                        <Ionicons name="person-outline" size={12} color={Colors.text.primary} style={styles.icon} />
                        <Text style={styles.infoText} numberOfLines={1}>{event.professors}</Text>
                    </View>
                </>
            )}
        </TouchableOpacity>
    );
}

const styles = StyleSheet.create({
    card: {
        borderRadius: 8,
        padding: 8,
        borderWidth: 1,
        borderColor: 'rgba(0,0,0,0.05)',
        flex: 1,
        justifyContent: 'center',
    },
    titleText: {
        fontSize: 12,
        fontWeight: '600',
        color: Colors.text.primary,
        marginBottom: 4,
    },
    infoRow: {
        flexDirection: 'row',
        alignItems: 'center',
        marginTop: 4,
    },
    icon: {
        marginRight: 4,
    },
    infoText: {
        fontSize: 11,
        color: Colors.text.primary,
        opacity: 0.9,
        flexShrink: 1,
    },
});