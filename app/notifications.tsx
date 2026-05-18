import { CosmicBackground } from "@/components/CosmicBackground";
import { Colors, Fonts, Radius, Spacing } from "@/constants/theme";
import { useAuth } from "@/lib/auth";
import { fetchNotifications, markAsRead, Notification, respondToInvitation } from "@/lib/notifications";
import { Image } from "expo-image";
import { useFocusEffect, useRouter } from "expo-router";
import { Check, X } from "lucide-react-native";
import React, { useCallback, useState } from "react";
import { Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { supabase } from "@/lib/supabase";

function timeAgo(iso: string): string {
	const diff = Date.now() - new Date(iso).getTime();
	const minutes = Math.floor(diff / 60000);
	const hours = Math.floor(minutes / 60);
	const days = Math.floor(hours / 24);
	if (days > 0) return `${days}d`;
	if (hours > 0) return `${hours}h`;
	if (minutes > 0) return `${minutes}m`;
	return "now";
}

export default function Notifications() {
	const router = useRouter();
	const { session } = useAuth();
	const userId = session?.user?.id;

	const [notifs, setNotifs] = useState<Notification[]>([]);
	const [loading, setLoading] = useState(true);

	useFocusEffect(
		useCallback(() => {
			if (!userId) return;
			let cancelled = false;
			(async () => {
				const n = await fetchNotifications(userId);
				if (!cancelled) {
					setNotifs(n);
					setLoading(false);
					n.filter((x) => !x.read).forEach((x) => markAsRead(x.id));
				}
			})();
			return () => {
				cancelled = true;
			};
		}, [userId]),
	);

	const handleResponse = async (n: Notification, status: "accepted" | "declined") => {
		if (!n.invitation_id) return;
		await respondToInvitation(n.invitation_id, status);
		setNotifs((prev) => prev.filter((x) => x.id !== n.id));

		// If accepted a marathon battle, redirect to the race
		if (status === "accepted" && n.challenge?.id) {
			const { data: ch } = await supabase.from("challenges").select("type, race_id").eq("id", n.challenge.id).maybeSingle();
			if (ch?.type === "marathon_battle" && ch?.race_id) {
				router.push(`/race/${ch.race_id}` as any);
			}
		}
	};

	return (
		<CosmicBackground>
			<SafeAreaView edges={["top"]} style={{ flex: 1 }}>
				<View style={styles.header}>
					<Pressable style={styles.backBtn} onPress={() => router.back()}>
						<X size={22} color={Colors.white} strokeWidth={2.4} />
					</Pressable>
					<Text style={styles.title}>NOTIFICATIONS</Text>
					<View style={{ width: 44 }} />
				</View>

				<ScrollView style={{ flex: 1 }} contentContainerStyle={{ paddingBottom: 120 }}>
					{loading ? (
						<Text style={styles.muted}>Loading...</Text>
					) : notifs.length === 0 ? (
						<Text style={styles.muted}>No notifications yet.</Text>
					) : (
						notifs.map((n) => (
							<View key={n.id} style={[styles.card, !n.read && styles.cardUnread]}>
								<Pressable style={styles.cardTop} onPress={() => n.from_user && router.push(`/user/${n.from_user.id}` as any)}>
									<View style={styles.avatar}>
										{n.from_user?.avatar_url ? <Image source={{ uri: n.from_user.avatar_url }} style={styles.avatarImg} contentFit="cover" /> : <View style={[styles.avatarImg, { backgroundColor: Colors.secundaire }]} />}
									</View>
									<View style={{ flex: 1 }}>
										<Text style={styles.cardText}>
											<Text style={styles.cardName}>{n.from_user?.display_name ?? "Someone"}</Text>
											{n.type === "challenge_invite" && ` invited you to "${n.challenge?.title ?? "a challenge"}"`}
											{n.type === "challenge_accepted" && ` accepted your challenge "${n.challenge?.title ?? ""}"`}
											{n.type === "challenge_declined" && ` declined your challenge "${n.challenge?.title ?? ""}"`}
											{n.type === "new_follower" && ` started following you`}
											{n.type === "race_reminder" && ` race is coming up soon`}
										</Text>
										<Text style={styles.cardTime}>{timeAgo(n.created_at)}</Text>
									</View>
								</Pressable>

								{n.type === "challenge_invite" && n.invitation_id && (
									<View style={styles.actions}>
										<Pressable style={[styles.actionBtn, styles.declineBtn]} onPress={() => handleResponse(n, "declined")}>
											<X size={16} color={Colors.white} strokeWidth={2.6} />
											<Text style={styles.actionText}>Decline</Text>
										</Pressable>
										<Pressable style={[styles.actionBtn, styles.acceptBtn]} onPress={() => handleResponse(n, "accepted")}>
											<Check size={16} color={Colors.white} strokeWidth={2.6} />
											<Text style={styles.actionText}>Accept</Text>
										</Pressable>
									</View>
								)}
							</View>
						))
					)}
				</ScrollView>
			</SafeAreaView>
		</CosmicBackground>
	);
}

const styles = StyleSheet.create({
	header: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", paddingHorizontal: Spacing.lg, paddingTop: Spacing.sm, paddingBottom: Spacing.lg },
	backBtn: { width: 44, height: 44, borderRadius: 22, backgroundColor: Colors.white15, alignItems: "center", justifyContent: "center" },
	title: { fontFamily: Fonts.display, fontStyle: "italic", fontSize: 22, color: Colors.white, letterSpacing: 1 },

	card: { marginHorizontal: Spacing.lg, marginBottom: Spacing.sm, padding: Spacing.base, backgroundColor: Colors.white08, borderRadius: Radius.lg },
	cardUnread: { backgroundColor: "rgba(91, 88, 235, 0.15)", borderWidth: 1, borderColor: Colors.secundaire },
	cardTop: { flexDirection: "row", gap: 12, alignItems: "center" },
	avatar: { width: 44, height: 44, borderRadius: 22, overflow: "hidden" },
	avatarImg: { width: "100%", height: "100%" },
	cardText: { fontFamily: Fonts.body, fontSize: 13, color: Colors.white },
	cardName: { fontFamily: Fonts.bodyBold, fontWeight: "800", color: Colors.white },
	cardTime: { fontFamily: Fonts.body, fontSize: 11, color: Colors.white50, marginTop: 4 },

	actions: { flexDirection: "row", gap: 8, marginTop: Spacing.base },
	actionBtn: { flex: 1, flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 6, paddingVertical: 10, borderRadius: Radius.pill },
	acceptBtn: { backgroundColor: Colors.secundaire },
	declineBtn: { backgroundColor: Colors.white15 },
	actionText: { fontFamily: Fonts.bodyBold, fontSize: 13, fontWeight: "800", color: Colors.white },

	muted: { color: Colors.white70, fontFamily: Fonts.body, fontSize: 14, textAlign: "center", paddingVertical: Spacing.xl },
});
