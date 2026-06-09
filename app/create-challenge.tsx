import { Button } from "@/components/Button";
import { CosmicBackground } from "@/components/CosmicBackground";
import { Colors, Fonts, FontSizes, Radius, Spacing } from "@/constants/theme";
import { useAuth } from "@/lib/auth";
import { ChallengeType, createChallenge } from "@/lib/challenges";
import { fetchAllRaces, Race } from "@/lib/races";
import { supabase } from "@/lib/supabase";
import { Image } from "expo-image";
import { useRouter } from "expo-router";
import { Globe, Map, Swords, Target, X } from "lucide-react-native";
import React, { useEffect, useState } from "react";
import { Alert, Pressable, ScrollView, StyleSheet, Switch, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

const TEMPLATES = [
	{ id: "marathon_battle" as ChallengeType, icon: Swords, title: "Marathon Battle", description: "Challenge a friend on a specific race" },
	{ id: "color_continent" as ChallengeType, icon: Globe, title: "Color a Continent", description: "Unlock all cards of a continent" },
	{ id: "yearly_races" as ChallengeType, icon: Target, title: "X Races This Year", description: "Complete a target number of races" },
	{ id: "territory" as ChallengeType, icon: Map, title: "Territory Race Battle", description: "Cover more ground than your friend (paper.io style)" },
];

const CONTINENTS = ["Europe", "Asia", "Africa", "North America", "South America", "Oceania"];
const DISTANCES = [5, 10, 21, 42];
const COUNTS = [5, 10, 20, 50];
const DURATIONS = [
	{ label: "1 day", days: 1 },
	{ label: "1 week", days: 7 },
	{ label: "1 month", days: 30 },
];

export default function CreateChallenge() {
	const router = useRouter();
	const { session } = useAuth();
	const userId = session?.user?.id;

	const [step, setStep] = useState<"template" | "details" | "friends">("template");
	const [selectedType, setSelectedType] = useState<ChallengeType | null>(null);
	const [continent, setContinent] = useState<string | null>(null);
	const [distance, setDistance] = useState<number | null>(null);
	const [raceId, setRaceId] = useState<string | null>(null);
	const [count, setCount] = useState<number | null>(null);
	const [duration, setDuration] = useState<number | null>(null);
	const [selectedFriends, setSelectedFriends] = useState<string[]>([]);
	const [isPublic, setIsPublic] = useState(false);
	const [creating, setCreating] = useState(false);

	const [races, setRaces] = useState<Race[]>([]);
	const [followings, setFollowings] = useState<any[]>([]);

	useEffect(() => {
		(async () => {
			const r = await fetchAllRaces();
			setRaces(r);
			if (userId) {
				const { data: follows } = await supabase.from("follows").select("following_id").eq("follower_id", userId);
				const ids = (follows ?? []).map((f) => f.following_id);
				if (ids.length > 0) {
					const { data: profiles } = await supabase.from("profiles").select("id, display_name, avatar_url").in("id", ids);
					setFollowings(profiles ?? []);
				}
			}
		})();
	}, [userId]);

	const filteredRaces = races.filter((r) => {
		if (continent && r.continent !== continent) return false;
		if (distance) {
			if (distance === 42) {
				if (!(r.distance_km >= 42 || r.is_major)) return false;
			} else if (distance === 21) {
				if (!(r.distance_km >= 21 && r.distance_km < 25) && !r.is_superhalf) return false;
			} else {
				if (r.distance_km !== distance) return false;
			}
		}
		return true;
	});

	const toggleFriend = (id: string) => {
		setSelectedFriends((prev) => (prev.includes(id) ? prev.filter((f) => f !== id) : [...prev, id]));
	};

	const buildTitle = (): string => {
		if (selectedType === "marathon_battle") {
			const race = races.find((r) => r.id === raceId);
			return race ? `Marathon Battle: ${race.name}` : "Marathon Battle";
		}
		if (selectedType === "color_continent") return `Color ${continent} Challenge`;
		if (selectedType === "yearly_races") return `${count} Races This Year`;
		if (selectedType === "territory") return `Territory Battle (${DURATIONS.find((d) => d.days === duration)?.label})`;
		return "Challenge";
	};

	const canProceedToFriends = (): boolean => {
		if (selectedType === "marathon_battle") return !!continent && !!distance && !!raceId;
		if (selectedType === "color_continent") return !!continent;
		if (selectedType === "yearly_races") return !!count;
		if (selectedType === "territory") return !!duration;
		return false;
	};

	const handleCreate = async (publicMode: boolean) => {
		if (!userId || !selectedType || creating) return;

		// A non-public challenge needs at least one friend
		if (!publicMode && selectedFriends.length === 0) {
			Alert.alert("Pick at least one friend", "You need to challenge someone.");
			return;
		}

		setCreating(true);
		const challengeId = await createChallenge({
			created_by: userId,
			type: selectedType,
			title: buildTitle(),
			continent,
			distance_km: distance,
			race_id: raceId,
			target_count: count,
			duration_days: duration,
			visibility: publicMode ? "public" : "everyone",
			invited_user_ids: publicMode ? [] : selectedFriends,
		});
		setCreating(false);

		if (challengeId) {
			Alert.alert(publicMode ? "Public challenge created!" : "Challenge sent!", publicMode ? "Anyone can now discover and join it." : `Invitations sent to ${selectedFriends.length} friend(s).`);
			router.back();
		} else {
			Alert.alert("Error", "Could not create challenge.");
		}
	};

	// On the details step, "Next" either creates directly (public) or goes to friends
	const handleDetailsNext = () => {
		if (isPublic) {
			handleCreate(true);
		} else {
			setStep("friends");
		}
	};

	return (
		<CosmicBackground>
			<SafeAreaView edges={["top"]} style={{ flex: 1 }}>
				<View style={styles.header}>
					<Pressable
						style={styles.backBtn}
						onPress={() => {
							if (step === "template") router.back();
							else if (step === "details") setStep("template");
							else setStep("details");
						}}
					>
						<X size={22} color={Colors.white} strokeWidth={2.4} />
					</Pressable>
					<Text style={styles.title}>{step === "template" ? "New challenge" : step === "details" ? "Details" : "Invite friends"}</Text>
					<View style={{ width: 44 }} />
				</View>

				<ScrollView style={{ flex: 1 }} contentContainerStyle={{ paddingBottom: 120 }} showsVerticalScrollIndicator={false}>
					{/* Step 1: Template */}
					{step === "template" && (
						<View style={{ paddingHorizontal: Spacing.lg, gap: Spacing.sm }}>
							<Text style={styles.subtitle}>Pick a challenge type</Text>
							{TEMPLATES.map((t) => (
								<Pressable
									key={t.id}
									style={styles.template}
									onPress={() => {
										setSelectedType(t.id);
										setStep("details");
									}}
								>
									<View style={styles.templateIcon}>
										<t.icon size={22} color={Colors.white} strokeWidth={2.2} />
									</View>
									<View style={{ flex: 1 }}>
										<Text style={styles.templateTitle}>{t.title}</Text>
										<Text style={styles.templateDesc}>{t.description}</Text>
									</View>
								</Pressable>
							))}
						</View>
					)}

					{/* Step 2: Details */}
					{step === "details" && selectedType && (
						<View style={{ paddingHorizontal: Spacing.lg }}>
							{/* Marathon Battle: continent → distance → race */}
							{selectedType === "marathon_battle" && (
								<>
									<Text style={styles.label}>Continent</Text>
									<View style={styles.pillsGrid}>
										{CONTINENTS.map((c) => (
											<Pressable key={c} style={[styles.pill, continent === c && styles.pillActive]} onPress={() => setContinent(c)}>
												<Text style={[styles.pillText, continent === c && { color: Colors.white }]}>{c}</Text>
											</Pressable>
										))}
									</View>

									{continent && (
										<>
											<Text style={styles.label}>Distance (km)</Text>
											<View style={styles.pillsGrid}>
												{DISTANCES.map((d) => (
													<Pressable key={d} style={[styles.pill, distance === d && styles.pillActive]} onPress={() => setDistance(d)}>
														<Text style={[styles.pillText, distance === d && { color: Colors.white }]}>{d}km</Text>
													</Pressable>
												))}
											</View>
										</>
									)}

									{continent && distance && (
										<>
											<Text style={styles.label}>Race ({filteredRaces.length})</Text>
											{filteredRaces.length === 0 ? (
												<Text style={styles.muted}>No races match these filters.</Text>
											) : (
												<View style={{ gap: 6 }}>
													{filteredRaces.map((r) => (
														<Pressable key={r.id} style={[styles.raceItem, raceId === r.id && styles.raceItemActive]} onPress={() => setRaceId(r.id)}>
															<Text style={styles.raceName}>{r.name}</Text>
															<Text style={styles.raceMeta}>
																{r.city}, {r.country}
															</Text>
														</Pressable>
													))}
												</View>
											)}
										</>
									)}
								</>
							)}

							{/* Color a continent */}
							{selectedType === "color_continent" && (
								<>
									<Text style={styles.label}>Which continent?</Text>
									<View style={styles.pillsGrid}>
										{CONTINENTS.map((c) => (
											<Pressable key={c} style={[styles.pill, continent === c && styles.pillActive]} onPress={() => setContinent(c)}>
												<Text style={[styles.pillText, continent === c && { color: Colors.white }]}>{c}</Text>
											</Pressable>
										))}
									</View>
								</>
							)}

							{/* X races this year */}
							{selectedType === "yearly_races" && (
								<>
									<Text style={styles.label}>Number of races</Text>
									<View style={styles.pillsGrid}>
										{COUNTS.map((c) => (
											<Pressable key={c} style={[styles.pill, count === c && styles.pillActive]} onPress={() => setCount(c)}>
												<Text style={[styles.pillText, count === c && { color: Colors.white }]}>{c} races</Text>
											</Pressable>
										))}
									</View>
								</>
							)}

							{/* Territory */}
							{selectedType === "territory" && (
								<>
									<Text style={styles.label}>Duration</Text>
									<View style={styles.pillsGrid}>
										{DURATIONS.map((d) => (
											<Pressable key={d.days} style={[styles.pill, duration === d.days && styles.pillActive]} onPress={() => setDuration(d.days)}>
												<Text style={[styles.pillText, duration === d.days && { color: Colors.white }]}>{d.label}</Text>
											</Pressable>
										))}
									</View>

									<View style={styles.warningBox}>
										<Text style={styles.warningText}>📍 Territory mode uses GPS tracking. Coming.</Text>
									</View>
								</>
							)}

							{/* Public challenge toggle */}
							<Text style={styles.label}>Visibility</Text>
							<View style={styles.publicRow}>
								<View style={{ flex: 1 }}>
									<Text style={styles.publicTitle}>Public challenge</Text>
									<Text style={styles.publicDesc}>Anyone can discover and join. Great for communities and influencers. No friend invites needed.</Text>
								</View>
								<Switch value={isPublic} onValueChange={setIsPublic} trackColor={{ false: Colors.white15, true: Colors.secundaire }} thumbColor={Colors.white} />
							</View>

							<View style={{ marginTop: Spacing.xl }}>
								<Button label={isPublic ? (creating ? "Creating..." : "Create public challenge") : "Pick friends"} onPress={handleDetailsNext} disabled={!canProceedToFriends() || creating} />
							</View>
						</View>
					)}

					{/* Step 3: Friends */}
					{step === "friends" && (
						<View style={{ paddingHorizontal: Spacing.lg }}>
							<Text style={styles.subtitle}>Who do you want to challenge?</Text>

							{followings.length === 0 ? (
								<Text style={styles.muted}>You don't follow anyone yet. Go to Community to find runners!</Text>
							) : (
								<View style={{ gap: 6 }}>
									{followings.map((f) => {
										const selected = selectedFriends.includes(f.id);
										return (
											<Pressable key={f.id} style={[styles.friendItem, selected && styles.friendItemActive]} onPress={() => toggleFriend(f.id)}>
												<View style={styles.friendAvatar}>
													{f.avatar_url ? <Image source={{ uri: f.avatar_url }} style={styles.friendAvatarImg} contentFit="cover" /> : <View style={[styles.friendAvatarImg, { backgroundColor: Colors.secundaire }]} />}
												</View>
												<Text style={styles.friendName}>{f.display_name}</Text>
												{selected && <Text style={styles.friendCheck}>✓</Text>}
											</Pressable>
										);
									})}
								</View>
							)}

							<View style={{ marginTop: Spacing.xl }}>
								<Button label={creating ? "Sending..." : `Send challenge (${selectedFriends.length})`} onPress={() => handleCreate(false)} disabled={selectedFriends.length === 0 || creating} />
							</View>
						</View>
					)}
				</ScrollView>
			</SafeAreaView>
		</CosmicBackground>
	);
}

const styles = StyleSheet.create({
	header: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", paddingHorizontal: Spacing.lg, paddingTop: Spacing.sm, paddingBottom: Spacing.lg },
	backBtn: { width: 44, height: 44, borderRadius: 22, backgroundColor: Colors.white15, alignItems: "center", justifyContent: "center" },
	title: { fontFamily: Fonts.display, fontStyle: "italic", fontSize: FontSizes.h2, color: Colors.white, letterSpacing: 0 },
	subtitle: { fontFamily: Fonts.body, fontSize: 14, color: Colors.white70, marginBottom: Spacing.md, paddingHorizontal: Spacing.base },

	template: { flexDirection: "row", alignItems: "center", gap: Spacing.base, padding: Spacing.base, backgroundColor: Colors.white08, borderRadius: Radius.lg, borderWidth: 1, borderColor: Colors.white15 },
	templateIcon: { width: 44, height: 44, borderRadius: 22, backgroundColor: Colors.secundaire, alignItems: "center", justifyContent: "center" },
	templateTitle: { fontFamily: Fonts.bodyBold, fontSize: 15, fontWeight: "800", color: Colors.white },
	templateDesc: { fontFamily: Fonts.body, fontSize: 12, color: Colors.white70, marginTop: 2 },

	label: { fontFamily: Fonts.bodyBold, fontSize: 12, fontWeight: "800", color: Colors.white70, letterSpacing: 1.5, marginTop: Spacing.lg, marginBottom: 10 },

	pillsGrid: { flexDirection: "row", flexWrap: "wrap", gap: 8 },
	pill: { paddingHorizontal: 16, paddingVertical: 10, borderRadius: Radius.pill, borderWidth: 1.5, borderColor: Colors.white30 },
	pillActive: { backgroundColor: Colors.secundaire, borderColor: Colors.secundaire },
	pillText: { fontFamily: Fonts.bodyBold, fontSize: 13, color: Colors.white70 },

	raceItem: { padding: 12, backgroundColor: Colors.white08, borderRadius: Radius.lg, borderWidth: 1, borderColor: Colors.white15 },
	raceItemActive: { borderColor: Colors.secundaire, backgroundColor: "rgba(91, 88, 235, 0.18)" },
	raceName: { fontFamily: Fonts.bodyBold, fontSize: 14, fontWeight: "800", color: Colors.white },
	raceMeta: { fontFamily: Fonts.body, fontSize: 12, color: Colors.white70, marginTop: 2 },

	publicRow: { flexDirection: "row", alignItems: "center", gap: 12, padding: Spacing.base, backgroundColor: Colors.white08, borderRadius: Radius.lg, borderWidth: 1, borderColor: Colors.white15 },
	publicTitle: { fontFamily: Fonts.bodyBold, fontSize: 14, fontWeight: "700", color: Colors.white },
	publicDesc: { fontFamily: Fonts.body, fontSize: 12, color: Colors.white70, marginTop: 2 },

	friendItem: { flexDirection: "row", alignItems: "center", gap: 12, padding: 10, backgroundColor: Colors.white08, borderRadius: Radius.lg, borderWidth: 1, borderColor: Colors.white15 },
	friendItemActive: { borderColor: Colors.secundaire, backgroundColor: "rgba(91, 88, 235, 0.18)" },
	friendAvatar: { width: 40, height: 40, borderRadius: 20, overflow: "hidden" },
	friendAvatarImg: { width: "100%", height: "100%" },
	friendName: { flex: 1, fontFamily: Fonts.bodyBold, fontSize: 14, color: Colors.white },
	friendCheck: { fontFamily: Fonts.bodyBold, fontSize: 18, color: Colors.secundaire },

	warningBox: { marginTop: Spacing.lg, padding: 12, backgroundColor: "rgba(255, 209, 92, 0.15)", borderRadius: Radius.md, borderWidth: 1, borderColor: "#FFD15C" },
	warningText: { fontFamily: Fonts.body, fontSize: 13, color: "#FFD15C" },

	muted: { fontFamily: Fonts.body, fontSize: 13, color: Colors.white70, textAlign: "center", paddingVertical: Spacing.base },
});
