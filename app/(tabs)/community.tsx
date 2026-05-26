import { CosmicBackground } from "@/components/CosmicBackground";
import { HeaderButton } from "@/components/HeaderButton";
import { ScreenHeader } from "@/components/ScreenHeader";
import { Colors, Fonts, FontSizes, Radius, Spacing } from "@/constants/theme";
import { useAuth } from "@/lib/auth";
import { createChallenge, daysLeft, fetchSuggestedChallenges, joinChallenge, SuggestedChallenge } from "@/lib/challenges";
import { ActivityItem, fetchCommunityFeed, fetchSuggestedUsers, searchUsers, SuggestedUser, timeAgo } from "@/lib/community";
import { requestOrFollow } from "@/lib/followRequests";
import { countUnreadNotifications } from "@/lib/notifications";
import { Image } from "expo-image";
import { useFocusEffect, useRouter } from "expo-router";
import { Bell, Check, ChevronDown, Globe, ListFilter, Plus, Search, X } from "lucide-react-native";
import React, { useCallback, useEffect, useMemo, useState } from "react";
import { Modal, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

export default function Community() {
	const router = useRouter();
	const { session } = useAuth();
	const userId = session?.user?.id;

	const [search, setSearch] = useState("");
	const [feed, setFeed] = useState<ActivityItem[]>([]);
	const [suggested, setSuggested] = useState<SuggestedChallenge[]>([]);
	const [suggestedUsers, setSuggestedUsers] = useState<SuggestedUser[]>([]);
	const [loading, setLoading] = useState(true);
	const [timeFilter, setTimeFilter] = useState<"all" | "1h" | "1d" | "7d">("all");
	const [filterMenuOpen, setFilterMenuOpen] = useState(false);

	const [sectionFilterOpen, setSectionFilterOpen] = useState(false);
	const [visibleSections, setVisibleSections] = useState({
		challenges: true,
		people: true,
		activity: true,
	});

	const [searchResults, setSearchResults] = useState<SuggestedUser[]>([]);
	const [searching, setSearching] = useState(false);
	const [joiningId, setJoiningId] = useState<string | null>(null);

	const handleFollow = async (targetId: string) => {
		if (!userId) return;
		const status = await requestOrFollow(userId, targetId);
		setSuggestedUsers((prev) => prev.map((u) => (u.id === targetId ? { ...u, follow_status: status } : u)));
		setSearchResults((prev) => prev.map((u) => (u.id === targetId ? { ...u, follow_status: status } : u)));
	};

	const handleJoin = async (tmpl: SuggestedChallenge) => {
		if (!userId || joiningId) return;
		setJoiningId(tmpl.id);
		const newId = await createChallenge({
			created_by: userId,
			type: tmpl.type,
			title: tmpl.title,
			description: tmpl.description,
			continent: tmpl.continent,
			distance_km: tmpl.distance_km,
			target_count: tmpl.target_count,
			deadline: tmpl.deadline,
			invited_user_ids: [],
		});
		setJoiningId(null);
		if (newId) {
			await joinChallenge(userId, newId);
			setJoinedIds((prev) => [...prev, tmpl.id]);
			setSuggested((prev) => prev.filter((c) => c.id !== tmpl.id));
			router.push(`/challenge/${newId}` as any);
		}
	};

	useEffect(() => {
		if (!userId) return;
		const q = search.trim();
		if (q.length < 1) {
			setSearchResults([]);
			return;
		}
		setSearching(true);
		const timer = setTimeout(async () => {
			const results = await searchUsers(q, userId);
			setSearchResults(results);
			setSearching(false);
		}, 300);
		return () => clearTimeout(timer);
	}, [search, userId]);

	useFocusEffect(
		useCallback(() => {
			if (!userId) return;
			let cancelled = false;
			(async () => {
				setLoading(true);
				const [f, s, u] = await Promise.all([fetchCommunityFeed(userId), fetchSuggestedChallenges(userId), fetchSuggestedUsers(userId)]);
				if (!cancelled) {
					setFeed(f);
					setSuggested(s);
					setSuggestedUsers(u);
					setLoading(false);
				}
			})();
			return () => {
				cancelled = true;
			};
		}, [userId]),
	);

	const filteredFeed = useMemo(() => {
		if (timeFilter === "all") return feed;
		const now = Date.now();
		const thresholds = { "1h": 3600000, "1d": 86400000, "7d": 604800000 };
		const threshold = thresholds[timeFilter];
		return feed.filter((item) => now - new Date(item.created_at).getTime() <= threshold);
	}, [feed, timeFilter]);

	const timeFilterLabels = { all: "All time", "1h": "Last hour", "1d": "Last 24h", "7d": "Last 7 days" };

	const [joinedIds, setJoinedIds] = useState<string[]>([]);

	return (
		<CosmicBackground>
			<SafeAreaView edges={["top"]} style={{ flex: 1 }}>
				<ScrollView style={{ flex: 1 }} contentContainerStyle={{ paddingBottom: 120 }} showsVerticalScrollIndicator={false}>
					<ScreenHeader
						left={<NotifBadgeButton onPress={() => router.push("/notifications" as any)} />}
						center={
							<View style={styles.searchBox}>
								<Search size={18} color={Colors.white70} strokeWidth={2.2} />
								<TextInput value={search} onChangeText={setSearch} placeholder="Search people..." placeholderTextColor={Colors.white50} style={styles.searchInput} returnKeyType="search" />
							</View>
						}
						right={
							<HeaderButton variant="primary" onPress={() => setSectionFilterOpen(true)}>
								<ListFilter size={20} color={Colors.white} strokeWidth={2} />
							</HeaderButton>
						}
					/>

					{search.trim().length > 0 ? (
						<View style={styles.section}>
							<Text style={styles.sectionTitle}>Search results</Text>
							{searching ? (
								<Text style={styles.muted}>Searching...</Text>
							) : searchResults.length === 0 ? (
								<Text style={styles.muted}>No one found for "{search}".</Text>
							) : (
								searchResults.map((u) => (
									<Pressable key={u.id} style={styles.searchResultRow} onPress={() => router.push(`/user/${u.id}` as any)}>
										<View style={styles.searchAvatar}>
											{u.avatar_url ? <Image source={{ uri: u.avatar_url }} style={styles.searchAvatarImg} contentFit="cover" /> : <View style={[styles.searchAvatarImg, { backgroundColor: Colors.secundaire }]} />}
										</View>
										<Text style={styles.searchName}>{u.display_name}</Text>
										{u.follow_status === "following" && <Text style={styles.followingTag}>Following</Text>}
										{u.follow_status === "pending" && <Text style={styles.followingTag}>Requested</Text>}
									</Pressable>
								))
							)}
						</View>
					) : (
						<>
							{visibleSections.challenges && (
								<View style={styles.section}>
									<View style={styles.sectionHeader}>
										<Text style={styles.sectionHeaderTitle}>Suggested challenges</Text>
										<Pressable style={styles.createBtn} onPress={() => router.push("/create-challenge" as any)}>
											<Plus size={14} color={Colors.white} strokeWidth={2.6} />
											<Text style={styles.createBtnText}>Create</Text>
										</Pressable>
									</View>

									{suggested.length === 0 ? (
										<Text style={styles.muted}>No suggestions right now.</Text>
									) : (
										suggested.map((c) => (
											<View key={c.id} style={styles.challengeCard}>
												<View style={styles.challengeRow}>
													<Globe size={18} color={Colors.ink} strokeWidth={2.2} />
													<Text style={styles.challengeTitle}>{c.title}</Text>
													<Text style={styles.challengeDeadline}>{daysLeft(c.deadline)}</Text>
												</View>
												{c.description && <Text style={styles.challengeDesc}>{c.description}</Text>}

												<View style={{ flexDirection: "row", marginBottom: 10 }}>
													<View style={[styles.difficultyBadge, c.difficulty === "easy" ? styles.diffEasy : c.difficulty === "medium" ? styles.diffMedium : styles.diffHard]}>
														<Text style={styles.difficultyText}>{c.difficulty.toUpperCase()}</Text>
													</View>
												</View>

												<Pressable style={styles.joinBtn} onPress={() => handleJoin(c)} disabled={joiningId === c.id || joinedIds.includes(c.id)}>
													<Text style={styles.joinBtnText}>{joinedIds.includes(c.id) ? "Joined ✓" : joiningId === c.id ? "Joining..." : "Join Challenge →"}</Text>
												</Pressable>
											</View>
										))
									)}
								</View>
							)}

							{visibleSections.people && suggestedUsers.length > 0 && (
								<View style={styles.section}>
									<Text style={styles.sectionTitle}>People to follow</Text>
									<ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.usersRow}>
										{suggestedUsers.map((u) => (
											<Pressable key={u.id} style={styles.userCard} onPress={() => router.push(`/user/${u.id}` as any)}>
												<View style={styles.userAvatar}>{u.avatar_url ? <Image source={{ uri: u.avatar_url }} style={styles.userAvatarImg} contentFit="cover" /> : <View style={[styles.userAvatarImg, { backgroundColor: Colors.secundaire }]} />}</View>
												<Text style={styles.userName} numberOfLines={1}>
													{u.display_name}
												</Text>
												<Pressable style={[styles.followBtn, u.follow_status !== "none" && styles.followBtnActive]} onPress={() => handleFollow(u.id)} disabled={u.follow_status !== "none"}>
													<Text style={styles.followBtnText}>{u.follow_status === "following" ? "Following" : u.follow_status === "pending" ? "Requested" : "Follow"}</Text>
												</Pressable>
											</Pressable>
										))}
									</ScrollView>
								</View>
							)}

							{visibleSections.activity && (
								<View style={styles.section}>
									<View style={styles.feedHeaderRow}>
										<Text style={styles.feedSectionTitle}>Following activity</Text>
										<Pressable style={styles.timeFilterBtn} onPress={() => setFilterMenuOpen((v) => !v)}>
											<Text style={styles.timeFilterText}>{timeFilterLabels[timeFilter]}</Text>
											<ChevronDown size={14} color={Colors.white70} strokeWidth={2.2} />
										</Pressable>
									</View>

									{filterMenuOpen && (
										<View style={styles.timeFilterMenu}>
											{(["all", "1h", "1d", "7d"] as const).map((opt) => (
												<Pressable
													key={opt}
													style={[styles.timeFilterOption, timeFilter === opt && styles.timeFilterOptionActive]}
													onPress={() => {
														setTimeFilter(opt);
														setFilterMenuOpen(false);
													}}
												>
													<Text style={[styles.timeFilterOptionText, timeFilter === opt && styles.timeFilterOptionTextActive]}>{timeFilterLabels[opt]}</Text>
												</Pressable>
											))}
										</View>
									)}

									{loading ? (
										<Text style={styles.muted}>Loading feed...</Text>
									) : filteredFeed.length === 0 ? (
										<Text style={styles.muted}>{feed.length === 0 ? "Follow people to see their activity here." : "No activity in this period."}</Text>
									) : (
										filteredFeed.map((item) => (
											<Pressable key={item.id} style={styles.feedCard} onPress={() => router.push(`/user/${item.user_id}` as any)}>
												<View style={styles.feedHeader}>
													<View style={styles.feedAvatar}>
														{item.user?.avatar_url ? <Image source={{ uri: item.user.avatar_url }} style={styles.feedAvatarImg} contentFit="cover" /> : <View style={[styles.feedAvatarImg, { backgroundColor: Colors.secundaire }]} />}
													</View>
													<View style={{ flex: 1 }}>
														<Text style={styles.feedUserName}>{item.user?.display_name ?? "Someone"}</Text>
														<Text style={styles.feedTime}>{timeAgo(item.created_at)}</Text>
													</View>
												</View>
												<Text style={styles.feedAction}>
													{item.action_type === "scanned" && (
														<>
															Unlocked <Text style={styles.feedHighlight}>{item.card?.creature_name ?? "a new card"}</Text>
															{item.race ? ` at ${item.race.name}` : ""}
														</>
													)}
													{item.action_type === "joined_race" && (
														<>
															Joined <Text style={styles.feedHighlight}>{item.race?.name ?? "a race"}</Text>
														</>
													)}
													{item.action_type === "challenged" && (
														<>
															Joined the challenge <Text style={styles.feedHighlight}>{item.challenge?.title ?? ""}</Text>
														</>
													)}
													{item.action_type === "followed" && (
														<>
															Started following <Text style={styles.feedHighlight}>{item.target_user?.display_name ?? "someone"}</Text>
														</>
													)}
													{item.action_type === "card_featured" && (
														<>
															Featured <Text style={styles.feedHighlight}>{item.card?.creature_name ?? "a card"}</Text> on their profile
														</>
													)}
												</Text>
											</Pressable>
										))
									)}
								</View>
							)}
						</>
					)}
				</ScrollView>
			</SafeAreaView>

			<Modal visible={sectionFilterOpen} transparent animationType="fade" onRequestClose={() => setSectionFilterOpen(false)}>
				<Pressable style={styles.modalBackdrop} onPress={() => setSectionFilterOpen(false)}>
					<Pressable style={styles.filterCard} onPress={(e) => e.stopPropagation()}>
						<View style={styles.filterHeader}>
							<Text style={styles.filterTitle}>Show sections</Text>
							<Pressable onPress={() => setSectionFilterOpen(false)}>
								<X size={20} color={Colors.white} strokeWidth={2.4} />
							</Pressable>
						</View>
						{(
							[
								{ key: "challenges", label: "Suggested Challenges" },
								{ key: "people", label: "People to Follow" },
								{ key: "activity", label: "Following Activity" },
							] as const
						).map((opt) => (
							<Pressable key={opt.key} style={styles.filterRow} onPress={() => setVisibleSections((s) => ({ ...s, [opt.key]: !s[opt.key] }))}>
								<Text style={styles.filterRowText}>{opt.label}</Text>
								<View style={[styles.filterCheckbox, visibleSections[opt.key] && styles.filterCheckboxActive]}>{visibleSections[opt.key] && <Check size={14} color={Colors.white} strokeWidth={3} />}</View>
							</Pressable>
						))}
						<Pressable style={styles.filterDone} onPress={() => setSectionFilterOpen(false)}>
							<Text style={styles.filterDoneText}>Done</Text>
						</Pressable>
					</Pressable>
				</Pressable>
			</Modal>
		</CosmicBackground>
	);
}

