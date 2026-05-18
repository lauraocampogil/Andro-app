import { CosmicBackground } from "@/components/CosmicBackground";
import { HeaderButton } from "@/components/HeaderButton";
import { ScreenHeader } from "@/components/ScreenHeader";
import { Colors, Fonts, Radius, Spacing } from "@/constants/theme";
import { useAuth } from "@/lib/auth";
import { Challenge, daysLeft, fetchChallengeParticipants, fetchSuggestedChallenges, joinChallenge } from "@/lib/challenges";
import { ActivityItem, fetchCommunityFeed, fetchSuggestedUsers, SuggestedUser, timeAgo } from "@/lib/community";
import { followUser } from "@/lib/follows";
import { Image } from "expo-image";
import { useFocusEffect, useRouter } from "expo-router";
import { Globe, Plus, Search, Settings } from "lucide-react-native";
import React, { useCallback, useState } from "react";
import { Pressable, ScrollView, StyleSheet, Text, TextInput, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

export default function Community() {
	const router = useRouter();
	const { session } = useAuth();
	const userId = session?.user?.id;

	const [search, setSearch] = useState("");
	const [feed, setFeed] = useState<ActivityItem[]>([]);
	const [suggested, setSuggested] = useState<Challenge[]>([]);
	const [suggestedUsers, setSuggestedUsers] = useState<SuggestedUser[]>([]);
	const [participantsByChallenge, setParticipantsByChallenge] = useState<Record<string, any[]>>({});
	const [loading, setLoading] = useState(true);

	useFocusEffect(
		useCallback(() => {
			if (!userId) return;
			let cancelled = false;
			(async () => {
				setLoading(true);
				const [f, s, u] = await Promise.all([fetchCommunityFeed(), fetchSuggestedChallenges(userId), fetchSuggestedUsers(userId)]);
				if (!cancelled) {
					setFeed(f);
					setSuggested(s);
					setSuggestedUsers(u);
					setLoading(false);

					// Fetch participants for each challenge
					const partMap: Record<string, any[]> = {};
					for (const c of s) {
						partMap[c.id] = await fetchChallengeParticipants(c.id);
					}
					if (!cancelled) setParticipantsByChallenge(partMap);
				}
			})();
			return () => {
				cancelled = true;
			};
		}, [userId]),
	);

	const handleJoin = async (challengeId: string) => {
		if (!userId) return;
		const ok = await joinChallenge(userId, challengeId);
		if (ok) setSuggested((prev) => prev.filter((c) => c.id !== challengeId));
	};

	const handleFollow = async (targetId: string) => {
		if (!userId) return;
		const ok = await followUser(userId, targetId);
		if (ok) setSuggestedUsers((prev) => prev.map((u) => (u.id === targetId ? { ...u, is_following: true } : u)));
	};

	return (
		<CosmicBackground>
			<SafeAreaView edges={["top"]} style={{ flex: 1 }}>
				<ScrollView style={{ flex: 1 }} contentContainerStyle={{ paddingBottom: 120 }} showsVerticalScrollIndicator={false}>
					<ScreenHeader
						left={
							<HeaderButton onPress={() => router.push("/settings" as any)}>
								<Settings size={20} color={Colors.ink} strokeWidth={2} />
							</HeaderButton>
						}
						center={
							<View style={styles.searchBox}>
								<Search size={18} color={Colors.white70} strokeWidth={2.2} />
								<TextInput value={search} onChangeText={setSearch} placeholder="Search races, people..." placeholderTextColor={Colors.white50} style={styles.searchInput} returnKeyType="search" />
							</View>
						}
					/>

					{/* Suggested Challenges */}
					<View style={styles.section}>
						<View style={styles.sectionHeader}>
							<Text style={styles.sectionHeaderTitle}>SUGGESTED CHALLENGES</Text>
							<Pressable style={styles.createBtn} onPress={() => router.push("/create-challenge" as any)}>
								<Plus size={14} color={Colors.white} strokeWidth={2.6} />
								<Text style={styles.createBtnText}>Create</Text>
							</Pressable>
						</View>

						{suggested.length === 0 ? (
							<Text style={styles.muted}>No suggestions right now.</Text>
						) : (
							suggested.map((c) => {
								const participants = participantsByChallenge[c.id] ?? [];
								return (
									<View key={c.id} style={styles.challengeCard}>
										<View style={styles.challengeRow}>
											<Globe size={18} color={Colors.ink} strokeWidth={2.2} />
											<Text style={styles.challengeTitle}>{c.title}</Text>
											<Text style={styles.challengeDeadline}>{daysLeft(c.deadline)}</Text>
										</View>
										{c.description && <Text style={styles.challengeDesc}>{c.description}</Text>}
										<Text style={styles.challengeMeta}>{c.participants_count ?? 0} runners participating</Text>

										{/* Friend avatars */}
										{participants.length > 0 && (
											<View style={styles.avatarsRow}>
												{participants.slice(0, 5).map((p, i) => (
													<View key={i} style={[styles.participantAvatar, { marginLeft: i === 0 ? 0 : -8 }]}>
														{p?.avatar_url ? <Image source={{ uri: p.avatar_url }} style={styles.participantAvatarImg} contentFit="cover" /> : <View style={[styles.participantAvatarImg, { backgroundColor: Colors.secundaire }]} />}
													</View>
												))}
											</View>
										)}

										<Pressable style={styles.joinBtn} onPress={() => handleJoin(c.id)}>
											<Text style={styles.joinBtnText}>Join Challenge →</Text>
										</Pressable>
									</View>
								);
							})
						)}
					</View>

					{/* Suggested users */}
					{suggestedUsers.length > 0 && (
						<View style={styles.section}>
							<Text style={styles.sectionTitle}>PEOPLE TO FOLLOW</Text>
							<ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.usersRow}>
								{suggestedUsers.map((u) => (
									<Pressable key={u.id} style={styles.userCard} onPress={() => router.push(`/user/${u.id}` as any)}>
										<View style={styles.userAvatar}>{u.avatar_url ? <Image source={{ uri: u.avatar_url }} style={styles.userAvatarImg} contentFit="cover" /> : <View style={[styles.userAvatarImg, { backgroundColor: Colors.secundaire }]} />}</View>
										<Text style={styles.userName} numberOfLines={1}>
											{u.display_name}
										</Text>
										<Pressable
											style={[styles.followBtn, u.is_following && styles.followBtnActive]}
											onPress={(e) => {
												e.stopPropagation?.();
												!u.is_following && handleFollow(u.id);
											}}
											disabled={u.is_following}
										>
											<Text style={styles.followBtnText}>{u.is_following ? "Following" : "Follow"}</Text>
										</Pressable>
									</Pressable>
								))}
							</ScrollView>
						</View>
					)}

					{/* Following activity */}
					<View style={styles.section}>
						<Text style={styles.sectionTitle}>FOLLOWING ACTIVITY</Text>

						{loading ? (
							<Text style={styles.muted}>Loading feed...</Text>
						) : feed.length === 0 ? (
							<Text style={styles.muted}>Follow people to see their activity here.</Text>
						) : (
							feed.map((item) => {
								const realUserId = (item as any).user_id;
								const Wrapper: any = realUserId ? Pressable : View;
								return (
									<Wrapper key={item.id} style={styles.feedCard} {...(realUserId && { onPress: () => router.push(`/user/${realUserId}` as any) })}>
										<View style={styles.feedHeader}>
											<View style={styles.feedAvatar}>
												{item.user.avatar_url ? <Image source={{ uri: item.user.avatar_url }} style={styles.feedAvatarImg} contentFit="cover" /> : <View style={[styles.feedAvatarImg, { backgroundColor: Colors.secundaire }]} />}
											</View>
											<View style={{ flex: 1 }}>
												<Text style={styles.feedUserName}>{item.user.display_name}</Text>
												<Text style={styles.feedTime}>{timeAgo(item.created_at)}</Text>
											</View>
										</View>
										<Text style={styles.feedAction}>
											{item.action_type === "scanned" && `Scanned: ${item.race?.name ?? "a race"}`}
											{item.action_type === "joined_race" && `Joined: ${item.race?.name ?? "a race"}`}
											{item.action_type === "challenged" && `Challenged someone`}
										</Text>
									</Wrapper>
								);
							})
						)}
					</View>
				</ScrollView>
			</SafeAreaView>
		</CosmicBackground>
	);
}

