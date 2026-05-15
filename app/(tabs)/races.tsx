import { CosmicBackground } from "@/components/CosmicBackground";
import { HeaderButton } from "@/components/HeaderButton";
import { ScreenHeader } from "@/components/ScreenHeader";
import { Colors, Fonts, FontSizes, Radius, Spacing } from "@/constants/theme";
import { useAuth } from "@/lib/auth";
import { useFavoritesStore } from "@/lib/favoritesStore";
import { useFiltersStore } from "@/lib/filtersStore";
import { fetchAllRaces, Race } from "@/lib/races";
import { useRouter } from "expo-router";
import { Calendar, Crown, Footprints, ListFilter, MapPin, Search, Star } from "lucide-react-native";
import React, { useEffect, useMemo, useState } from "react";
import { FlatList, Pressable, StyleSheet, Text, TextInput, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

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
	const { session } = useAuth();
	const [allRaces, setAllRaces] = useState<Race[]>([]);
	const [loading, setLoading] = useState(true);
	const [search, setSearch] = useState("");
	const filters = useFiltersStore((s) => s.filters);
	const { favoriteIds, loadFavorites } = useFavoritesStore();

	useEffect(() => {
		(async () => {
			const data = await fetchAllRaces();
			setAllRaces(data);
			setLoading(false);
		})();
	}, []);

	useEffect(() => {
		if (session?.user?.id) loadFavorites(session.user.id);
	}, [session?.user?.id]);

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
		if (filters.favoritesOnly) list = list.filter((r) => favoriteIds.has(r.id));
		return list;
	}, [allRaces, search, filters, favoriteIds]);

	const hasActiveFiltersExceptFav =
		filters.year !== undefined || filters.month !== undefined || filters.continents.length > 0 || filters.distances.length > 0 || filters.levels.length > 0 || filters.surfaces.length > 0 || filters.superHalf || filters.majors;

	const isDefaultView = !search.trim() && !hasActiveFiltersExceptFav;

	const favorites = useMemo(() => filteredRaces.filter((r) => favoriteIds.has(r.id)), [filteredRaces, favoriteIds]);
	const nearYou = useMemo(() => filteredRaces.filter((r) => r.country_code === "BEL"), [filteredRaces]);
	const featured = useMemo(() => filteredRaces.filter((r) => r.is_major || r.is_superhalf), [filteredRaces]);

	const showFavoritesSection = filters.favoritesOnly || (isDefaultView && favorites.length > 0);

	const openRace = (id: string) => router.push(`/race/${id}` as any);

	return (
		<CosmicBackground>
			<SafeAreaView edges={["top"]} style={{ flex: 1 }}>
				<ScreenHeader
					center={
						<View style={styles.searchBox}>
							<Search size={18} color={Colors.white70} strokeWidth={2.2} />
							<TextInput value={search} onChangeText={setSearch} placeholder="Search races, cities, countries" placeholderTextColor={Colors.white50} style={styles.searchInput} returnKeyType="search" />
						</View>
					}
					right={
						<HeaderButton variant="primary" onPress={() => router.push("/filter" as any)}>
							<ListFilter size={20} color={Colors.white} strokeWidth={2} />
						</HeaderButton>
					}
				/>

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
								{showFavoritesSection && favorites.length > 0 && (
									<>
										<Text style={styles.sectionTitle}>Favorites</Text>
										{favorites.map((r) => (
											<RaceCard key={r.id} race={r} onPress={() => openRace(r.id)} />
										))}
									</>
								)}

								{!filters.favoritesOnly && nearYou.length > 0 && (
									<>
										<Text style={[styles.sectionTitle, showFavoritesSection && { marginTop: Spacing.xl }]}>Near You</Text>
										{nearYou.map((r) => (
											<RaceCard key={r.id} race={r} onPress={() => openRace(r.id)} />
										))}
									</>
								)}

								{!filters.favoritesOnly && featured.length > 0 && (
									<>
										<Text style={[styles.sectionTitle, { marginTop: Spacing.xl }]}>Featured Races</Text>
										{featured.map((r) => (
											<RaceCard key={r.id} race={r} onPress={() => openRace(r.id)} />
										))}
									</>
								)}

								{nearYou.length === 0 && featured.length === 0 && favorites.length === 0 && (
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
						renderItem={({ item }) => <RaceCard race={item} onPress={() => openRace(item.id)} />}
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
