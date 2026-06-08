import { Button } from "@/components/Button";
import { Colors, Fonts, FontSizes, Radius, Spacing } from "@/constants/theme";
import { Image } from "expo-image";
import React, { useEffect } from "react";
import { Modal, Pressable, StyleSheet, Text, View } from "react-native";
import Animated, { Easing, useAnimatedStyle, useSharedValue, withRepeat, withSequence, withSpring, withTiming } from "react-native-reanimated";

type Props = {
	visible: boolean;
	onClose: () => void;
};

export function AllContinentsPopup({ visible, onClose }: Props) {
	const scale = useSharedValue(0.6);
	const opacity = useSharedValue(0);
	const floatY = useSharedValue(0);

	useEffect(() => {
		if (!visible) return;

		scale.value = withSpring(1, { damping: 11, stiffness: 90 });
		opacity.value = withTiming(1, { duration: 350 });
		floatY.value = withRepeat(withSequence(withTiming(-12, { duration: 1600, easing: Easing.inOut(Easing.ease) }), withTiming(0, { duration: 1600, easing: Easing.inOut(Easing.ease) })), -1, false);

		return () => {
			scale.value = 0.6;
			opacity.value = 0;
			floatY.value = 0;
		};
	}, [visible]);

	const cardStyle = useAnimatedStyle(() => ({
		opacity: opacity.value,
		transform: [{ scale: scale.value }],
	}));

	const floatStyle = useAnimatedStyle(() => ({
		transform: [{ translateY: floatY.value }],
	}));

	return (
		<Modal visible={visible} transparent animationType="fade" statusBarTranslucent onRequestClose={onClose}>
			<Pressable style={styles.backdrop} onPress={onClose}>
				<Animated.View style={[styles.card, cardStyle]}>
					<Pressable onPress={() => {}}>
						<Text style={styles.eyebrow}>WORLD COMPLETE</Text>
						<Text style={styles.title}>ALL 6 CONTINENTS</Text>

						<View style={styles.visual}>
							<Animated.View style={floatStyle}>
								<Image source={require("@/assets/animations/celebration_animation.gif")} style={styles.animation} contentFit="contain" />
							</Animated.View>
						</View>

						<Text style={styles.continentName}>You did it, runner</Text>
						<Text style={styles.subtitle}>You've put a pin on every continent. The whole world is yours.</Text>

						<View style={styles.buttonWrapper}>
							<Button label="Continue" onPress={onClose} />
						</View>
					</Pressable>
				</Animated.View>
			</Pressable>
		</Modal>
	);
}

const CARD_WIDTH = 320;
const VISUAL_SIZE = 220;

const styles = StyleSheet.create({
	backdrop: {
		flex: 1,
		alignItems: "center",
		justifyContent: "center",
		backgroundColor: "rgba(4, 8, 26, 0.88)",
	},
	card: {
		width: CARD_WIDTH,
		borderRadius: Radius.xl,
		backgroundColor: Colors.hoofdkleur,
		borderWidth: 1,
		borderColor: Colors.legendary,
		padding: Spacing.lg,
		alignItems: "stretch",
		shadowColor: Colors.legendary,
		shadowOffset: { width: 0, height: 12 },
		shadowOpacity: 0.6,
		shadowRadius: 28,
		elevation: 18,
	},
	eyebrow: {
		fontFamily: Fonts.bodyBold,
		fontSize: FontSizes.small,
		fontWeight: "800",
		color: Colors.legendary,
		letterSpacing: 2.5,
	},
	title: {
		fontFamily: Fonts.display,
		fontSize: FontSizes.h1,
		fontStyle: "italic",
		color: Colors.white,
		letterSpacing: 1,
		marginTop: 2,
		marginBottom: Spacing.base,
	},
	visual: {
		width: "100%",
		height: VISUAL_SIZE,
		alignItems: "center",
		justifyContent: "center",
		marginBottom: Spacing.base,
	},
	animation: {
		width: VISUAL_SIZE,
		height: VISUAL_SIZE,
	},
	continentName: {
		fontFamily: Fonts.display,
		fontSize: FontSizes.h2,
		fontStyle: "italic",
		color: Colors.white,
	},
	subtitle: {
		fontFamily: Fonts.body,
		fontSize: FontSizes.body,
		color: Colors.white70,
		marginTop: 4,
		marginBottom: Spacing.lg,
	},
	buttonWrapper: { width: "100%" },
});
