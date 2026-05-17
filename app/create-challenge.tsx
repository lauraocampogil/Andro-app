import { Button } from "@/components/Button";
import { CosmicBackground } from "@/components/CosmicBackground";
import { Colors, Fonts, Radius, Spacing } from "@/constants/theme";
import { useAuth } from "@/lib/auth";
import { createChallenge } from "@/lib/challenges";
import { fetchAllRaces, Race } from "@/lib/races";
import { getUserSettings } from "@/lib/settings";
import { supabase } from "@/lib/supabase";
import { Image } from "expo-image";
import { useRouter } from "expo-router";
import { Crown, Globe, Swords, Target, X } from "lucide-react-native";
import React, { useEffect, useState } from "react";
import { Alert, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

const TEMPLATES = [
	{ id: "1v1", type: "1v1_race", icon: Swords, title: "1v1 Race Battle", description: "Challenge a friend on a specific race", needsRace: true, needsFriends: true },
	{ id: "color", type: "collection", icon: Globe, title: "Color a Continent", description: "Unlock all cards of a continent", needsRace: false, needsFriends: false, presetTitle: "Color X Challenge" },
	{ id: "yearly", type: "collection", icon: Target, title: "X Races This Year", description: "Complete a target number of races", needsRace: false, needsFriends: false },
	{ id: "custom", type: "1v1_race", icon: Crown, title: "Custom", description: "Free title + description", needsRace: false, needsFriends: true },
] as const;

export default function CreateChallenge() {
	const router = useRouter();
	const { session } = useAuth();
	const userId = session?.user?.id;

	const [step, setStep] = useState<"template" | "details">("template");
	const [selectedTemplate, setSelectedTemplate] = useState<(typeof TEMPLATES)[number] | null>(null);
	const [title, setTitle] = useState("");
	const [description, setDescription] = useState("");
	const [selectedRaceId, setSelectedRaceId] = useState<string | null>(null);
	const [selectedFriendIds, setSelectedFriendIds] = useState<string[]>([]);
	const [races, setRaces] = useState<Race[]>([]);
	const [followings, setFollowings] = useState<any[]>([]);

	useEffect(() => {
		(async () => {
			const r = await fetchAllRaces();
			setRaces(r);
			if (userId) {
				const { data } = await supabase.from("follows").select("following_id, profile:profiles!following_id(id, display_name, avatar_url)").eq("follower_id", userId);
				setFollowings((data ?? []).map((d: any) => d.profile));
			}
		})();
	}, [userId]);

	const handleSelectTemplate = (t: (typeof TEMPLATES)[number]) => {
		setSelectedTemplate(t);
		setTitle(t.title);
		setStep("details");
	};

	const toggleFriend = (id: string) => {
		setSelectedFriendIds((prev) => (prev.includes(id) ? prev.filter((f) => f !== id) : [...prev, id]));
	};

	const handleCreate = async () => {
		if (!userId || !selectedTemplate || !title.trim()) return;
		const settings = await getUserSettings(userId);

		const challengeId = await createChallenge({
			created_by: userId,
			type: selectedTemplate.type,
			title: title.trim(),
			description: description.trim(),
			target: { race_id: selectedRaceId },
			visibility: settings.challenge_visibility,
			challenged_user_ids: selectedFriendIds,
		});

		if (challengeId) {
			Alert.alert("Challenge created!", "Your friends will see it in their feed.");
			router.back();
		} else {
			Alert.alert("Error", "Could not create challenge.");
		}
	};

	return (
		<CosmicBackground>
			<SafeAreaView edges={["top"]} style={{ flex: 1 }}>
				<View style={styles.header}>
					<Pressable style={styles.backBtn} onPress={() => router.back()}>
						<X size={22} color={Colors.white} strokeWidth={2.4} />
					</Pressable>
					<Text style={styles.title}>{step === "template" ? "NEW CHALLENGE" : selectedTemplate?.title}</Text>
					<View style={{ width: 44 }} />
				</View>

				<ScrollView style={{ flex: 1 }} contentContainerStyle={{ paddingBottom: 120 }} showsVerticalScrollIndicator={false}>
					{step === "template" ? (
						<View style={{ paddingHorizontal: Spacing.lg, gap: Spacing.sm }}>
							<Text style={styles.subtitle}>Pick a challenge type</Text>
							{TEMPLATES.map((t) => (
								<Pressable key={t.id} style={styles.template} onPress={() => handleSelectTemplate(t)}>
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
					) : (
						<View style={{ paddingHorizontal: Spacing.lg }}>
							<Text style={styles.label}>Title</Text>
							<TextInput style={styles.input} value={title} onChangeText={setTitle} placeholder="Challenge title" placeholderTextColor={Colors.white50} />

							<Text style={styles.label}>Description</Text>
							<TextInput style={[styles.input, { height: 80, textAlignVertical: "top" }]} value={description} onChangeText={setDescription} placeholder="Add a description..." placeholderTextColor={Colors.white50} multiline />

							{selectedTemplate?.needsRace && (
								<>
									<Text style={styles.label}>Race</Text>
									<ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 8, paddingVertical: 4 }}>
										{races.map((r) => (
											<Pressable key={r.id} style={[styles.racePill, selectedRaceId === r.id && styles.racePillActive]} onPress={() => setSelectedRaceId(r.id)}>
												<Text style={[styles.racePillText, selectedRaceId === r.id && { color: Colors.white }]}>{r.name}</Text>
											</Pressable>
										))}
									</ScrollView>
								</>
							)}

							{selectedTemplate?.needsFriends && (
								<>
									<Text style={[styles.label, { marginTop: Spacing.lg }]}>Challenge friends</Text>
									{followings.length === 0 ? (
										<Text style={styles.muted}>You don't follow anyone yet.</Text>
									) : (
										followings.map((f) => {
											const selected = selectedFriendIds.includes(f.id);
											return (
												<Pressable key={f.id} style={[styles.friendItem, selected && styles.friendItemActive]} onPress={() => toggleFriend(f.id)}>
													<View style={styles.friendAvatar}>
														{f.avatar_url ? <Image source={{ uri: f.avatar_url }} style={styles.friendAvatarImg} contentFit="cover" /> : <View style={[styles.friendAvatarImg, { backgroundColor: Colors.secundaire }]} />}
													</View>
													<Text style={styles.friendName}>{f.display_name}</Text>
													{selected && <Text style={styles.friendCheck}>✓</Text>}
												</Pressable>
											);
										})
									)}
								</>
							)}

							<View style={{ marginTop: Spacing.xl }}>
								<Button label="Create Challenge" onPress={handleCreate} disabled={!title.trim()} />
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
	title: { fontFamily: Fonts.display, fontStyle: "italic", fontSize: 18, color: Colors.white, letterSpacing: 1 },
	subtitle: { fontFamily: Fonts.body, fontSize: 14, color: Colors.white70, marginBottom: Spacing.md },

	template: { flexDirection: "row", alignItems: "center", gap: Spacing.base, padding: Spacing.base, backgroundColor: Colors.white08, borderRadius: Radius.lg, borderWidth: 1, borderColor: Colors.white15 },
	templateIcon: { width: 44, height: 44, borderRadius: 22, backgroundColor: Colors.secundaire, alignItems: "center", justifyContent: "center" },
	templateTitle: { fontFamily: Fonts.bodyBold, fontSize: 15, fontWeight: "800", color: Colors.white },
	templateDesc: { fontFamily: Fonts.body, fontSize: 12, color: Colors.white70, marginTop: 2 },

	label: { fontFamily: Fonts.bodyBold, fontSize: 12, fontWeight: "800", color: Colors.white70, letterSpacing: 1.5, marginTop: Spacing.lg, marginBottom: 8 },
	input: { backgroundColor: Colors.white08, borderRadius: Radius.md, borderWidth: 1, borderColor: Colors.white15, padding: 12, color: Colors.white, fontFamily: Fonts.body, fontSize: 15 },

	racePill: { paddingHorizontal: 14, paddingVertical: 8, borderRadius: Radius.pill, borderWidth: 1.5, borderColor: Colors.white30 },
	racePillActive: { backgroundColor: Colors.secundaire, borderColor: Colors.secundaire },
	racePillText: { fontFamily: Fonts.bodyBold, fontSize: 13, color: Colors.white70 },

	friendItem: { flexDirection: "row", alignItems: "center", gap: 12, padding: 10, backgroundColor: Colors.white08, borderRadius: Radius.lg, marginBottom: 6, borderWidth: 1, borderColor: Colors.white15 },
	friendItemActive: { borderColor: Colors.secundaire, backgroundColor: "rgba(91, 88, 235, 0.18)" },
	friendAvatar: { width: 36, height: 36, borderRadius: 18, overflow: "hidden" },
	friendAvatarImg: { width: "100%", height: "100%" },
	friendName: { flex: 1, fontFamily: Fonts.bodyBold, fontSize: 14, color: Colors.white },
	friendCheck: { fontFamily: Fonts.bodyBold, fontSize: 18, color: Colors.secundaire },

	muted: { fontFamily: Fonts.body, fontSize: 13, color: Colors.white70, textAlign: "center", paddingVertical: Spacing.base },
});