function NotifBadgeButton({ onPress }: { onPress: () => void }) {
	const { session } = useAuth();
	const [count, setCount] = useState(0);

	useFocusEffect(
		useCallback(() => {
			if (!session?.user?.id) return;
			(async () => {
				const c = await countUnreadNotifications(session.user.id);
				setCount(c);
			})();
		}, [session?.user?.id]),
	);

	return (
		<View>
			<HeaderButton onPress={onPress}>
				<Bell size={20} color={Colors.ink} strokeWidth={2} />
			</HeaderButton>
			{count > 0 && (
				<View style={{ position: "absolute", top: -4, right: -4, minWidth: 18, height: 18, borderRadius: 9, backgroundColor: "#FF5757", alignItems: "center", justifyContent: "center", paddingHorizontal: 4 }}>
					<Text style={{ color: "#fff", fontSize: 11, fontWeight: "800", fontFamily: Fonts.bodyBold }}>{count > 9 ? "9+" : count}</Text>
				</View>
			)}
		</View>
	);
}

const styles = StyleSheet.create({
	searchBox: { flex: 1, height: 48, borderRadius: Radius.pill, backgroundColor: Colors.white08, borderWidth: 1, borderColor: Colors.white15, flexDirection: "row", alignItems: "center", paddingHorizontal: 16, gap: 10 },
	searchInput: { flex: 1, fontFamily: Fonts.body, fontSize: 15, color: Colors.white, height: "100%", padding: 0 },

	section: { marginTop: Spacing.lg, marginBottom: Spacing.lg },
	sectionHeader: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", paddingHorizontal: Spacing.lg, marginBottom: Spacing.md },
	sectionHeaderTitle: { fontFamily: Fonts.display, fontStyle: "italic", fontSize: FontSizes.h3, color: Colors.white, letterSpacing: 0 },
	sectionTitle: { fontFamily: Fonts.display, fontStyle: "italic", fontSize: FontSizes.h3, color: Colors.white, letterSpacing: 0, paddingHorizontal: Spacing.lg, marginBottom: Spacing.md },
	createBtn: { flexDirection: "row", alignItems: "center", gap: 4, backgroundColor: Colors.secundaire, paddingHorizontal: 12, paddingVertical: 6, borderRadius: Radius.pill },
	createBtnText: { fontFamily: Fonts.bodyBold, fontSize: 12, fontWeight: "800", color: Colors.white },

	challengeCard: { marginHorizontal: Spacing.lg, backgroundColor: Colors.white, borderRadius: Radius.lg, padding: Spacing.base, marginBottom: Spacing.sm },
	challengeRow: { flexDirection: "row", alignItems: "center", gap: 8, marginBottom: 8 },
	challengeTitle: { flex: 1, fontFamily: Fonts.bodyBold, fontSize: 15, fontWeight: "800", color: Colors.ink },
	challengeDeadline: { fontFamily: Fonts.body, fontSize: 11, color: Colors.ink70 },
	challengeDesc: { fontFamily: Fonts.body, fontSize: 13, color: Colors.ink70, marginBottom: 8 },
	joinBtn: { backgroundColor: Colors.secundaire, paddingVertical: 10, borderRadius: Radius.pill, alignItems: "center" },
	joinBtnText: { fontFamily: Fonts.bodyBold, fontSize: 13, fontWeight: "800", color: Colors.white },

	difficultyBadge: { paddingHorizontal: 8, paddingVertical: 3, borderRadius: Radius.pill, alignSelf: "flex-start" },
	diffEasy: { backgroundColor: "rgba(91,200,120,0.2)" },
	diffMedium: { backgroundColor: "rgba(255,209,92,0.2)" },
	diffHard: { backgroundColor: "rgba(255,87,87,0.2)" },
	difficultyText: { fontFamily: Fonts.bodyBold, fontSize: 10, fontWeight: "800", color: Colors.ink, letterSpacing: 0.5 },

	usersRow: { paddingHorizontal: Spacing.lg, gap: 10 },
	userCard: { width: 120, alignItems: "center", backgroundColor: Colors.white08, borderRadius: Radius.lg, padding: 12 },
	userAvatar: { width: 60, height: 60, borderRadius: 30, overflow: "hidden", marginBottom: 8 },
	userAvatarImg: { width: "100%", height: "100%" },
	userName: { fontFamily: Fonts.bodyBold, fontSize: 12, fontWeight: "700", color: Colors.white, marginBottom: 8, textAlign: "center" },
	followBtn: { paddingHorizontal: 14, paddingVertical: 6, borderRadius: Radius.pill, backgroundColor: Colors.secundaire },
	followBtnActive: { backgroundColor: Colors.white15 },
	followBtnText: { fontFamily: Fonts.bodyBold, fontSize: 11, fontWeight: "800", color: Colors.white },

	feedCard: { marginHorizontal: Spacing.lg, backgroundColor: Colors.white, borderRadius: Radius.lg, padding: Spacing.base, marginBottom: Spacing.sm },
	feedHeader: { flexDirection: "row", alignItems: "center", gap: 10, marginBottom: 8 },
	feedAvatar: { width: 44, height: 44, borderRadius: 22, overflow: "hidden" },
	feedAvatarImg: { width: "100%", height: "100%" },
	feedUserName: { fontFamily: Fonts.bodyBold, fontSize: 14, fontWeight: "800", color: Colors.ink },
	feedTime: { fontFamily: Fonts.body, fontSize: 11, color: Colors.ink50, marginTop: 2 },
	feedAction: { fontFamily: Fonts.body, fontSize: 13, color: Colors.ink70 },
	feedHighlight: { fontFamily: Fonts.bodyBold, fontWeight: "800", color: Colors.ink },

	feedHeaderRow: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", paddingHorizontal: Spacing.lg, marginBottom: Spacing.md },
	feedSectionTitle: { fontFamily: Fonts.display, fontStyle: "italic", fontSize: FontSizes.h3, color: Colors.white, letterSpacing: 0 },
	timeFilterBtn: { flexDirection: "row", alignItems: "center", gap: 4, paddingHorizontal: 12, paddingVertical: 6, borderRadius: Radius.pill, backgroundColor: Colors.white08, borderWidth: 1, borderColor: Colors.white15 },
	timeFilterText: { fontFamily: Fonts.bodyBold, fontSize: 12, color: Colors.white70 },
	timeFilterMenu: { marginHorizontal: Spacing.lg, marginBottom: Spacing.md, backgroundColor: Colors.hoofdkleur, borderRadius: Radius.lg, borderWidth: 1, borderColor: Colors.white15, overflow: "hidden" },
	timeFilterOption: { paddingVertical: 12, paddingHorizontal: 16, borderBottomWidth: 1, borderBottomColor: Colors.white15 },
	timeFilterOptionActive: { backgroundColor: "rgba(91, 88, 235, 0.18)" },
	timeFilterOptionText: { fontFamily: Fonts.body, fontSize: 14, color: Colors.white70 },
	timeFilterOptionTextActive: { color: Colors.white, fontFamily: Fonts.bodyBold, fontWeight: "700" },

	muted: { color: Colors.white70, fontFamily: Fonts.body, fontSize: 14, textAlign: "center", paddingHorizontal: Spacing.lg, paddingVertical: Spacing.base },

	modalBackdrop: { flex: 1, backgroundColor: "rgba(4,8,26,0.82)", alignItems: "center", justifyContent: "center" },
	filterCard: { width: 320, backgroundColor: Colors.hoofdkleur, borderRadius: Radius.xl, borderWidth: 1, borderColor: Colors.white15, padding: Spacing.lg },
	filterHeader: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: Spacing.base },
	filterTitle: { fontFamily: Fonts.display, fontStyle: "italic", fontSize: FontSizes.h3, color: Colors.white, letterSpacing: 0 },
	filterRow: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", paddingVertical: 14, borderBottomWidth: 1, borderBottomColor: Colors.white15 },
	filterRowText: { fontFamily: Fonts.body, fontSize: 15, color: Colors.white },
	filterCheckbox: { width: 24, height: 24, borderRadius: 6, borderWidth: 2, borderColor: Colors.white30, alignItems: "center", justifyContent: "center" },
	filterCheckboxActive: { backgroundColor: Colors.secundaire, borderColor: Colors.secundaire },
	filterDone: { marginTop: Spacing.lg, paddingVertical: 12, borderRadius: Radius.pill, backgroundColor: Colors.secundaire, alignItems: "center" },
	filterDoneText: { fontFamily: Fonts.bodyBold, fontSize: 14, fontWeight: "800", color: Colors.white },

	searchResultRow: { flexDirection: "row", alignItems: "center", gap: 12, marginHorizontal: Spacing.lg, padding: 10, backgroundColor: Colors.white08, borderRadius: Radius.lg, marginBottom: 8 },
	searchAvatar: { width: 44, height: 44, borderRadius: 22, overflow: "hidden" },
	searchAvatarImg: { width: "100%", height: "100%" },
	searchName: { flex: 1, fontFamily: Fonts.bodyBold, fontSize: 14, fontWeight: "700", color: Colors.white },
	followingTag: { fontFamily: Fonts.body, fontSize: 11, color: Colors.white50 },
});
