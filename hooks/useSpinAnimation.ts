import { useEffect, useRef } from "react";
import { Animated, Easing } from "react-native";

export const useSpinAnimation = (isActive: boolean, duration: number = 1000) => {
    const spinValue = useRef(new Animated.Value(0)).current;

    useEffect(() => {
        let animation: Animated.CompositeAnimation | null = null;
        if (isActive) {
            spinValue.setValue(0);
            animation = Animated.loop(
                Animated.timing(spinValue, {
                    toValue: 1,
                    duration: duration,
                    easing: Easing.linear,
                    useNativeDriver: true,
                })
            );
            animation.start();
        } else {
            spinValue.setValue(0);
        }
        return () => animation?.stop();
    }, [isActive, duration, spinValue]);

    const spin = spinValue.interpolate({
        inputRange: [0, 1],
        outputRange: ['0deg', '360deg']
    });

    return spin;
};
