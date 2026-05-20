import { Button } from "@/components/Button";
import { CosmicBackground } from "@/components/CosmicBackground";
import { Colors, Fonts, Radius, Spacing } from "@/constants/theme";
import { useAuth } from "@/lib/auth";
import { addCloseFriend, getCloseFriendIds } from "@/lib/closeFriends";
import { supabase } from "@/lib/supabase";
import { Image } from "expo-image";
import { useFocusEffect, useRouter } from "expo-router";
import { Check, Search, X } from "lucide-react-native";
import React, { useCallback, useMemo, useState } from "react";
import { Alert, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

type Profile = { id: string; display_name: string | null; avatar_url: string | null };

export default function CloseFriendsEdit() {
	const router = useRouter();
	const { session } = useAuth();
	const userId = session?.user?.id;

	const [followings, setFollowings] = useState<Profile[]>([]);
	const [alreadyClose, setAlreadyClose] = useState<Set<string>>(new Set());
	const [selected, setSelected] = useState<Set<string>>(new Set());
	const [search, setSearch] = useState("");
	const [loading, setLoading] = useState(true);
	const [saving, setSaving] = useState(false);

	useFocusEffect(
		useCallback(() => {
			if (!userId) return;
			let cancelled = false;
			(async () => {
				setLoading(true);
				const { data: follows } = await supabase.from("follows").select("following_id").eq("follower_id", userId);
				const ids = (follows ?? []).map((f) => f.following_id);
				let profiles: Profile[] = [];
				if (ids.length > 0) {
					const { data } = await supabase.from("profiles").select("id, display_name, avatar_url").in("id", ids);
					profiles = data ?? [];
				}
				const cfIds = await getCloseFriendIds(userId);
				if (!cancelled) {
					setFollowings(profiles);
					setAlreadyClose(new Set(cfIds));
					setSelected(new Set());
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
		// Only show people not already close friends
		const available = followings.filter((f) => !alreadyClose.has(f.id));
		if (!q) return available;
		return available.filter((f) => f.display_name?.toLowerCase().includes(q));
	}, [followings, alreadyClose, search]);

	const toggleSelect = (id: string) => {
		setSelected((prev) => {
			const next = new Set(prev);
			if (next.has(id)) next.delete(id);
			else next.add(id);
			return next;
		});
	};

	const handleAdd = async () => {
		if (!userId || selected.size === 0) return;
		setSaving(true);
		for (const friendId of selected) {
			await addCloseFriend(userId, friendId);
		}
		setSaving(false);
		Alert.alert("Added", `${selected.size} added to close friends.`);
		router.back();
	};

	return (
		<CosmicBackground>
			<SafeAreaView edges={["top"]} style={{ flex: 1 }}>
				<View style={styles.header}>
					<Pressable style={styles.backBtn} onPress={() => router.back()}>
						<X size={22} color={Colors.white} strokeWidth={2.4} />
					</Pressable>
					<Text style={styles.title}>ADD CLOSE FRIENDS</Text>
					<View style={{ width: 44 }} />
				</View>

				<Text style={styles.subtitle}>Select people you follow to add to your close friends list.</Text>

				<View style={styles.searchBox}>
					<Search size={18} color={Colors.white70} strokeWidth={2.2} />
					<TextInput value={search} onChangeText={setSearch} placeholder="Search..." placeholderTextColor={Colors.white50} style={styles.searchInput} />
				</View>

				<ScrollView style={{ flex: 1 }} contentContainerStyle={{ paddingBottom: 20 }} showsVerticalScrollIndicator={false}>
					{loading ? (
						<Text style={styles.muted}>Loading...</Text>
					) : filtered.length === 0 ? (
						<Text style={styles.muted}>{followings.length === 0 ? "Follow people first in Community." : "Everyone you follow is already a close friend."}</Text>
					) : (
						filtered.map((f) => {
							const isSelected = selected.has(f.id);
							return (
								<Pressable key={f.id} style={[styles.row, isSelected && styles.rowActive]} onPress={() => toggleSelect(f.id)}>
									<View style={styles.avatar}>{f.avatar_url ? <Image source={{ uri: f.avatar_url }} style={styles.avatarImg} contentFit="cover" /> : <View style={[styles.avatarImg, { backgroundColor: Colors.secundaire }]} />}</View>
									<Text style={styles.name}>{f.display_name ?? "Anonymous"}</Text>
									<View style={[styles.checkbox, isSelected && styles.checkboxActive]}>{isSelected && <Check size={14} color={Colors.white} strokeWidth={3} />}</View>
								</Pressable>
							);
						})
					)}
				</ScrollView>

				{filtered.length > 0 && (
					<View style={styles.footer}>
						<Button label={saving ? "Adding..." : `Add to close friends (${selected.size})`} onPress={handleAdd} disabled={selected.size === 0 || saving} />
					</View>
				)}
			</SafeAreaView>
		</CosmicBackground>
	);
}

const styles = StyleSheet.create({
	header: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", paddingHorizontal: Spacing.lg, paddingTop: Spacing.sm, paddingBottom: Spacing.lg },
	backBtn: { width: 44, height: 44, borderRadius: 22, backgroundColor: Colors.white15, alignItems: "center", justifyContent: "center" },
	title: { fontFamily: Fonts.display, fontStyle: "italic", fontSize: 20, color: Colors.white, letterSpacing: 1 },
	subtitle: { fontFamily: Fonts.body, fontSize: 13, color: Colors.white70, paddingHorizontal: Spacing.lg, marginBottom: Spacing.md, lineHeight: 18 },
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
		marginBottom: Spacing.md,
	},
	searchInput: { flex: 1, fontFamily: Fonts.body, fontSize: 14, color: Colors.white, height: "100%", padding: 0 },
	row: { flexDirection: "row", alignItems: "center", gap: 12, marginHorizontal: Spacing.lg, padding: 10, backgroundColor: Colors.white08, borderRadius: Radius.lg, marginBottom: 8, borderWidth: 1, borderColor: Colors.white15 },
	rowActive: { backgroundColor: "rgba(91, 88, 235, 0.18)", borderColor: Colors.secundaire },
	avatar: { width: 44, height: 44, borderRadius: 22, overflow: "hidden" },
	avatarImg: { width: "100%", height: "100%" },
	name: { flex: 1, fontFamily: Fonts.bodyBold, fontSize: 14, fontWeight: "700", color: Colors.white },
	checkbox: { width: 26, height: 26, borderRadius: 13, borderWidth: 2, borderColor: Colors.white30, alignItems: "center", justifyContent: "center" },
	checkboxActive: { backgroundColor: Colors.secundaire, borderColor: Colors.secundaire },
	footer: { paddingHorizontal: Spacing.lg, paddingVertical: Spacing.base, borderTopWidth: 1, borderTopColor: Colors.white15 },
	muted: { color: Colors.white70, fontFamily: Fonts.body, fontSize: 14, textAlign: "center", paddingVertical: Spacing.xl, paddingHorizontal: Spacing.lg },
});