const styles = StyleSheet.create({
	searchBox: { flex: 1, height: 48, borderRadius: Radius.pill, backgroundColor: Colors.white08, borderWidth: 1, borderColor: Colors.white15, flexDirection: "row", alignItems: "center", paddingHorizontal: 16, gap: 10 },
	searchInput: { flex: 1, fontFamily: Fonts.body, fontSize: 15, color: Colors.white, height: "100%", padding: 0 },

	section: { marginTop: Spacing.lg, marginBottom: Spacing.lg },
	sectionHeader: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", paddingHorizontal: Spacing.lg, marginBottom: Spacing.md },
	sectionHeaderTitle: {
		fontFamily: Fonts.display,
		fontStyle: "italic",
		fontSize: 20,
		color: Colors.white,
	},
	sectionTitle: { fontFamily: Fonts.display, fontStyle: "italic", fontSize: 20, color: Colors.white, paddingHorizontal: Spacing.lg, marginBottom: Spacing.md },
	createBtn: { flexDirection: "row", alignItems: "center", gap: 4, backgroundColor: Colors.secundaire, paddingHorizontal: 12, paddingVertical: 6, borderRadius: Radius.pill },
	createBtnText: { fontFamily: Fonts.bodyBold, fontSize: 12, fontWeight: "800", color: Colors.white },

	challengeCard: { marginHorizontal: Spacing.lg, backgroundColor: Colors.white, borderRadius: Radius.lg, padding: Spacing.base, marginBottom: Spacing.sm },
	challengeRow: { flexDirection: "row", alignItems: "center", gap: 8, marginBottom: 8 },
	challengeTitle: { flex: 1, fontFamily: Fonts.bodyBold, fontSize: 15, fontWeight: "800", color: Colors.ink },
	challengeDeadline: { fontFamily: Fonts.body, fontSize: 11, color: Colors.ink70 },
	challengeDesc: { fontFamily: Fonts.body, fontSize: 13, color: Colors.ink70, marginBottom: 4 },
	challengeMeta: { fontFamily: Fonts.body, fontSize: 12, color: Colors.ink70, marginBottom: 10 },
	avatarsRow: { flexDirection: "row", marginBottom: 10 },
	participantAvatar: { width: 28, height: 28, borderRadius: 14, borderWidth: 2, borderColor: Colors.white, overflow: "hidden" },
	participantAvatarImg: { width: "100%", height: "100%" },
	joinBtn: { backgroundColor: Colors.secundaire, paddingVertical: 10, borderRadius: Radius.pill, alignItems: "center" },
	joinBtnText: { fontFamily: Fonts.bodyBold, fontSize: 13, fontWeight: "800", color: Colors.white },

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

	muted: { color: Colors.white70, fontFamily: Fonts.body, fontSize: 14, textAlign: "center", paddingHorizontal: Spacing.lg, paddingVertical: Spacing.base },
});
