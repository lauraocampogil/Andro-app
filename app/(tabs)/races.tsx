import { CosmicBackground } from "@/components/CosmicBackground";
import { Colors, Fonts, FontSizes, Radius, Spacing } from "@/constants/theme";
import { fetchAllRaces, Race } from "@/lib/races";
import { useRouter } from "expo-router";
import { Calendar, Crown, Footprints, ListFilter, MapPin, Search, Star } from "lucide-react-native";
import React, { useEffect, useMemo, useState } from "react";
import { FlatList, Pressable, StyleSheet, Text, TextInput, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

export type RaceFilters = {
	year?: number;
	month?: number; // 1-12
	continents: string[];
	distances: number[]; // [5, 10, 24, 42]
	levels: ("beginner" | "intermediate" | "advanced")[];
	surfaces: string[];
	superHalf: boolean;
	majors: boolean;
};

export const DEFAULT_FILTERS: RaceFilters = {
	continents: [],
	distances: [],
	levels: [],
	surfaces: [],
	superHalf: false,
	majors: false,
};

function levelLabel(level: string) {
	if (level === "beginner") return "Beginner";
	if (level === "intermediate") return "Intermediate";
	if (level === "advanced") return "Advanced";
	return "All Levels";
}

function formatDate(iso: string) {
	const d = new Date(iso);
	return d.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
}

function RaceCard({ race, onPress }: { race: Race; onPress: () => void }) {
	return (
		<Pressable style={({ pressed }) => [styles.card, pressed && { opacity: 0.9 }]} onPress={onPress}>
			<View style={styles.cardTop}>
				<View style={{ flex: 1 }}>
					<Text style={styles.raceName} numberOfLines={1}>
						{race.name}
					</Text>
					<View style={styles.locationRow}>
						<MapPin size={13} color={Colors.ink70} strokeWidth={2.2} />
						<Text style={styles.locationText}>
							{race.city}, {race.country}
						</Text>
					</View>
				</View>
				<View style={styles.distancePill}>
					<Text style={styles.distanceText}>{race.distance_km}km</Text>
				</View>
			</View>

			<View style={styles.cardBottom}>
				<View style={styles.metaItem}>
					<Calendar size={13} color={Colors.ink70} strokeWidth={2.2} />
					<Text style={styles.metaText}>{formatDate(race.race_date)}</Text>
				</View>
				<View style={styles.metaItem}>
					<Footprints size={13} color={Colors.ink70} strokeWidth={2.2} />
					<Text style={styles.metaText}>{levelLabel(race.level)}</Text>
				</View>
				{race.is_major ? (
					<View style={styles.metaItem}>
						<Star size={13} color={Colors.ink70} strokeWidth={2.2} />
						<Text style={styles.metaText}>Major</Text>
					</View>
				) : race.is_superhalf ? (
					<View style={styles.metaItem}>
						<Crown size={13} color={Colors.ink70} strokeWidth={2.2} />
						<Text style={styles.metaText}>SuperHalf</Text>
					</View>
				) : (
					<View style={styles.metaItem}>
						<Star size={13} color={Colors.ink70} strokeWidth={2.2} />
						<Text style={styles.metaText}>Scenic</Text>
					</View>
				)}
			</View>
		</Pressable>
	);
}

export default function Races() {
	const router = useRouter();
	const [allRaces, setAllRaces] = useState<Race[]>([]);
	const [loading, setLoading] = useState(true);
	const [search, setSearch] = useState("");
	const [filters] = useState<RaceFilters>(DEFAULT_FILTERS);

	useEffect(() => {
		(async () => {
			const data = await fetchAllRaces();
			setAllRaces(data);
			setLoading(false);
		})();
	}, []);

	const filteredRaces = useMemo(() => {
		let list = allRaces;
		const q = search.trim().toLowerCase();
		if (q) {
			list = list.filter((r) => r.name.toLowerCase().includes(q) || r.city.toLowerCase().includes(q) || r.country.toLowerCase().includes(q));
		}
		if (filters.continents.length) list = list.filter((r) => filters.continents.includes(r.continent));
		if (filters.distances.length) list = list.filter((r) => filters.distances.includes(r.distance_km));
		if (filters.levels.length) list = list.filter((r) => filters.levels.includes(r.level));
		if (filters.surfaces.length) list = list.filter((r) => filters.surfaces.includes(r.surface));
		if (filters.superHalf) list = list.filter((r) => r.is_superhalf);
		if (filters.majors) list = list.filter((r) => r.is_major);
		if (filters.year !== undefined) list = list.filter((r) => new Date(r.race_date).getFullYear() === filters.year);
		if (filters.month !== undefined) list = list.filter((r) => new Date(r.race_date).getMonth() + 1 === filters.month);
		return list;
	}, [allRaces, search, filters]);

	const isDefaultView = !search.trim();

	const nearYou = useMemo(() => filteredRaces.filter((r) => r.country_code === "BEL"), [filteredRaces]);
	const featured = useMemo(() => filteredRaces.filter((r) => r.is_major || r.is_superhalf), [filteredRaces]);

	return (
		<CosmicBackground>
			<SafeAreaView edges={["top"]} style={{ flex: 1 }}>
				{/* Search + filter */}
				<View style={styles.searchRow}>
					<View style={styles.searchBox}>
						<Search size={18} color={Colors.white70} strokeWidth={2.2} />
						<TextInput value={search} onChangeText={setSearch} placeholder="Search races, cities, countries" placeholderTextColor={Colors.white50} style={styles.searchInput} returnKeyType="search" />
					</View>
					<Pressable style={styles.filterBtn} onPress={() => router.push("/filter" as any)}>
						<ListFilter size={20} color={Colors.white} strokeWidth={2} />
					</Pressable>
				</View>

				{loading ? (
					<View style={styles.center}>
						<Text style={styles.loadingText}>Loading races...</Text>
					</View>
				) : isDefaultView ? (
					<FlatList
						data={[]}
						renderItem={null as any}
						keyExtractor={() => ""}
						ListHeaderComponent={
							<View style={{ paddingBottom: 120 }}>
								{nearYou.length > 0 && (
									<>
										<Text style={styles.sectionTitle}>Near You</Text>
										{nearYou.map((r) => (
											<RaceCard key={r.id} race={r} onPress={() => {}} />
										))}
									</>
								)}

								{featured.length > 0 && (
									<>
										<Text style={[styles.sectionTitle, { marginTop: Spacing.xl }]}>Featured Races</Text>
										{featured.map((r) => (
											<RaceCard key={r.id} race={r} onPress={() => {}} />
										))}
									</>
								)}

								{nearYou.length === 0 && featured.length === 0 && (
									<View style={styles.center}>
										<Text style={styles.emptyText}>No races yet.</Text>
									</View>
								)}
							</View>
						}
						contentContainerStyle={{ paddingHorizontal: Spacing.lg }}
						showsVerticalScrollIndicator={false}
					/>
				) : (
					<FlatList
						data={filteredRaces}
						keyExtractor={(item) => item.id}
						renderItem={({ item }) => <RaceCard race={item} onPress={() => {}} />}
						contentContainerStyle={{ paddingHorizontal: Spacing.lg, paddingBottom: 120 }}
						showsVerticalScrollIndicator={false}
						ListEmptyComponent={
							<View style={styles.center}>
								<Text style={styles.emptyText}>No races match.</Text>
							</View>
						}
					/>
				)}
			</SafeAreaView>
		</CosmicBackground>
	);
}

const styles = StyleSheet.create({
	searchRow: {
		flexDirection: "row",
		gap: Spacing.sm,
		paddingHorizontal: Spacing.lg,
		paddingTop: Spacing.sm,
		paddingBottom: Spacing.lg,
		alignItems: "center",
	},
	searchBox: {
		flex: 1,
		height: 48,
		borderRadius: Radius.pill,
		backgroundColor: Colors.white08,
		borderWidth: 1,
		borderColor: Colors.white15,
		flexDirection: "row",
		alignItems: "center",
		paddingHorizontal: 16,
		gap: 10,
	},
	searchInput: {
		flex: 1,
		fontFamily: Fonts.body,
		fontSize: 15,
		color: Colors.white,
		height: "100%",
		padding: 0,
	},
	filterBtn: {
		width: 44,
		height: 44,
		borderRadius: 12,
		backgroundColor: Colors.secundaire,
		alignItems: "center",
		justifyContent: "center",
	},
	sectionTitle: {
		fontFamily: Fonts.display,
		fontSize: FontSizes.h3,
		fontStyle: "italic",
		color: Colors.white,
		letterSpacing: 0.5,
		marginBottom: Spacing.base,
	},
	card: {
		backgroundColor: Colors.white,
		borderRadius: Radius.lg,
		padding: Spacing.base,
		marginBottom: Spacing.md,
		shadowColor: "#000",
		shadowOffset: { width: 0, height: 4 },
		shadowOpacity: 0.12,
		shadowRadius: 8,
		elevation: 3,
	},
	cardTop: {
		flexDirection: "row",
		alignItems: "flex-start",
		gap: Spacing.sm,
	},
	raceName: {
		fontFamily: Fonts.bodyBold,
		fontSize: 16,
		fontWeight: "800",
		color: Colors.ink,
		marginBottom: 4,
	},
	locationRow: {
		flexDirection: "row",
		alignItems: "center",
		gap: 4,
	},
	locationText: {
		fontFamily: Fonts.body,
		fontSize: 13,
		color: Colors.ink70,
	},
	distancePill: {
		backgroundColor: Colors.ink,
		paddingHorizontal: 12,
		paddingVertical: 6,
		borderRadius: Radius.pill,
	},
	distanceText: {
		fontFamily: Fonts.bodyBold,
		fontSize: 12,
		fontWeight: "800",
		color: Colors.white,
	},
	cardBottom: {
		flexDirection: "row",
		gap: Spacing.lg,
		marginTop: Spacing.md,
	},
	metaItem: {
		flexDirection: "row",
		alignItems: "center",
		gap: 5,
	},
	metaText: {
		fontFamily: Fonts.body,
		fontSize: 12,
		color: Colors.ink70,
	},
	center: {
		alignItems: "center",
		justifyContent: "center",
		paddingVertical: Spacing.xxl,
	},
	loadingText: { color: Colors.white70, fontFamily: Fonts.body },
	emptyText: { color: Colors.white70, fontFamily: Fonts.body, fontSize: 14 },
});
