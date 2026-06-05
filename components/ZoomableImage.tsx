import { Image } from "expo-image";
import React from "react";
import { StyleSheet } from "react-native";
import { Gesture, GestureDetector } from "react-native-gesture-handler";
import Animated, { useAnimatedStyle, useSharedValue, withTiming } from "react-native-reanimated";

export function ZoomableImage({ uri, style }: { uri: string; style?: any }) {
	const scale = useSharedValue(1);
	const savedScale = useSharedValue(1);
	const tx = useSharedValue(0);
	const ty = useSharedValue(0);
	const savedTx = useSharedValue(0);
	const savedTy = useSharedValue(0);

	const pinch = Gesture.Pinch()
		.onUpdate((e) => {
			scale.value = Math.max(1, Math.min(savedScale.value * e.scale, 4));
		})
		.onEnd(() => {
			savedScale.value = scale.value;
			if (scale.value <= 1) {
				scale.value = withTiming(1);
				tx.value = withTiming(0);
				ty.value = withTiming(0);
				savedTx.value = 0;
				savedTy.value = 0;
			}
		});

	const pan = Gesture.Pan()
		.onUpdate((e) => {
			if (scale.value > 1) {
				tx.value = savedTx.value + e.translationX;
				ty.value = savedTy.value + e.translationY;
			}
		})
		.onEnd(() => {
			savedTx.value = tx.value;
			savedTy.value = ty.value;
		});

	const doubleTap = Gesture.Tap()
		.numberOfTaps(2)
		.onEnd(() => {
			if (scale.value > 1) {
				scale.value = withTiming(1);
				tx.value = withTiming(0);
				ty.value = withTiming(0);
				savedScale.value = 1;
				savedTx.value = 0;
				savedTy.value = 0;
			} else {
				scale.value = withTiming(2);
				savedScale.value = 2;
			}
		});

	const composed = Gesture.Simultaneous(pinch, pan, doubleTap);

	const animatedStyle = useAnimatedStyle(() => ({
		transform: [{ translateX: tx.value }, { translateY: ty.value }, { scale: scale.value }],
	}));

	return (
		<GestureDetector gesture={composed}>
			<Animated.View style={[styles.wrap, style]}>
				<Animated.View style={[StyleSheet.absoluteFill, animatedStyle]}>
					<Image source={{ uri }} style={StyleSheet.absoluteFill} contentFit="cover" />
				</Animated.View>
			</Animated.View>
		</GestureDetector>
	);
}

const styles = StyleSheet.create({
	wrap: { overflow: "hidden" },
});
