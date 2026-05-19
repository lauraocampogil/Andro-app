import { CosmicBackground } from "@/components/CosmicBackground";
import { Colors, Fonts, Radius, Spacing } from "@/constants/theme";
import { useAuth } from "@/lib/auth";
import { ChallengeDetail, fetchChallengeDetail } from "@/lib/challengeDetail";
import { ChallengeMessage, fetchMessages, sendMessage, subscribeToMessages } from "@/lib/challengeMessages";
import { daysLeft } from "@/lib/challenges";
import { Image } from "expo-image";
import { useFocusEffect, useLocalSearchParams, useRouter } from "expo-router";
import { ChevronRight, Send, Trophy, X } from "lucide-react-native";
import React, { useCallback, useEffect, useRef, useState } from "react";
import { FlatList, KeyboardAvoidingView, Platform, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

export default function ChallengeDetailScreen() {
	const router = useRouter();
	const { id } = useLocalSearchParams<{ id: string }>();
	const { session } = useAuth();
	const userId = session?.user?.id;

	const [detail, setDetail] = useState<ChallengeDetail | null>(null);
	const [messages, setMessages] = useState<ChallengeMessage[]>([]);
	const [input, setInput] = useState("");
	const [tab, setTab] = useState<"info" | "chat">("info");
	const listRef = useRef<FlatList<ChallengeMessage>>(null);

	useFocusEffect(
		useCallback(() => {
			if (!id) return;
			let cancelled = false;
			(async () => {
				const [d, m] = await Promise.all([fetchChallengeDetail(id), fetchMessages(id)]);
				if (!cancelled) {
					setDetail(d);
					setMessages(m);
				}
			})();
			return () => {
				cancelled = true;
			};
		}, [id]),
	);

	useEffect(() => {
		if (!id) return;
		const unsub = subscribeToMessages(id, (msg) => {
			setMessages((prev) => (prev.some((m) => m.id === msg.id) ? prev : [...prev, msg]));
			setTimeout(() => listRef.current?.scrollToEnd({ animated: true }), 100);
		});
		return unsub;
	}, [id]);

	const handleSend = async () => {
		if (!userId || !id || !input.trim()) return;
		const content = input.trim();
		setInput("");
		await sendMessage(id, userId, content);
	};

	const formatDate = (iso?: string | null) => (iso ? new Date(iso).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" }) : "—");

	if (!detail) {
		return (
			<CosmicBackground>
				<SafeAreaView style={{ flex: 1, alignItems: "center", justifyContent: "center" }}>
					<Text style={{ color: Colors.white, fontFamily: Fonts.body }}>Loading...</Text>
				</SafeAreaView>
			</CosmicBackground>
		);
	}

	return (
		<CosmicBackground>
			<SafeAreaView edges={["top"]} style={{ flex: 1 }}>
				<View style={styles.header}>
					<Pressable style={styles.backBtn} onPress={() => router.back()}>
						<X size={22} color={Colors.white} strokeWidth={2.4} />
					</Pressable>
					<Text style={styles.headerTitle} numberOfLines={1}>
						{detail.title}
					</Text>
					<View style={{ width: 44 }} />
				</View>

				{/* Tab switcher */}
				<View style={styles.tabs}>
					<Pressable style={[styles.tab, tab === "info" && styles.tabActive]} onPress={() => setTab("info")}>
						<Text style={[styles.tabText, tab === "info" && styles.tabTextActive]}>Info</Text>
					</Pressable>
					<Pressable style={[styles.tab, tab === "chat" && styles.tabActive]} onPress={() => setTab("chat")}>
						<Text style={[styles.tabText, tab === "chat" && styles.tabTextActive]}>Chat ({messages.length})</Text>
					</Pressable>
				</View>

				{tab === "info" ? (
					<ScrollView style={{ flex: 1 }} contentContainerStyle={{ paddingBottom: 120 }} showsVerticalScrollIndicator={false}>
						{/* Race card for marathon_battle */}
						{detail.race && (
							<Pressable style={styles.raceCard} onPress={() => router.push(`/race/${detail.race!.id}` as any)}>
								<View style={{ flex: 1 }}>
									<Text style={styles.raceCardLabel}>RACE</Text>
									<Text style={styles.raceCardName}>{detail.race.name}</Text>
									<Text style={styles.raceCardMeta}>
										{detail.race.city}, {detail.race.country} · {formatDate(detail.race.race_date)}
									</Text>
								</View>
								<ChevronRight size={20} color={Colors.white70} strokeWidth={2.2} />
							</Pressable>
						)}

						{/* Dates */}
						<View style={styles.infoBox}>
							<View style={styles.infoRow}>
								<Text style={styles.infoLabel}>Type</Text>
								<Text style={styles.infoValue}>{labelForType(detail.type)}</Text>
							</View>
							<View style={styles.infoRow}>
								<Text style={styles.infoLabel}>Deadline</Text>
								<Text style={styles.infoValue}>{daysLeft(detail.deadline)}</Text>
							</View>
							{detail.deadline && (
								<View style={styles.infoRow}>
									<Text style={styles.infoLabel}>Ends</Text>
									<Text style={styles.infoValue}>{formatDate(detail.deadline)}</Text>
								</View>
							)}
							{detail.continent && (
								<View style={styles.infoRow}>
									<Text style={styles.infoLabel}>Continent</Text>
									<Text style={styles.infoValue}>{detail.continent}</Text>
								</View>
							)}
							{detail.distance_km && (
								<View style={styles.infoRow}>
									<Text style={styles.infoLabel}>Distance</Text>
									<Text style={styles.infoValue}>{detail.distance_km} km</Text>
								</View>
							)}
						</View>

						{/* Leaderboard */}
						<Text style={styles.sectionTitle}>LEADERBOARD</Text>
						<View style={styles.leaderboard}>
							{detail.participants.map((p, idx) => (
								<Pressable key={p.id} style={styles.leaderboardRow} onPress={() => router.push(`/user/${p.id}` as any)}>
									<View style={styles.rankWrap}>{idx === 0 ? <Trophy size={18} color="#FFD15C" fill="#FFD15C" strokeWidth={2} /> : <Text style={styles.rankNum}>{idx + 1}</Text>}</View>
									<View style={styles.leaderAvatar}>{p.avatar_url ? <Image source={{ uri: p.avatar_url }} style={styles.leaderAvatarImg} contentFit="cover" /> : <View style={[styles.leaderAvatarImg, { backgroundColor: Colors.secundaire }]} />}</View>
									<View style={{ flex: 1 }}>
										<Text style={styles.leaderName}>{p.display_name}</Text>
										<View style={styles.progressBar}>
											<View style={[styles.progressFill, { width: `${Math.min(100, p.progress * 100)}%` }]} />
										</View>
									</View>
									{p.completed && <Text style={styles.completedBadge}>✓</Text>}
								</Pressable>
							))}
						</View>
					</ScrollView>
				) : (
					<KeyboardAvoidingView behavior={Platform.OS === "ios" ? "padding" : undefined} style={{ flex: 1 }} keyboardVerticalOffset={Platform.OS === "ios" ? 0 : 80}>
						<FlatList
							ref={listRef}
							data={messages}
							keyExtractor={(m) => m.id}
							contentContainerStyle={{ padding: Spacing.lg, paddingBottom: 20 }}
							onContentSizeChange={() => listRef.current?.scrollToEnd({ animated: false })}
							renderItem={({ item }) => {
								const isMe = item.user_id === userId;
								return (
									<View style={[styles.msgWrap, isMe && styles.msgWrapMe]}>
										{!isMe && (
											<View style={styles.msgAvatar}>
												{item.user?.avatar_url ? <Image source={{ uri: item.user.avatar_url }} style={styles.msgAvatarImg} contentFit="cover" /> : <View style={[styles.msgAvatarImg, { backgroundColor: Colors.secundaire }]} />}
											</View>
										)}
										<View style={[styles.msgBubble, isMe && styles.msgBubbleMe]}>
											{!isMe && <Text style={styles.msgUserName}>{item.user?.display_name ?? "Someone"}</Text>}
											<Text style={[styles.msgContent, isMe && styles.msgContentMe]}>{item.content}</Text>
										</View>
									</View>
								);
							}}
							ListEmptyComponent={<Text style={styles.muted}>No messages yet. Say hi!</Text>}
						/>

						<View style={styles.inputRow}>
							<TextInput value={input} onChangeText={setInput} placeholder="Message..." placeholderTextColor={Colors.white50} style={styles.input} />
							<Pressable style={[styles.sendBtn, !input.trim() && { opacity: 0.4 }]} onPress={handleSend} disabled={!input.trim()}>
								<Send size={18} color={Colors.white} strokeWidth={2.4} />
							</Pressable>
						</View>
					</KeyboardAvoidingView>
				)}
			</SafeAreaView>
		</CosmicBackground>
	);
}

function labelForType(t: string): string {
	const map: Record<string, string> = {
		marathon_battle: "Marathon Battle",
		color_continent: "Color a Continent",
		yearly_races: "Yearly Races",
		territory: "Territory Battle",
	};
	return map[t] ?? t;
}

const styles = StyleSheet.create({
	header: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", paddingHorizontal: Spacing.lg, paddingTop: Spacing.sm, paddingBottom: Spacing.base, gap: Spacing.base },
	backBtn: { width: 44, height: 44, borderRadius: 22, backgroundColor: Colors.white15, alignItems: "center", justifyContent: "center" },
	headerTitle: { flex: 1, fontFamily: Fonts.display, fontStyle: "italic", fontSize: 18, color: Colors.white, textAlign: "center" },

	tabs: { flexDirection: "row", alignSelf: "center", backgroundColor: Colors.white15, borderRadius: Radius.pill, padding: 4, marginBottom: Spacing.base },
	tab: { paddingHorizontal: 24, paddingVertical: 8, borderRadius: Radius.pill },
	tabActive: { backgroundColor: Colors.white },
	tabText: { fontFamily: Fonts.bodyBold, fontSize: 13, fontWeight: "700", color: Colors.white },
	tabTextActive: { color: Colors.ink },

	raceCard: { flexDirection: "row", alignItems: "center", marginHorizontal: Spacing.lg, padding: Spacing.base, backgroundColor: Colors.white, borderRadius: Radius.lg, marginBottom: Spacing.base, gap: 8 },
	raceCardLabel: { fontFamily: Fonts.bodyBold, fontSize: 10, fontWeight: "800", color: Colors.secundaire, letterSpacing: 1.5 },
	raceCardName: { fontFamily: Fonts.bodyBold, fontSize: 16, fontWeight: "800", color: Colors.ink, marginTop: 2 },
	raceCardMeta: { fontFamily: Fonts.body, fontSize: 12, color: Colors.ink70, marginTop: 2 },

	infoBox: { marginHorizontal: Spacing.lg, backgroundColor: Colors.white08, borderRadius: Radius.lg, paddingHorizontal: 14, marginBottom: Spacing.lg },
	infoRow: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", paddingVertical: 10, borderBottomWidth: 1, borderBottomColor: Colors.white15 },
	infoLabel: { fontFamily: Fonts.body, fontSize: 13, color: Colors.white70 },
	infoValue: { fontFamily: Fonts.bodyBold, fontSize: 13, fontWeight: "700", color: Colors.white },

	sectionTitle: { fontFamily: Fonts.bodyBold, fontSize: 12, fontWeight: "800", color: Colors.white70, letterSpacing: 1.5, paddingHorizontal: Spacing.lg, marginBottom: 10 },

	leaderboard: { marginHorizontal: Spacing.lg, gap: 8 },
	leaderboardRow: { flexDirection: "row", alignItems: "center", gap: 10, backgroundColor: Colors.white08, borderRadius: Radius.lg, padding: 10 },
	rankWrap: { width: 28, alignItems: "center" },
	rankNum: { fontFamily: Fonts.bodyBold, fontSize: 14, fontWeight: "800", color: Colors.white70 },
	leaderAvatar: { width: 36, height: 36, borderRadius: 18, overflow: "hidden" },
	leaderAvatarImg: { width: "100%", height: "100%" },
	leaderName: { fontFamily: Fonts.bodyBold, fontSize: 13, fontWeight: "700", color: Colors.white, marginBottom: 4 },
	progressBar: { height: 6, borderRadius: 3, backgroundColor: Colors.white15, overflow: "hidden" },
	progressFill: { height: "100%", backgroundColor: Colors.secundaire },
	completedBadge: { fontFamily: Fonts.bodyBold, fontSize: 18, color: "#22C55E" },

	msgWrap: { flexDirection: "row", alignItems: "flex-end", gap: 8, marginBottom: 10 },
	msgWrapMe: { justifyContent: "flex-end" },
	msgAvatar: { width: 32, height: 32, borderRadius: 16, overflow: "hidden" },
	msgAvatarImg: { width: "100%", height: "100%" },
	msgBubble: { maxWidth: "75%", padding: 10, borderRadius: 14, backgroundColor: Colors.white08, borderTopLeftRadius: 4 },
	msgBubbleMe: { backgroundColor: Colors.secundaire, borderTopLeftRadius: 14, borderTopRightRadius: 4 },
	msgUserName: { fontFamily: Fonts.bodyBold, fontSize: 11, fontWeight: "800", color: Colors.violetLight, marginBottom: 4 },
	msgContent: { fontFamily: Fonts.body, fontSize: 14, color: Colors.white },
	msgContentMe: { color: Colors.white },

	inputRow: { flexDirection: "row", alignItems: "center", gap: 8, padding: Spacing.lg, paddingTop: Spacing.sm, borderTopWidth: 1, borderTopColor: Colors.white15 },
	input: { flex: 1, height: 44, paddingHorizontal: 16, borderRadius: Radius.pill, backgroundColor: Colors.white08, borderWidth: 1, borderColor: Colors.white15, color: Colors.white, fontFamily: Fonts.body, fontSize: 14 },
	sendBtn: { width: 44, height: 44, borderRadius: 22, backgroundColor: Colors.secundaire, alignItems: "center", justifyContent: "center" },

	muted: { color: Colors.white70, fontFamily: Fonts.body, fontSize: 14, textAlign: "center", paddingVertical: Spacing.xxl },
});
