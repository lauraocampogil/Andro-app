import { CosmicBackground } from "@/components/CosmicBackground";
import { Colors, Fonts, Radius, Spacing } from "@/constants/theme";
import { useAuth } from "@/lib/auth";
import { getCloseFriendProfiles, removeCloseFriend } from "@/lib/closeFriends";
import { ChallengeVisibility, getUserSettings, updateChallengeVisibility } from "@/lib/settings";
import { Image } from "expo-image";
import { useFocusEffect, useRouter } from "expo-router";
import { Check, ChevronRight, Globe, Users, UserX, X } from "lucide-react-native";
import React, { useCallback, useState } from "react";
import { Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

const OPTIONS: { value: ChallengeVisibility; label: string; description: string; Icon: any }[] = [
	{ value: "everyone", label: "Everyone", description: "Anyone can see when you join a challenge", Icon: Globe },
	{ value: "friends", label: "Friends", description: "Only people you follow can see", Icon: Users },
	{ value: "close_friends", label: "Close Friends", description: "Only your close friends list", Icon: UserX },
];

export default function Settings() {
	const router = useRouter();
	const { session } = useAuth();
	const userId = session?.user?.id;

	const [visibility, setVisibility] = useState<ChallengeVisibility>("everyone");
	const [closeFriends, setCloseFriends] = useState<any[]>([]);

	useFocusEffect(
		useCallback(() => {
			if (!userId) return;
			(async () => {
				const settings = await getUserSettings(userId);
				setVisibility(settings.challenge_visibility);
				const cf = await getCloseFriendProfiles(userId);
				setCloseFriends(cf);
			})();
		}, [userId]),
	);

	const handleSelect = async (v: ChallengeVisibility) => {
		if (!userId) return;
		setVisibility(v);
		await updateChallengeVisibility(userId, v);
	};

	const handleRemoveCloseFriend = async (friendId: string) => {
		if (!userId) return;
		await removeCloseFriend(userId, friendId);
		setCloseFriends((prev) => prev.filter((f) => f.id !== friendId));
	};

	return (
		<CosmicBackground>
			<SafeAreaView edges={["top"]} style={{ flex: 1 }}>
				<View style={styles.header}>
					<Pressable style={styles.backBtn} onPress={() => router.back()}>
						<X size={22} color={Colors.white} strokeWidth={2.4} />
					</Pressable>
					<Text style={styles.title}>SETTINGS</Text>
					<View style={{ width: 44 }} />
				</View>

				<ScrollView style={{ flex: 1 }} contentContainerStyle={{ paddingBottom: 120 }} showsVerticalScrollIndicator={false}>
					<Text style={styles.sectionTitle}>CHALLENGE VISIBILITY</Text>
					<Text style={styles.sectionDesc}>Who can see when you join a challenge?</Text>

					<View style={styles.optionsBox}>
						{OPTIONS.map((opt) => {
							const active = visibility === opt.value;
							return (
								<Pressable key={opt.value} style={[styles.option, active && styles.optionActive]} onPress={() => handleSelect(opt.value)}>
									<View style={styles.optionIcon}>
										<opt.Icon size={20} color={active ? Colors.white : Colors.ink} strokeWidth={2.2} />
									</View>
									<View style={{ flex: 1 }}>
										<Text style={[styles.optionLabel, active && { color: Colors.white }]}>{opt.label}</Text>
										<Text style={[styles.optionDesc, active && { color: Colors.white70 }]}>{opt.description}</Text>
									</View>
									{active && <Check size={20} color={Colors.white} strokeWidth={2.6} />}
								</Pressable>
							);
						})}
					</View>

					<View style={{ marginTop: Spacing.xl }}>
						<View style={styles.cfHeader}>
							<Text style={styles.sectionTitle}>CLOSE FRIENDS</Text>
							<Pressable style={styles.addCfBtn} onPress={() => router.push("/close-friends-edit" as any)}>
								<Text style={styles.addCfText}>Edit</Text>
								<ChevronRight size={16} color={Colors.white70} strokeWidth={2.2} />
							</Pressable>
						</View>

						{closeFriends.length === 0 ? (
							<Text style={styles.empty}>You haven't added close friends yet.</Text>
						) : (
							<View style={{ paddingHorizontal: Spacing.lg, gap: Spacing.sm }}>
								{closeFriends.map((f) => (
									<View key={f.id} style={styles.cfItem}>
										<View style={styles.cfAvatar}>{f.avatar_url ? <Image source={{ uri: f.avatar_url }} style={styles.cfAvatarImg} contentFit="cover" /> : <View style={[styles.cfAvatarImg, { backgroundColor: Colors.secundaire }]} />}</View>
										<Text style={styles.cfName}>{f.display_name}</Text>
										<Pressable style={styles.cfRemove} onPress={() => handleRemoveCloseFriend(f.id)}>
											<X size={16} color={Colors.white} strokeWidth={2.4} />
										</Pressable>
									</View>
								))}
							</View>
						)}
					</View>
				</ScrollView>
			</SafeAreaView>
		</CosmicBackground>
	);
}

const styles = StyleSheet.create({
	header: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", paddingHorizontal: Spacing.lg, paddingTop: Spacing.sm, paddingBottom: Spacing.lg },
	backBtn: { width: 44, height: 44, borderRadius: 22, backgroundColor: Colors.white15, alignItems: "center", justifyContent: "center" },
	title: { fontFamily: Fonts.display, fontStyle: "italic", fontSize: 22, color: Colors.white, letterSpacing: 1 },

	sectionTitle: { fontFamily: Fonts.bodyBold, fontSize: 12, fontWeight: "800", color: Colors.white70, letterSpacing: 2, paddingHorizontal: Spacing.lg, marginBottom: 6 },
	sectionDesc: { fontFamily: Fonts.body, fontSize: 13, color: Colors.white70, paddingHorizontal: Spacing.lg, marginBottom: Spacing.md },

	optionsBox: { marginHorizontal: Spacing.lg, gap: Spacing.sm },
	option: { flexDirection: "row", alignItems: "center", gap: Spacing.base, padding: Spacing.base, backgroundColor: Colors.white08, borderRadius: Radius.lg, borderWidth: 1, borderColor: Colors.white15 },
	optionActive: { backgroundColor: Colors.secundaire, borderColor: Colors.secundaire },
	optionIcon: { width: 40, height: 40, borderRadius: 20, backgroundColor: Colors.white, alignItems: "center", justifyContent: "center" },
	optionLabel: { fontFamily: Fonts.bodyBold, fontSize: 15, fontWeight: "800", color: Colors.white },
	optionDesc: { fontFamily: Fonts.body, fontSize: 12, color: Colors.white70, marginTop: 2 },

	cfHeader: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: Spacing.md },
	addCfBtn: { flexDirection: "row", alignItems: "center", paddingRight: Spacing.lg, gap: 4 },
	addCfText: { fontFamily: Fonts.bodyBold, fontSize: 13, color: Colors.white70 },

	empty: { fontFamily: Fonts.body, fontSize: 13, color: Colors.white50, paddingHorizontal: Spacing.lg, textAlign: "center", paddingVertical: Spacing.lg },

	cfItem: { flexDirection: "row", alignItems: "center", gap: 12, backgroundColor: Colors.white08, borderRadius: Radius.lg, padding: 10 },
	cfAvatar: { width: 40, height: 40, borderRadius: 20, overflow: "hidden" },
	cfAvatarImg: { width: "100%", height: "100%" },
	cfName: { flex: 1, fontFamily: Fonts.bodyBold, fontSize: 14, fontWeight: "700", color: Colors.white },
	cfRemove: { width: 32, height: 32, borderRadius: 16, backgroundColor: Colors.white15, alignItems: "center", justifyContent: "center" },
});
