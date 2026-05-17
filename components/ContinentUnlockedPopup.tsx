import { Button } from "@/components/Button";
import { Colors, Fonts, FontSizes, Radius, Spacing } from "@/constants/theme";
import { getContinentImage } from "@/lib/continentAssets";
import { Image } from "expo-image";
import React, { useEffect } from "react";
import { Modal, Pressable, StyleSheet, Text, View } from "react-native";
import Animated, { Easing, useAnimatedStyle, useSharedValue, withDelay, withRepeat, withSequence, withSpring, withTiming } from "react-native-reanimated";

type Props = {
	visible: boolean;
	continent: string;
	onClose: () => void;
};

export function ContinentUnlockedPopup({ visible, continent, onClose }: Props) {
	const image = getContinentImage(continent);

	const scale = useSharedValue(0.6);
	const opacity = useSharedValue(0);
	const floatY = useSharedValue(0);
	const sparkleRotate = useSharedValue(0);

	useEffect(() => {
		if (!visible) return;

		scale.value = withSpring(1, { damping: 11, stiffness: 90 });
		opacity.value = withTiming(1, { duration: 350 });

		floatY.value = withRepeat(withSequence(withTiming(-10, { duration: 1600, easing: Easing.inOut(Easing.ease) }), withTiming(0, { duration: 1600, easing: Easing.inOut(Easing.ease) })), -1, false);

		sparkleRotate.value = withDelay(200, withRepeat(withTiming(360, { duration: 12000, easing: Easing.linear }), -1, false));

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

	const sparkleStyle = useAnimatedStyle(() => ({
		transform: [{ rotate: `${sparkleRotate.value}deg` }],
	}));

	if (!image) return null;

	return (
		<Modal visible={visible} transparent animationType="fade" statusBarTranslucent onRequestClose={onClose}>
			<Pressable style={styles.backdrop} onPress={onClose}>
				<Animated.View style={[styles.card, cardStyle]}>
					<Pressable onPress={() => {}}>
						<Text style={styles.eyebrow}>NEW CONTINENT</Text>
						<Text style={styles.title}>UNLOCKED!</Text>

						<View style={styles.visual}>
							<Animated.View style={floatStyle}>
								<Image source={image} style={styles.continentImage} contentFit="contain" />
							</Animated.View>
						</View>

						<Text style={styles.continentName}>{continent}</Text>
						<Text style={styles.subtitle}>You've put your first pin on the map.</Text>

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
		backgroundColor: "rgba(4, 8, 26, 0.82)",
	},
	card: {
		width: CARD_WIDTH,
		borderRadius: Radius.xl,
		backgroundColor: Colors.hoofdkleur,
		borderWidth: 1,
		borderColor: Colors.white15,
		padding: Spacing.lg,
		alignItems: "stretch",
		shadowColor: Colors.secundaire,
		shadowOffset: { width: 0, height: 12 },
		shadowOpacity: 0.5,
		shadowRadius: 28,
		elevation: 18,
	},
	eyebrow: {
		fontFamily: Fonts.bodyBold,
		fontSize: FontSizes.small,
		fontWeight: "800",
		color: Colors.violetLight,
		letterSpacing: 2.5,
		textAlign: "left",
	},
	title: {
		fontFamily: Fonts.display,
		fontSize: FontSizes.h1,
		fontStyle: "italic",
		color: Colors.white,
		letterSpacing: 1,
		marginTop: 2,
		marginBottom: Spacing.base,
		textAlign: "left",
	},
	visual: {
		width: "100%",
		height: VISUAL_SIZE,
		alignItems: "center",
		justifyContent: "center",
		position: "relative",
		marginBottom: Spacing.base,
	},
	continentImage: {
		width: VISUAL_SIZE,
		height: VISUAL_SIZE,
	},
	continentName: {
		fontFamily: Fonts.display,
		fontSize: FontSizes.h2,
		fontStyle: "italic",
		color: Colors.white,
		textAlign: "left",
	},
	subtitle: {
		fontFamily: Fonts.body,
		fontSize: FontSizes.body,
		color: Colors.white70,
		textAlign: "left",
		marginTop: 4,
		marginBottom: Spacing.lg,
	},
	buttonWrapper: {
		width: "100%",
	},
});
