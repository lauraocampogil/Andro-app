import { CosmicBackground } from "@/components/CosmicBackground";
import { Colors, Fonts, Radius, Spacing } from "@/constants/theme";
import { useAuth } from "@/lib/auth";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useRouter } from "expo-router";
import { MapPin, Menu, User } from "lucide-react-native";
import React from "react";
import { Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import Svg, { Circle, Path } from "react-native-svg";

// Mock data — remplacer par Supabase fetch en MVP2
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
				<ScrollView contentContainerStyle={{ paddingBottom: 140 }}>
					{/* Header */}
					<View style={styles.header}>
						<Pressable style={styles.headerBtn} onPress={resetAll}>
							<User size={20} color={Colors.ink} strokeWidth={2} />
						</Pressable>
						<Pressable style={[styles.headerBtn, { backgroundColor: Colors.secundaire }]}>
							<Menu size={20} color={Colors.white} strokeWidth={2} />
						</Pressable>
					</View>

					{/* Globe placeholder (remplace par GIF CapCut quand prêt) */}
					<View style={styles.globeWrap}>
						<View style={styles.globeGlow} />
						<Svg width={280} height={280} viewBox="0 0 280 280">
							<Circle cx="140" cy="140" r="130" stroke={Colors.deepNight} strokeWidth={6} fill="rgba(91,88,235,0.4)" />
							<Path d="M 70 100 Q 95 75 125 90 L 130 130 L 110 145 L 90 130 Z" fill={Colors.deepNight} />
							<Path d="M 145 80 Q 175 75 195 105 L 200 130 L 175 140 L 155 125 Z" fill={Colors.deepNight} />
							<Path d="M 95 150 Q 125 145 140 175 L 135 210 L 110 215 L 90 195 Z" fill={Colors.deepNight} />
							<Path d="M 165 165 Q 195 155 210 180 L 200 210 L 175 215 L 165 195 Z" fill={Colors.deepNight} />
						</Svg>

						{/* Pins */}
						<View style={[styles.pin, { top: 90, left: 95 }]}>
							<MapPin size={16} color={Colors.white} fill={Colors.white} />
						</View>
						<View style={[styles.pin, { top: 130, left: 115 }]}>
							<MapPin size={16} color={Colors.white} fill={Colors.white} />
						</View>
						<View style={[styles.pin, { top: 110, left: 215 }]}>
							<MapPin size={16} color={Colors.white} fill={Colors.white} />
						</View>
						<View style={[styles.pin, { top: 195, left: 145 }]}>
							<MapPin size={16} color={Colors.white} fill={Colors.white} />
						</View>
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
					<Pressable onPress={() => router.push("/globe" as any)} style={{ backgroundColor: "#5B58EB", padding: 12, borderRadius: 12, margin: 16 }}>
						<Text style={{ color: "white", textAlign: "center" }}>🧪 Test 3D</Text>
					</Pressable>
				</ScrollView>
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
});
