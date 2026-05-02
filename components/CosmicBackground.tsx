import { Colors } from "@/constants/theme";
import { LinearGradient } from "expo-linear-gradient";
import React from "react";
import { StyleSheet, View } from "react-native";

export function CosmicBackground({ children }: { children: React.ReactNode }) {
	return (
		<View style={styles.bg}>
			<LinearGradient colors={["#04081A", "#0A2353", "#1A3B9C", "#0A2353", "#04081A"]} locations={[0, 0.25, 0.5, 0.75, 1]} style={StyleSheet.absoluteFill} />
			<View style={styles.blob1} />
			<View style={styles.blob2} />
			<View style={{ flex: 1 }}>{children}</View>
		</View>
	);
}

const styles = StyleSheet.create({
	bg: { flex: 1, backgroundColor: Colors.deepNight, overflow: "hidden" },
	blob1: {
		position: "absolute",
		top: "20%",
		left: "50%",
		width: 400,
		height: 400,
		borderRadius: 200,
		backgroundColor: Colors.secundaire,
		opacity: 0.3,
		transform: [{ translateX: -200 }],
	},
	blob2: {
		position: "absolute",
		bottom: -100,
		right: -100,
		width: 300,
		height: 300,
		borderRadius: 150,
		backgroundColor: Colors.violetLight,
		opacity: 0.15,
	},
});
