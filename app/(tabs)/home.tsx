import { ContinentUnlockedPopup } from "@/components/ContinentUnlockedPopup";
import { CosmicBackground } from "@/components/CosmicBackground";
import { Globe3D } from "@/components/Globe3D/Globe3D";
import { HeaderButton } from "@/components/HeaderButton";
import { ScreenHeader } from "@/components/ScreenHeader";
import { Colors, Fonts, Radius, Spacing } from "@/constants/theme";
import { useAuth } from "@/lib/auth";
import { hasContinentImage } from "@/lib/continentAssets";
import { useRacesStore } from "@/lib/racesStore";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useLocalSearchParams, useRouter } from "expo-router";
import { ListFilter, Maximize2, User } from "lucide-react-native";
import React, { useEffect, useRef, useState } from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

export default function Home() {
	const { session, signOut } = useAuth();
	const router = useRouter();
	const { countryCodes, continents, stats, loadUserRaces } = useRacesStore();

	const params = useLocalSearchParams<{ unlockedContinent?: string }>();
	const [popupContinent, setPopupContinent] = useState<string | null>(null);
	const handledRef = useRef<Set<string>>(new Set());

	useEffect(() => {
		if (session?.user?.id) loadUserRaces(session.user.id);
	}, [session?.user?.id]);

	useEffect(() => {
		const incoming = params.unlockedContinent;
		if (!incoming || typeof incoming !== "string") return;
		if (handledRef.current.has(incoming)) return;
		if (!hasContinentImage(incoming)) return;
		if (!continents.includes(incoming)) return;

		handledRef.current.add(incoming);
		setPopupContinent(incoming);
	}, [params.unlockedContinent, continents]);

	const resetAll = async () => {
		await AsyncStorage.removeItem("andro_onboarding_completed");
		await signOut();
		router.replace("/(auth)/welcome" as any);
	};

	return (
		<CosmicBackground>
			<SafeAreaView edges={["top"]} style={{ flex: 1 }}>
				<ScreenHeader
					left={
						<HeaderButton onPress={resetAll}>
							<User size={20} color={Colors.ink} strokeWidth={2} />
						</HeaderButton>
					}
					right={
						<HeaderButton variant="primary">
							<ListFilter size={20} color={Colors.white} strokeWidth={2} />
						</HeaderButton>
					}
				/>

				<View style={styles.globeWrapper}>
					<Globe3D completedCountries={countryCodes} rotationSpeed={0.15} interactive={true} globeRadius={0.8} style={styles.globeCanvas} />

					<Pressable style={styles.zoomButton} onPress={() => router.push("/(tabs)/globe" as any)}>
						<Maximize2 size={18} color={Colors.white} strokeWidth={2.5} />
					</Pressable>
				</View>

				<View style={styles.statsCard}>
					<View style={styles.statCell}>
						<Text style={styles.statNum}>{stats.countriesCount}</Text>
						<Text style={styles.statName}>COUNTRIES</Text>
					</View>
					<View style={[styles.statCell, styles.statCellMid]}>
						<Text style={styles.statNum}>
							{stats.continentsCount}
							<Text style={styles.statFrac}>/{stats.totalContinents}</Text>
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

			<ContinentUnlockedPopup visible={popupContinent !== null} continent={popupContinent ?? ""} onClose={() => setPopupContinent(null)} />
		</CosmicBackground>
	);
}

const styles = StyleSheet.create({
	globeWrapper: {
		width: "100%",
		height: 380,
		alignSelf: "center",
		marginVertical: Spacing.lg,
		position: "relative",
	},
	globeCanvas: { flex: 1, backgroundColor: "transparent" },
	zoomButton: {
		position: "absolute",
		bottom: 16,
		right: 16,
		width: 44,
		height: 44,
		borderRadius: 22,
		backgroundColor: Colors.white15,
		justifyContent: "center",
		alignItems: "center",
		zIndex: 10,
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
