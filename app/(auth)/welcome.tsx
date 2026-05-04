import { Button } from "@/components/Button";
import { CosmicBackground } from "@/components/CosmicBackground";
import { GradientText } from "@/components/GradientText";
import { Colors, Fonts, FontSizes, Spacing } from "@/constants/theme";
import { Image } from "expo-image";
import { useRouter } from "expo-router";
import React from "react";
import { StyleSheet, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

export default function Welcome() {
	const router = useRouter();
	return (
		<CosmicBackground>
			<SafeAreaView style={{ flex: 1 }}>
				<View style={styles.container}>
					<Image source={require("@/assets/animations/welcome_animation.gif")} style={styles.animation} contentFit="contain" />

					<GradientText style={styles.wordmark}>Andro</GradientText>
					<Text style={styles.slogan}>Run the world.</Text>
					<Text style={[styles.slogan, { color: Colors.violetLight }]}>With Andro.</Text>

					<View style={{ flex: 1 }} />
					<Button label="Get started" onPress={() => router.push("/(auth)/sign-up" as any)} />
					<Text onPress={() => router.push("/(auth)/sign-in" as any)} style={styles.link}>
						I already have an account
					</Text>
				</View>
			</SafeAreaView>
		</CosmicBackground>
	);
}

const styles = StyleSheet.create({
	container: { flex: 1, paddingHorizontal: Spacing.lg, paddingVertical: 40, alignItems: "center" },
	animation: { width: 350, height: 350, marginBottom: 4 },
	wordmark: { fontFamily: Fonts.display, fontSize: FontSizes.hero, color: Colors.violetLight, fontStyle: "italic", marginBottom: 16 },
	slogan: { fontFamily: Fonts.bodyBold, fontSize: FontSizes.h2, fontWeight: "800", color: Colors.white, textAlign: "center" },
	link: { fontFamily: Fonts.body, fontSize: FontSizes.body, color: Colors.violetLight, marginTop: 16, textAlign: "center" },
});
