import { CosmicBackground } from "@/components/CosmicBackground";
import { HeaderButton } from "@/components/HeaderButton";
import { ScreenHeader } from "@/components/ScreenHeader";
import { Colors, Fonts, Radius, Spacing } from "@/constants/theme";
import { useAuth } from "@/lib/auth";
import { Challenge, daysLeft, fetchSuggestedChallenges, joinChallenge } from "@/lib/challenges";
import { ActivityItem, fetchCommunityFeed, timeAgo } from "@/lib/community";
import { Image } from "expo-image";
import { useFocusEffect, useRouter } from "expo-router";
import { Globe, Plus, Search, User } from "lucide-react-native";
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
	const [loading, setLoading] = useState(true);

	useFocusEffect(
		useCallback(() => {
			if (!userId) return;
			let cancelled = false;
			(async () => {
				setLoading(true);
				const [f, s] = await Promise.all([fetchCommunityFeed(), fetchSuggestedChallenges(userId)]);
				if (!cancelled) {
					setFeed(f);
					setSuggested(s);
					setLoading(false);
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

	return (
		<CosmicBackground>
			<SafeAreaView edges={["top"]} style={{ flex: 1 }}>
				<ScrollView style={{ flex: 1 }} contentContainerStyle={{ paddingBottom: 120 }} showsVerticalScrollIndicator={false}>
					<ScreenHeader
						left={
							<HeaderButton onPress={() => router.push("/(tabs)/profile" as any)}>
								<User size={20} color={Colors.ink} strokeWidth={2} />
							</HeaderButton>
						}
						center={
							<View style={styles.searchBox}>
								<Search size={18} color={Colors.white70} strokeWidth={2.2} />
								<TextInput value={search} onChangeText={setSearch} placeholder="Search races, people..." placeholderTextColor={Colors.white50} style={styles.searchInput} returnKeyType="search" />
							</View>
						}
					/>

					{/* Active challenges (suggestions to join) */}
					{suggested.length > 0 && (
						<View style={styles.section}>
							<View style={styles.sectionHeader}>
								<Text style={styles.sectionTitle}>SUGGESTED CHALLENGES</Text>
								<Pressable style={styles.createBtn}>
									<Plus size={14} color={Colors.white} strokeWidth={2.6} />
									<Text style={styles.createBtnText}>Create</Text>
								</Pressable>
							</View>

							{suggested.map((c) => (
								<View key={c.id} style={styles.challengeCard}>
									<View style={styles.challengeRow}>
										<Globe size={18} color={Colors.ink} strokeWidth={2.2} />
										<Text style={styles.challengeTitle}>{c.title}</Text>
										<Text style={styles.challengeDeadline}>{daysLeft(c.deadline)}</Text>
									</View>
									{c.description && <Text style={styles.challengeDesc}>{c.description}</Text>}
									<Text style={styles.challengeMeta}>{c.participants_count ?? 0} runners participating</Text>
									<Pressable style={styles.joinBtn} onPress={() => handleJoin(c.id)}>
										<Text style={styles.joinBtnText}>Join Challenge →</Text>
									</Pressable>
								</View>
							))}
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
							feed.map((item) => (
								<View key={item.id} style={styles.feedCard}>
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
									{item.race && (
										<Pressable style={styles.viewBtn}>
											<Text style={styles.viewBtnText}>View Card</Text>
										</Pressable>
									)}
								</View>
							))
						)}
					</View>
				</ScrollView>
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
	searchInput: { flex: 1, fontFamily: Fonts.body, fontSize: 15, color: Colors.white, height: "100%", padding: 0 },

	section: { marginTop: Spacing.lg, marginBottom: Spacing.lg },
	sectionHeader: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", paddingHorizontal: Spacing.lg, marginBottom: Spacing.md },
	sectionTitle: { fontFamily: Fonts.display, fontStyle: "italic", fontSize: 20, color: Colors.white, letterSpacing: 0, paddingHorizontal: Spacing.lg, marginBottom: Spacing.md },
	createBtn: { flexDirection: "row", alignItems: "center", gap: 4, backgroundColor: Colors.secundaire, paddingHorizontal: 12, paddingVertical: 6, borderRadius: Radius.pill },
	createBtnText: { fontFamily: Fonts.bodyBold, fontSize: 12, fontWeight: "800", color: Colors.white },

	challengeCard: { marginHorizontal: Spacing.lg, backgroundColor: Colors.white, borderRadius: Radius.lg, padding: Spacing.base, marginBottom: Spacing.sm },
	challengeRow: { flexDirection: "row", alignItems: "center", gap: 8, marginBottom: 8 },
	challengeTitle: { flex: 1, fontFamily: Fonts.bodyBold, fontSize: 15, fontWeight: "800", color: Colors.ink },
	challengeDeadline: { fontFamily: Fonts.body, fontSize: 11, color: Colors.ink70 },
	challengeDesc: { fontFamily: Fonts.body, fontSize: 13, color: Colors.ink70, marginBottom: 4 },
	challengeMeta: { fontFamily: Fonts.body, fontSize: 12, color: Colors.ink70, marginBottom: 10 },
	joinBtn: { backgroundColor: Colors.secundaire, paddingVertical: 10, borderRadius: Radius.pill, alignItems: "center" },
	joinBtnText: { fontFamily: Fonts.bodyBold, fontSize: 13, fontWeight: "800", color: Colors.white },

	feedCard: { marginHorizontal: Spacing.lg, backgroundColor: Colors.white, borderRadius: Radius.lg, padding: Spacing.base, marginBottom: Spacing.sm },
	feedHeader: { flexDirection: "row", alignItems: "center", gap: 10, marginBottom: 8 },
	feedAvatar: { width: 44, height: 44, borderRadius: 22, overflow: "hidden" },
	feedAvatarImg: { width: "100%", height: "100%" },
	feedUserName: { fontFamily: Fonts.bodyBold, fontSize: 14, fontWeight: "800", color: Colors.ink },
	feedTime: { fontFamily: Fonts.body, fontSize: 11, color: Colors.ink50, marginTop: 2 },
	feedAction: { fontFamily: Fonts.body, fontSize: 13, color: Colors.ink70, marginBottom: 10 },
	viewBtn: { backgroundColor: Colors.secundaire, paddingVertical: 8, borderRadius: Radius.pill, alignItems: "center" },
	viewBtnText: { fontFamily: Fonts.bodyBold, fontSize: 12, fontWeight: "800", color: Colors.white },

	muted: { color: Colors.white70, fontFamily: Fonts.body, fontSize: 14, textAlign: "center", paddingHorizontal: Spacing.lg },
});
