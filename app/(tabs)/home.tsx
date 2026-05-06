import { CosmicBackground } from "@/components/CosmicBackground";
import { Globe3D } from "@/components/Globe3D/Globe3D";
import { Colors, Fonts, Radius, Spacing } from "@/constants/theme";
import { useAuth } from "@/lib/auth";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useRouter } from "expo-router";
import { Maximize2, Menu, User } from "lucide-react-native";
import React from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

// Mock data
const stats = {
	countries: 12,
	continents: 3,
	worldPercent: 8,
};

export default function Home() {
	const { signOut } = useAuth();
	const router = useRouter();

	const resetAll = async () => {
		await AsyncStorage.removeItem("andro_onboarding_completed");
		await signOut();
		router.replace("/(auth)/welcome" as any);
	};

	return (
		<CosmicBackground>
			<SafeAreaView edges={["top"]} style={{ flex: 1 }}>
				{/* Header */}
				<View style={styles.header}>
					<Pressable style={styles.headerBtn} onPress={resetAll}>
						<User size={20} color={Colors.ink} strokeWidth={2} />
					</Pressable>
					<Pressable style={[styles.headerBtn, { backgroundColor: Colors.secundaire }]}>
						<Menu size={20} color={Colors.white} strokeWidth={2} />
					</Pressable>
				</View>

				<View style={styles.globeWrapper}>
					<Globe3D completedCountries={["BEL", "DEU"]} rotationSpeed={0.15} interactive={true} globeRadius={0.8} style={styles.globeCanvas} />

					{/* Zoom-in button */}
					<Pressable style={styles.zoomButton} onPress={() => router.push("/(tabs)/globe" as any)}>
						<Maximize2 size={18} color={Colors.white} strokeWidth={2.5} />
					</Pressable>
				</View>

				{/* Stats card */}
				<View style={styles.statsCard}>
					<View style={styles.statCell}>
						<Text style={styles.statNum}>{stats.countries}</Text>
						<Text style={styles.statName}>COUNTRIES</Text>
					</View>
					<View style={[styles.statCell, styles.statCellMid]}>
						<Text style={styles.statNum}>
							{stats.continents}
							<Text style={styles.statFrac}>/7</Text>
						</Text>
						<Text style={styles.statName}>CONTINENTS</Text>
					</View>
					<View style={styles.statCell}>
						<Text style={styles.statNum}>
							{stats.worldPercent}
							<Text style={styles.statUnit}>%</Text>
						</Text>
						<Text style={styles.statName}>WORLD</Text>
					</View>
				</View>
			</SafeAreaView>
		</CosmicBackground>
	);
}

const styles = StyleSheet.create({
	header: {
		flexDirection: "row",
		justifyContent: "space-between",
		alignItems: "center",
		paddingHorizontal: Spacing.lg,
		paddingTop: 8,
		paddingBottom: Spacing.base,
	},
	headerBtn: {
		width: 44,
		height: 44,
		borderRadius: 12,
		backgroundColor: Colors.white,
		alignItems: "center",
		justifyContent: "center",
	},

	globeWrap: {
		height: 340,
		alignItems: "center",
		justifyContent: "center",
		position: "relative",
		marginTop: 20,
	},
	globeGlow: {
		position: "absolute",
		width: 340,
		height: 340,
		borderRadius: 170,
		backgroundColor: Colors.violetLight,
		opacity: 0.2,
	},
	pin: {
		position: "absolute",
		width: 28,
		height: 28,
		borderRadius: 14,
		backgroundColor: Colors.secundaire,
		alignItems: "center",
		justifyContent: "center",
		borderWidth: 2,
		borderColor: Colors.white,
		shadowColor: "#000",
		shadowOffset: { width: 0, height: 4 },
		shadowOpacity: 0.3,
		shadowRadius: 8,
		elevation: 5,
	},

	statsCard: {
		marginHorizontal: Spacing.lg,
		marginTop: 20,
		backgroundColor: Colors.white,
		borderRadius: Radius.xl,
		paddingVertical: 16,
		paddingHorizontal: 12,
		flexDirection: "row",
		shadowColor: "#000",
		shadowOffset: { width: 0, height: 8 },
		shadowOpacity: 0.3,
		shadowRadius: 24,
		elevation: 8,
	},
	statCell: { flex: 1, alignItems: "center" },
	statCellMid: {
		borderLeftWidth: 1,
		borderRightWidth: 1,
		borderColor: Colors.ink08,
	},
	statNum: {
		fontFamily: Fonts.display,
		fontSize: 22,
		fontStyle: "italic",
		fontWeight: "800",
		color: Colors.ink,
		marginBottom: 2,
	},
	statFrac: { fontSize: 14, color: Colors.ink50 },
	statUnit: { fontSize: 14, color: Colors.ink50 },
	statName: {
		fontFamily: Fonts.bodyBold,
		fontSize: 9,
		fontWeight: "800",
		color: Colors.ink70,
		letterSpacing: 1.4,
	},
	globeWrapper: {
		width: "100%",
		height: 380,
		alignSelf: "center",
		marginVertical: Spacing.lg,
		position: "relative",
	},
	globeCanvas: {
		flex: 1,
		backgroundColor: "transparent",
	},
	zoomButton: {
		position: "absolute",
		bottom: 16,
		right: 16,
		width: 44,
		height: 44,
		borderRadius: 22,
		backgroundColor: Colors.white30,
		justifyContent: "center",
		alignItems: "center",
		zIndex: 10,
	},
});
