import { Button } from "@/components/Button";
import { CosmicBackground } from "@/components/CosmicBackground";
import { Colors, Fonts, FontSizes, Spacing } from "@/constants/theme";
import { useRouter } from "expo-router";
import React from "react";
import { SafeAreaView, StyleSheet, Text, View } from "react-native";

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
							<View style={[styles.card, { left: 20, top: 20, transform: [{ rotate: "-12deg" }], backgroundColor: Colors.secundaire }]}>
								<Text style={styles.cName}>Brussels</Text>
							</View>
							<View style={[styles.card, { left: 75, top: 35, zIndex: 2, backgroundColor: Colors.violetLight }]}>
								<Text style={styles.cName}>Tokyo</Text>
							</View>
							<View style={[styles.card, { right: 20, top: 20, transform: [{ rotate: "12deg" }], backgroundColor: Colors.accentRose }]}>
								<Text style={styles.cName}>Berlin</Text>
							</View>
						</View>
						<Text style={styles.title}>Race. Scan.</Text>
						<Text style={[styles.title, { color: Colors.violetLight }]}>Collect.</Text>
						<Text style={styles.sub}>Every race comes with a unique creature card. Scan it, color the world.</Text>
					</View>
					<Button label="Continue" onPress={() => router.push("/(auth)/permissions")} />
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
	cards: { width: 280, height: 220, position: "relative", marginBottom: 30 },
	card: { position: "absolute", width: 130, height: 180, borderRadius: 14, padding: 12, justifyContent: "flex-end" },
	cName: { fontFamily: Fonts.display, fontStyle: "italic", color: Colors.white, fontSize: 14, fontWeight: "800" },
	title: { fontFamily: Fonts.bodyBold, fontSize: FontSizes.h2, fontWeight: "800", color: Colors.white, textAlign: "center" },
	sub: { fontFamily: Fonts.body, fontSize: FontSizes.body, color: Colors.white70, textAlign: "center", marginTop: 14, maxWidth: 300 },
	link: { fontFamily: Fonts.body, fontSize: FontSizes.body, color: Colors.white70, marginTop: 16 },
});
