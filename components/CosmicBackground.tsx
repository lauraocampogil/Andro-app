import { LinearGradient } from "expo-linear-gradient";
import React from "react";
import { StyleSheet, View } from "react-native";

export function CosmicBackground({ children }: { children: React.ReactNode }) {
	return (
		<View style={styles.bg}>
			<LinearGradient colors={["#04081A", "#0A1340", "#04081A"]} locations={[0, 0.4, 0.7, 1]} style={StyleSheet.absoluteFill} />
			<View style={{ flex: 1 }}>{children}</View>
		</View>
	);
}

const styles = StyleSheet.create({
	bg: { flex: 1, backgroundColor: "#04081A", overflow: "hidden" },
});
