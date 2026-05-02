import { Button } from "@/components/Button";
import { CosmicBackground } from "@/components/CosmicBackground";
import { Colors, Fonts, FontSizes, Spacing } from "@/constants/theme";
import { Image } from "expo-image";
import { useRouter } from "expo-router";
import React from "react";
import { StyleSheet, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

export default function Concept() {
	const router = useRouter();

	return (
		<CosmicBackground>
			<SafeAreaView style={{ flex: 1 }}>
				<View style={styles.c}>
					<View style={styles.dots}>
						<View style={styles.dot} />
						<View style={[styles.dot, styles.dotActive]} />
						<View style={styles.dot} />
					</View>

					<View style={{ flex: 1, justifyContent: "center", alignItems: "center" }}>
						<View style={styles.cards}>
							<Image source={require("@/assets/cards/card_brussel.png")} style={[styles.card, styles.cardLeft]} contentFit="cover" cachePolicy="memory-disk" />
						</View>

						<Text style={styles.title}>Race. Scan.</Text>
						<Text style={[styles.title, { color: Colors.violetLight }]}>Collect.</Text>
						<Text style={styles.sub}>Every race comes with a unique creature card. Scan it, color the world.</Text>
					</View>

					<Button label="Continue" onPress={() => router.push("/(auth)/permissions" as any)} />
					<Text onPress={() => router.back()} style={styles.link}>
						Back
					</Text>
				</View>
			</SafeAreaView>
		</CosmicBackground>
	);
}

const styles = StyleSheet.create({
	c: { flex: 1, paddingHorizontal: Spacing.lg, paddingVertical: 40, alignItems: "center" },
	dots: { flexDirection: "row", gap: 6 },
	dot: { width: 6, height: 6, borderRadius: 3, backgroundColor: Colors.white15 },
	dotActive: { width: 24, backgroundColor: Colors.violetLight },

	cards: { width: 320, height: 280, position: "relative", marginBottom: 40 },
	card: {
		position: "absolute",
		width: 150,
		height: 220,
		borderRadius: 18,
	},
	cardLeft: { left: 10, top: 30, transform: [{ rotate: "-12deg" }], zIndex: 1 },
	cardCenter: { left: 85, top: 0, zIndex: 3 },
	cardRight: { right: 10, top: 30, transform: [{ rotate: "12deg" }], zIndex: 1 },

	title: { fontFamily: Fonts.bodyBold, fontSize: FontSizes.h2, fontWeight: "800", color: Colors.white, textAlign: "center" },
	sub: { fontFamily: Fonts.body, fontSize: FontSizes.body, color: Colors.white70, textAlign: "center", marginTop: 14, maxWidth: 300 },
	link: { fontFamily: Fonts.body, fontSize: FontSizes.body, color: Colors.white70, marginTop: 16, textAlign: "center" },
});
