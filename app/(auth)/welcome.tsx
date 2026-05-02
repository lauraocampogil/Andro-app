import { Button } from "@/components/Button";
import { CosmicBackground } from "@/components/CosmicBackground";
import { Colors, Fonts, FontSizes, Spacing } from "@/constants/theme";
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
					<View style={styles.dots}>
						<View style={[styles.dot, styles.dotActive]} />
						<View style={styles.dot} />
						<View style={styles.dot} />
					</View>
					<Text style={styles.wordmark}>Andro</Text>
					<Text style={styles.slogan}>Run the world.</Text>
					<Text style={[styles.slogan, { color: Colors.violetLight }]}>With Andro.</Text>
					<Text style={styles.sub}>Color the world, one finish line at a time.</Text>
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
	dots: { flexDirection: "row", gap: 6, marginBottom: 30 },
	dot: { width: 6, height: 6, borderRadius: 3, backgroundColor: Colors.white15 },
	dotActive: { width: 24, backgroundColor: Colors.violetLight },
	wordmark: { fontFamily: Fonts.display, fontSize: FontSizes.hero, color: Colors.white, fontStyle: "italic", marginBottom: 22 },
	slogan: { fontFamily: Fonts.bodyBold, fontSize: FontSizes.h2, fontWeight: "800", color: Colors.white, textAlign: "center" },
	sub: { fontFamily: Fonts.body, fontSize: FontSizes.body, color: Colors.white70, textAlign: "center", marginTop: 14, maxWidth: 280 },
	link: { fontFamily: Fonts.body, fontSize: FontSizes.body, color: Colors.violetLight, marginTop: 16, textAlign: "center" },
});
