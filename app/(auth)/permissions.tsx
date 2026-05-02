import { Button } from "@/components/Button";
import { CosmicBackground } from "@/components/CosmicBackground";
import { Colors, Fonts, FontSizes, Radius, Spacing } from "@/constants/theme";
import { useAuth } from "@/lib/auth";
import { useRouter } from "expo-router";
import React from "react";
import { SafeAreaView, StyleSheet, Text, View } from "react-native";

const PERMS = [
	{ icon: "📍", title: "Location", desc: "Find races near you" },
	{ icon: "📷", title: "Camera", desc: "Scan your race cards" },
	{ icon: "🔔", title: "Notifications", desc: "Race alerts & friends" },
];

export default function Permissions() {
	const router = useRouter();
	const { completeOnboarding } = useAuth();

	const handleEnter = async () => {
		await completeOnboarding();
		router.replace("/(tabs)/home" as any);
	};
	return (
		<CosmicBackground>
			<SafeAreaView style={{ flex: 1 }}>
				<View style={styles.c}>
					<View style={styles.dots}>
						<View style={styles.dot} />
						<View style={styles.dot} />
						<View style={[styles.dot, styles.dotActive]} />
					</View>
					<Text style={styles.title}>Almost there!</Text>
					<Text style={styles.sub}>Let Andro help you discover races and track your runs.</Text>
					<View style={styles.list}>
						{PERMS.map((p) => (
							<View key={p.title} style={styles.row}>
								<View style={styles.icon}>
									<Text style={{ fontSize: 22 }}>{p.icon}</Text>
								</View>
								<View style={{ flex: 1 }}>
									<Text style={styles.rTitle}>{p.title}</Text>
									<Text style={styles.rDesc}>{p.desc}</Text>
								</View>
								<View style={styles.toggle} />
							</View>
						))}
					</View>
					<View style={{ flex: 1 }} />
					<Button label="Enter Andro" onPress={handleEnter} />
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
	dots: { flexDirection: "row", gap: 6, marginBottom: 30 },
	dot: { width: 6, height: 6, borderRadius: 3, backgroundColor: Colors.white15 },
	dotActive: { width: 24, backgroundColor: Colors.violetLight },
	title: { fontFamily: Fonts.bodyBold, fontSize: FontSizes.h3, fontWeight: "800", color: Colors.white, marginTop: 8 },
	sub: { fontFamily: Fonts.body, fontSize: FontSizes.body, color: Colors.white70, textAlign: "center", marginTop: 8, maxWidth: 300 },
	list: { width: "100%", marginTop: 30, gap: 14 },
	row: { flexDirection: "row", alignItems: "center", gap: 14, backgroundColor: Colors.white08, borderWidth: 1, borderColor: Colors.white15, borderRadius: Radius.lg, padding: 16 },
	icon: { width: 44, height: 44, borderRadius: 12, backgroundColor: Colors.secundaire, alignItems: "center", justifyContent: "center" },
	rTitle: { fontFamily: Fonts.bodyBold, fontSize: FontSizes.body, fontWeight: "700", color: Colors.white, marginBottom: 2 },
	rDesc: { fontFamily: Fonts.body, fontSize: FontSizes.small, color: Colors.white70 },
	toggle: { width: 40, height: 24, borderRadius: 12, backgroundColor: Colors.secundaire },
	link: { fontFamily: Fonts.body, fontSize: FontSizes.body, color: Colors.white70, marginTop: 16 },
});
