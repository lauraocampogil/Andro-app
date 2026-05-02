import { Colors } from "@/constants/theme";
import React from "react";
import { StyleSheet, View } from "react-native";

export function CosmicBackground({ children }: { children: React.ReactNode }) {
	return (
		<View style={styles.bg}>
			<View style={styles.blob1} />
			<View style={styles.blob2} />
			<View style={styles.blob3} />
			<View style={{ flex: 1 }}>{children}</View>
		</View>
	);
}

const styles = StyleSheet.create({
	bg: { flex: 1, backgroundColor: Colors.deepNight, overflow: "hidden" },
	blob1: { position: "absolute", top: -100, left: -100, width: 400, height: 400, borderRadius: 200, backgroundColor: Colors.secundaire, opacity: 0.18 },
	blob2: { position: "absolute", bottom: -120, right: -120, width: 380, height: 380, borderRadius: 190, backgroundColor: Colors.violetLight, opacity: 0.12 },
	blob3: { position: "absolute", top: "40%", left: "50%", width: 250, height: 250, borderRadius: 125, backgroundColor: Colors.accentRose, opacity: 0.06, transform: [{ translateX: -125 }] },
});
