import React from "react";
import {
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
    Dimensions
} from "react-native";
import { Check } from "lucide-react-native";
import { Colors } from "@/constants/Colors";

const { width } = Dimensions.get('window');

interface YearSelectorButtonProps {
    year: string;
    isSelected: boolean;
    onSelect: (year: string) => void;
    disabled?: boolean;
}

export const YearSelectorButton: React.FC<YearSelectorButtonProps> = ({
    year,
    isSelected,
    onSelect,
    disabled
}) => {
    return (
        <TouchableOpacity
            style={[
                styles.yearButton,
                isSelected && styles.yearButtonSelected
            ]}
            onPress={() => onSelect(year)}
            activeOpacity={0.7}
            disabled={disabled}
        >
            <Text style={[
                styles.yearButtonText,
                isSelected && styles.yearButtonTextSelected
            ]}>
                {year}
            </Text>
            {isSelected && (
                <View style={styles.checkBadge}>
                    <Check size={10} color={Colors.surface} strokeWidth={4} />
                </View>
            )}
        </TouchableOpacity>
    );
};

const styles = StyleSheet.create({
    yearButton: {
        backgroundColor: Colors.surface,
        paddingVertical: 16,
        paddingHorizontal: 24,
        borderRadius: 20,
        borderWidth: 1,
        borderColor: Colors.border,
        minWidth: width * 0.22,
        alignItems: 'center',
        position: 'relative',
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.02,
        shadowRadius: 4,
        elevation: 1,
    },
    yearButtonSelected: {
        borderColor: Colors.primary,
        backgroundColor: Colors.primary,
        shadowColor: Colors.primary,
        shadowOpacity: 0.2,
        shadowRadius: 8,
        elevation: 4,
    },
    yearButtonText: {
        fontSize: 17,
        fontWeight: '700',
        color: Colors.text.secondary,
    },
    yearButtonTextSelected: {
        color: Colors.surface,
    },
    checkBadge: {
        position: 'absolute',
        top: -4,
        right: -4,
        backgroundColor: Colors.status.success,
        width: 18,
        height: 18,
        borderRadius: 9,
        justifyContent: 'center',
        alignItems: 'center',
        borderWidth: 2,
        borderColor: Colors.surface,
    },
});
