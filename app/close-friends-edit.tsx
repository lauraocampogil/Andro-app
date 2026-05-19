import { CosmicBackground } from "@/components/CosmicBackground";
import { Colors, Fonts, Radius, Spacing } from "@/constants/theme";
import { useAuth } from "@/lib/auth";
import { addCloseFriend, getCloseFriendIds, removeCloseFriend } from "@/lib/closeFriends";
import { supabase } from "@/lib/supabase";
import { Image } from "expo-image";
import { useFocusEffect, useRouter } from "expo-router";
import { Check, Search, X } from "lucide-react-native";
import React, { useCallback, useMemo, useState } from "react";
import { Pressable, ScrollView, StyleSheet, Text, TextInput, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

type Profile = {
	id: string;
	display_name: string | null;
	avatar_url: string | null;
};

export default function CloseFriendsEdit() {
	const router = useRouter();
	const { session } = useAuth();
	const userId = session?.user?.id;

	const [followings, setFollowings] = useState<Profile[]>([]);
	const [closeFriendIds, setCloseFriendIds] = useState<Set<string>>(new Set());
	const [search, setSearch] = useState("");
	const [loading, setLoading] = useState(true);

	useFocusEffect(
		useCallback(() => {
			if (!userId) return;
			let cancelled = false;
			(async () => {
				setLoading(true);

				// Fetch people I follow
				const { data: follows } = await supabase.from("follows").select("following_id").eq("follower_id", userId);
				const ids = (follows ?? []).map((f) => f.following_id);

				let profiles: Profile[] = [];
				if (ids.length > 0) {
					const { data } = await supabase.from("profiles").select("id, display_name, avatar_url").in("id", ids);
					profiles = data ?? [];
				}

				// Fetch existing close friends
				const cfIds = await getCloseFriendIds(userId);

				if (!cancelled) {
					setFollowings(profiles);
					setCloseFriendIds(new Set(cfIds));
					setLoading(false);
				}
			})();
			return () => {
				cancelled = true;
			};
		}, [userId]),
	);

	const filtered = useMemo(() => {
		const q = search.trim().toLowerCase();
		if (!q) return followings;
		return followings.filter((f) => f.display_name?.toLowerCase().includes(q));
	}, [followings, search]);

	const handleToggle = async (friendId: string) => {
		if (!userId) return;
		const isCurrentlyClose = closeFriendIds.has(friendId);

		// Optimistic update
		setCloseFriendIds((prev) => {
			const next = new Set(prev);
			if (isCurrentlyClose) next.delete(friendId);
			else next.add(friendId);
			return next;
		});

		if (isCurrentlyClose) {
			await removeCloseFriend(userId, friendId);
		} else {
			await addCloseFriend(userId, friendId);
		}
	};

	return (
		<CosmicBackground>
			<SafeAreaView edges={["top"]} style={{ flex: 1 }}>
				<View style={styles.header}>
					<Pressable style={styles.backBtn} onPress={() => router.back()}>
						<X size={22} color={Colors.white} strokeWidth={2.4} />
					</Pressable>
					<Text style={styles.title}>CLOSE FRIENDS</Text>
					<View style={{ width: 44 }} />
				</View>

				<Text style={styles.subtitle}>Pick from people you follow. Only your close friends will see your "Close Friends only" challenges.</Text>

				<View style={styles.searchBox}>
					<Search size={18} color={Colors.white70} strokeWidth={2.2} />
					<TextInput value={search} onChangeText={setSearch} placeholder="Search..." placeholderTextColor={Colors.white50} style={styles.searchInput} />
				</View>

				<Text style={styles.count}>
					{closeFriendIds.size} {closeFriendIds.size === 1 ? "person" : "people"} selected
				</Text>

				<ScrollView style={{ flex: 1 }} contentContainerStyle={{ paddingBottom: 120 }} showsVerticalScrollIndicator={false}>
					{loading ? (
						<Text style={styles.muted}>Loading...</Text>
					) : followings.length === 0 ? (
						<View style={styles.emptyBox}>
							<Text style={styles.emptyTitle}>No followings yet</Text>
							<Text style={styles.emptyDesc}>Follow people first in the Community tab. You can only add people you follow as close friends.</Text>
						</View>
					) : filtered.length === 0 ? (
						<Text style={styles.muted}>No one matches "{search}".</Text>
					) : (
						filtered.map((f) => {
							const isClose = closeFriendIds.has(f.id);
							return (
								<Pressable key={f.id} style={[styles.row, isClose && styles.rowActive]} onPress={() => handleToggle(f.id)}>
									<View style={styles.avatar}>{f.avatar_url ? <Image source={{ uri: f.avatar_url }} style={styles.avatarImg} contentFit="cover" /> : <View style={[styles.avatarImg, { backgroundColor: Colors.secundaire }]} />}</View>
									<Text style={styles.name}>{f.display_name ?? "Anonymous"}</Text>
									<View style={[styles.checkbox, isClose && styles.checkboxActive]}>{isClose && <Check size={14} color={Colors.white} strokeWidth={3} />}</View>
								</Pressable>
							);
						})
					)}
				</ScrollView>
			</SafeAreaView>
		</CosmicBackground>
	);
}

const styles = StyleSheet.create({
	header: {
		flexDirection: "row",
		alignItems: "center",
		justifyContent: "space-between",
		paddingHorizontal: Spacing.lg,
		paddingTop: Spacing.sm,
		paddingBottom: Spacing.lg,
	},
	backBtn: {
		width: 44,
		height: 44,
		borderRadius: 22,
		backgroundColor: Colors.white15,
		alignItems: "center",
		justifyContent: "center",
	},
	title: { fontFamily: Fonts.display, fontStyle: "italic", fontSize: 22, color: Colors.white, letterSpacing: 1 },

	subtitle: {
		fontFamily: Fonts.body,
		fontSize: 13,
		color: Colors.white70,
		paddingHorizontal: Spacing.lg,
		marginBottom: Spacing.md,
		lineHeight: 18,
	},

	searchBox: {
		marginHorizontal: Spacing.lg,
		height: 44,
		borderRadius: Radius.pill,
		backgroundColor: Colors.white08,
		borderWidth: 1,
		borderColor: Colors.white15,
		flexDirection: "row",
		alignItems: "center",
		paddingHorizontal: 14,
		gap: 8,
		marginBottom: Spacing.sm,
	},
	searchInput: { flex: 1, fontFamily: Fonts.body, fontSize: 14, color: Colors.white, height: "100%", padding: 0 },

	count: {
		fontFamily: Fonts.bodyBold,
		fontSize: 12,
		color: Colors.violetLight,
		paddingHorizontal: Spacing.lg,
		marginBottom: Spacing.md,
		letterSpacing: 1,
	},

	row: {
		flexDirection: "row",
		alignItems: "center",
		gap: 12,
		marginHorizontal: Spacing.lg,
		padding: 10,
		backgroundColor: Colors.white08,
		borderRadius: Radius.lg,
		marginBottom: 8,
		borderWidth: 1,
		borderColor: Colors.white15,
	},
	rowActive: {
		backgroundColor: "rgba(91, 88, 235, 0.18)",
		borderColor: Colors.secundaire,
	},
	avatar: { width: 44, height: 44, borderRadius: 22, overflow: "hidden" },
	avatarImg: { width: "100%", height: "100%" },
	name: { flex: 1, fontFamily: Fonts.bodyBold, fontSize: 14, fontWeight: "700", color: Colors.white },

	checkbox: {
		width: 26,
		height: 26,
		borderRadius: 13,
		borderWidth: 2,
		borderColor: Colors.white30,
		alignItems: "center",
		justifyContent: "center",
	},
	checkboxActive: {
		backgroundColor: Colors.secundaire,
		borderColor: Colors.secundaire,
	},

	emptyBox: {
		marginHorizontal: Spacing.lg,
		padding: Spacing.lg,
		backgroundColor: Colors.white08,
		borderRadius: Radius.lg,
		borderWidth: 1,
		borderColor: Colors.white15,
		alignItems: "center",
	},
	emptyTitle: {
		fontFamily: Fonts.bodyBold,
		fontSize: 15,
		fontWeight: "800",
		color: Colors.white,
		marginBottom: 6,
	},
	emptyDesc: {
		fontFamily: Fonts.body,
		fontSize: 13,
		color: Colors.white70,
		textAlign: "center",
		lineHeight: 18,
	},

	muted: { color: Colors.white70, fontFamily: Fonts.body, fontSize: 14, textAlign: "center", paddingVertical: Spacing.xl },
});
