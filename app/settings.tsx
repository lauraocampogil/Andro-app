import { CosmicBackground } from "@/components/CosmicBackground";
import { Colors, Fonts, Radius, Spacing } from "@/constants/theme";
import { useAuth } from "@/lib/auth";
import { getCloseFriendProfiles, removeCloseFriend } from "@/lib/closeFriends";
import { ChallengeVisibility, getUserSettings, updateChallengeVisibility, updateSetting, UserSettings } from "@/lib/settings";
import { Image } from "expo-image";
import { useFocusEffect, useRouter } from "expo-router";
import { Bell, Check, ChevronRight, Globe, LogOut, MapPin, UserPlus, Users, UserX, Volume2, X } from "lucide-react-native";
import React, { useCallback, useState } from "react";
import { Alert, Pressable, ScrollView, StyleSheet, Switch, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

const VISIBILITY_OPTIONS: { value: ChallengeVisibility; label: string; description: string; Icon: any }[] = [
	{ value: "everyone", label: "Everyone", description: "Anyone can see when you join a challenge", Icon: Globe },
	{ value: "friends", label: "Friends", description: "Only people you follow can see", Icon: Users },
	{ value: "close_friends", label: "Close Friends", description: "Only your close friends list", Icon: UserX },
];

const LOCATION_OPTIONS: { value: "precise" | "city" | "off"; label: string; description: string }[] = [
	{ value: "precise", label: "Precise", description: "Exact location (needed for Territory mode)" },
	{ value: "city", label: "City only", description: "Only show your city" },
	{ value: "off", label: "Off", description: "Don't share location" },
];

export default function Settings() {
	const router = useRouter();
	const { session, signOut } = useAuth();
	const userId = session?.user?.id;

	const [settings, setSettings] = useState<UserSettings | null>(null);
	const [closeFriends, setCloseFriends] = useState<any[]>([]);

	useFocusEffect(
		useCallback(() => {
			if (!userId) return;
			(async () => {
				const s = await getUserSettings(userId);
				setSettings(s);
				const cf = await getCloseFriendProfiles(userId);
				setCloseFriends(cf);
			})();
		}, [userId]),
	);

	if (!settings) {
		return (
			<CosmicBackground>
				<SafeAreaView style={{ flex: 1, alignItems: "center", justifyContent: "center" }}>
					<Text style={{ color: Colors.white, fontFamily: Fonts.body }}>Loading...</Text>
				</SafeAreaView>
			</CosmicBackground>
		);
	}

	const handleVisibility = async (v: ChallengeVisibility) => {
		if (!userId) return;
		setSettings({ ...settings, challenge_visibility: v });
		await updateChallengeVisibility(userId, v);
	};

	const handleToggle = async (key: keyof Omit<UserSettings, "challenge_visibility">, value: any) => {
		if (!userId) return;
		setSettings({ ...settings, [key]: value });
		await updateSetting(userId, key, value);
	};

	const handleRemoveCloseFriend = async (friendId: string) => {
		if (!userId) return;
		await removeCloseFriend(userId, friendId);
		setCloseFriends((prev) => prev.filter((f) => f.id !== friendId));
	};

	const handleSignOut = () => {
		Alert.alert("Sign out", "Are you sure you want to sign out?", [
			{ text: "Cancel", style: "cancel" },
			{
				text: "Sign out",
				style: "destructive",
				onPress: async () => {
					await signOut();
					router.replace("/(auth)/welcome" as any);
				},
			},
		]);
	};

	const handleSwitchAccount = () => {
		Alert.alert("Switch account", "Sign out of current account and sign in with another?", [
			{ text: "Cancel", style: "cancel" },
			{
				text: "Continue",
				onPress: async () => {
					await signOut();
					router.replace("/(auth)/sign-in" as any);
				},
			},
		]);
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
					{/* Account */}
					<Text style={styles.sectionTitle}>ACCOUNT</Text>
					<View style={styles.box}>
						<Pressable style={styles.row} onPress={handleSwitchAccount}>
							<View style={[styles.rowIcon, { backgroundColor: Colors.secundaire }]}>
								<UserPlus size={18} color={Colors.white} strokeWidth={2.4} />
							</View>
							<View style={{ flex: 1 }}>
								<Text style={styles.rowLabel}>Switch account</Text>
								<Text style={styles.rowSub}>{session?.user?.email}</Text>
							</View>
							<ChevronRight size={18} color={Colors.white50} strokeWidth={2.2} />
						</Pressable>
					</View>

					{/* Notifications */}
					<Text style={styles.sectionTitle}>NOTIFICATIONS</Text>
					<View style={styles.box}>
						<View style={styles.row}>
							<View style={[styles.rowIcon, { backgroundColor: Colors.secundaire }]}>
								<Bell size={18} color={Colors.white} strokeWidth={2.4} />
							</View>
							<View style={{ flex: 1 }}>
								<Text style={styles.rowLabel}>Push notifications</Text>
								<Text style={styles.rowSub}>Receive challenge invites, follows, etc.</Text>
							</View>
							<Switch value={settings.notifications_enabled} onValueChange={(v) => handleToggle("notifications_enabled", v)} trackColor={{ false: Colors.white15, true: Colors.secundaire }} thumbColor={Colors.white} />
						</View>

						<View style={[styles.row, !settings.notifications_enabled && { opacity: 0.4 }]}>
							<View style={[styles.rowIcon, { backgroundColor: Colors.secundaire }]}>
								<Volume2 size={18} color={Colors.white} strokeWidth={2.4} />
							</View>
							<View style={{ flex: 1 }}>
								<Text style={styles.rowLabel}>Sound</Text>
								<Text style={styles.rowSub}>Play sound on new notifications</Text>
							</View>
							<Switch
								value={settings.notification_sound}
								onValueChange={(v) => handleToggle("notification_sound", v)}
								disabled={!settings.notifications_enabled}
								trackColor={{ false: Colors.white15, true: Colors.secundaire }}
								thumbColor={Colors.white}
							/>
						</View>
					</View>

					{/* Location */}
					<Text style={styles.sectionTitle}>LOCATION</Text>
					<View style={styles.box}>
						<View style={styles.row}>
							<View style={[styles.rowIcon, { backgroundColor: Colors.secundaire }]}>
								<MapPin size={18} color={Colors.white} strokeWidth={2.4} />
							</View>
							<View style={{ flex: 1 }}>
								<Text style={styles.rowLabel}>Share location</Text>
								<Text style={styles.rowSub}>Used for nearby races and Territory mode</Text>
							</View>
							<Switch value={settings.location_enabled} onValueChange={(v) => handleToggle("location_enabled", v)} trackColor={{ false: Colors.white15, true: Colors.secundaire }} thumbColor={Colors.white} />
						</View>
					</View>

					{settings.location_enabled && (
						<>
							<Text style={styles.sectionSubTitle}>Location precision</Text>
							<View style={styles.box}>
								{LOCATION_OPTIONS.map((opt) => {
									const active = settings.location_precision === opt.value;
									return (
										<Pressable key={opt.value} style={styles.optionRow} onPress={() => handleToggle("location_precision", opt.value)}>
											<View style={{ flex: 1 }}>
												<Text style={styles.rowLabel}>{opt.label}</Text>
												<Text style={styles.rowSub}>{opt.description}</Text>
											</View>
											{active && <Check size={20} color={Colors.secundaire} strokeWidth={2.6} />}
										</Pressable>
									);
								})}
							</View>
						</>
					)}

					{/* Challenge visibility */}
					<Text style={styles.sectionTitle}>CHALLENGE VISIBILITY</Text>
					<Text style={styles.sectionDesc}>Who can see when you join a challenge?</Text>
					<View style={styles.box}>
						{VISIBILITY_OPTIONS.map((opt) => {
							const active = settings.challenge_visibility === opt.value;
							return (
								<Pressable key={opt.value} style={styles.optionRow} onPress={() => handleVisibility(opt.value)}>
									<View style={[styles.rowIcon, { backgroundColor: active ? Colors.secundaire : Colors.white15 }]}>
										<opt.Icon size={18} color={Colors.white} strokeWidth={2.2} />
									</View>
									<View style={{ flex: 1 }}>
										<Text style={styles.rowLabel}>{opt.label}</Text>
										<Text style={styles.rowSub}>{opt.description}</Text>
									</View>
									{active && <Check size={20} color={Colors.secundaire} strokeWidth={2.6} />}
								</Pressable>
							);
						})}
					</View>

					{/* Close friends */}
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
						<View style={[styles.box, { gap: 0 }]}>
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

					{/* Sign out */}
					<View style={{ marginTop: Spacing.xl }}>
						<Pressable style={styles.signOutBtn} onPress={handleSignOut}>
							<LogOut size={18} color="#FF5757" strokeWidth={2.4} />
							<Text style={styles.signOutText}>Sign out</Text>
						</Pressable>
					</View>

					<Text style={styles.version}>Andro v0.3.0 · MVP3</Text>
				</ScrollView>
			</SafeAreaView>
		</CosmicBackground>
	);
}

const styles = StyleSheet.create({
	header: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", paddingHorizontal: Spacing.lg, paddingTop: Spacing.sm, paddingBottom: Spacing.lg },
	backBtn: { width: 44, height: 44, borderRadius: 22, backgroundColor: Colors.white15, alignItems: "center", justifyContent: "center" },
	title: { fontFamily: Fonts.display, fontStyle: "italic", fontSize: 22, color: Colors.white, letterSpacing: 1 },

	sectionTitle: { fontFamily: Fonts.bodyBold, fontSize: 12, fontWeight: "800", color: Colors.white70, letterSpacing: 2, paddingHorizontal: Spacing.lg, marginTop: Spacing.lg, marginBottom: 8 },
	sectionSubTitle: { fontFamily: Fonts.body, fontSize: 12, color: Colors.white50, paddingHorizontal: Spacing.lg, marginTop: Spacing.sm, marginBottom: 6, letterSpacing: 0.5 },
	sectionDesc: { fontFamily: Fonts.body, fontSize: 13, color: Colors.white70, paddingHorizontal: Spacing.lg, marginBottom: Spacing.sm },

	box: { marginHorizontal: Spacing.lg, backgroundColor: Colors.white08, borderRadius: Radius.lg, borderWidth: 1, borderColor: Colors.white15, paddingHorizontal: 14, overflow: "hidden" },
	row: { flexDirection: "row", alignItems: "center", gap: 12, paddingVertical: 14, borderBottomWidth: 1, borderBottomColor: Colors.white15 },
	optionRow: { flexDirection: "row", alignItems: "center", gap: 12, paddingVertical: 14, borderBottomWidth: 1, borderBottomColor: Colors.white15 },
	rowIcon: { width: 36, height: 36, borderRadius: 18, alignItems: "center", justifyContent: "center" },
	rowLabel: { fontFamily: Fonts.bodyBold, fontSize: 14, fontWeight: "700", color: Colors.white },
	rowSub: { fontFamily: Fonts.body, fontSize: 12, color: Colors.white70, marginTop: 2 },

	cfHeader: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginTop: Spacing.lg },
	addCfBtn: { flexDirection: "row", alignItems: "center", paddingRight: Spacing.lg, gap: 4, marginBottom: 8 },
	addCfText: { fontFamily: Fonts.bodyBold, fontSize: 13, color: Colors.white70 },

	empty: { fontFamily: Fonts.body, fontSize: 13, color: Colors.white50, paddingHorizontal: Spacing.lg, textAlign: "center", paddingVertical: Spacing.lg },

	cfItem: { flexDirection: "row", alignItems: "center", gap: 12, paddingVertical: 10, borderBottomWidth: 1, borderBottomColor: Colors.white15 },
	cfAvatar: { width: 40, height: 40, borderRadius: 20, overflow: "hidden" },
	cfAvatarImg: { width: "100%", height: "100%" },
	cfName: { flex: 1, fontFamily: Fonts.bodyBold, fontSize: 14, fontWeight: "700", color: Colors.white },
	cfRemove: { width: 32, height: 32, borderRadius: 16, backgroundColor: Colors.white15, alignItems: "center", justifyContent: "center" },

	signOutBtn: {
		flexDirection: "row",
		alignItems: "center",
		justifyContent: "center",
		gap: 8,
		marginHorizontal: Spacing.lg,
		paddingVertical: 14,
		borderRadius: Radius.lg,
		backgroundColor: "rgba(255, 87, 87, 0.12)",
		borderWidth: 1,
		borderColor: "#FF5757",
	},
	signOutText: { fontFamily: Fonts.bodyBold, fontSize: 15, fontWeight: "800", color: "#FF5757" },

	version: { fontFamily: Fonts.body, fontSize: 11, color: Colors.white50, textAlign: "center", marginTop: Spacing.xl },
});
