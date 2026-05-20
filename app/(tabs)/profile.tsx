import { CosmicBackground } from "@/components/CosmicBackground";
import { HeaderButton } from "@/components/HeaderButton";
import { ScreenHeader } from "@/components/ScreenHeader";
import { Colors, Fonts, Radius, Spacing } from "@/constants/theme";
import { useAuth } from "@/lib/auth";
import { resolveCardImage } from "@/lib/cardAssets";
import { countUnreadMessages } from "@/lib/challengeMessages";
import { Challenge, daysLeft, fetchActiveChallenges, fetchChallengeParticipants } from "@/lib/challenges";
import { getFollowersCount, getFollowingCount } from "@/lib/follows";
import { fetchMuseumCards, getFeaturedCardId, MuseumCard, setFeaturedCard, unsetFeaturedCard } from "@/lib/museum";
import { supabase } from "@/lib/supabase";
import { Image } from "expo-image";
import { useFocusEffect, useRouter } from "expo-router";
import { Check, ChevronRight, ListFilter, Lock, Settings, Star, X } from "lucide-react-native";
import React, { useCallback, useMemo, useState } from "react";
import { Modal, Pressable, ScrollView, StyleSheet, Text, useWindowDimensions, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

const CONTINENTS = ["All", "Europe", "Asia", "Africa", "North America", "South America", "Oceania"];

export default function Profile() {
	const router = useRouter();
	const { session, signOut } = useAuth();
	const userId = session?.user?.id;
	const { width: SCREEN_W } = useWindowDimensions();

	const [profile, setProfile] = useState<{ display_name: string | null; avatar_url: string | null } | null>(null);
	const [cards, setCards] = useState<MuseumCard[]>([]);
	const [featuredId, setFeaturedId] = useState<string | null>(null);
	const [followers, setFollowers] = useState(0);
	const [following, setFollowing] = useState(0);
	const [challenges, setChallenges] = useState<Challenge[]>([]);
	const [continent, setContinent] = useState("All");
	const [loading, setLoading] = useState(true);

	const [filterModalOpen, setFilterModalOpen] = useState(false);
	const [visibleSections, setVisibleSections] = useState({
		featured: true,
		challenges: true,
		collection: true,
	});

	// Museum modal states
	const [lockedModal, setLockedModal] = useState<MuseumCard | null>(null);
	const [expandedCard, setExpandedCard] = useState<MuseumCard | null>(null);

	useFocusEffect(
		useCallback(() => {
			if (!userId) return;
			let cancelled = false;
			(async () => {
				setLoading(true);
				const [{ data: prof }, museum, fid, fr, fg, ch] = await Promise.all([
					supabase.from("profiles").select("display_name, avatar_url").eq("id", userId).maybeSingle(),
					fetchMuseumCards(userId),
					getFeaturedCardId(userId),
					getFollowersCount(userId),
					getFollowingCount(userId),
					fetchActiveChallenges(userId),
				]);
				console.log("[FOCUS] featured_card_id from DB:", fid);
				console.log("[FOCUS] userId:", userId);
				if (!cancelled) {
					setProfile(prof ?? null);
					setCards(museum);
					setFeaturedId(fid);
					setFollowers(fr);
					setFollowing(fg);
					setChallenges(ch);
					setLoading(false);
				}
			})();
			return () => {
				cancelled = true;
			};
		}, [userId]),
	);

	const filteredCards = useMemo(() => {
		if (continent === "All") return cards;
		return cards.filter((c) => c.race.continent === continent);
	}, [cards, continent]);

	const unlockedCount = cards.filter((c) => c.unlocked).length;
	const featuredCard = cards.find((c) => c.id === featuredId);
	const featuredImage = featuredCard ? resolveCardImage(featuredCard) : null;

	const cardWidth = (SCREEN_W - Spacing.lg * 2 - Spacing.sm) / 2;

	const handleCardPress = (card: MuseumCard) => {
		if (card.unlocked) {
			setExpandedCard(card);
		} else {
			setLockedModal(card);
		}
	};

	const isExpandedFeatured = expandedCard?.id === featuredId;

	const handleSetFeatured = async () => {
		if (!userId || !expandedCard) return;
		console.log("[FEATURED] before:", { isExpandedFeatured, cardId: expandedCard.id, userId });
		if (isExpandedFeatured) {
			const ok = await unsetFeaturedCard(userId);
			console.log("[FEATURED] unset result:", ok);
			if (ok) setFeaturedId(null);
		} else {
			const ok = await setFeaturedCard(userId, expandedCard.id);
			console.log("[FEATURED] set result:", ok);
			if (ok) setFeaturedId(expandedCard.id);
		}
	};

	const expandedImage = expandedCard ? resolveCardImage(expandedCard) : null;

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
						right={
							<HeaderButton variant="primary" onPress={() => setFilterModalOpen(true)}>
								<ListFilter size={20} color={Colors.white} strokeWidth={2} />
							</HeaderButton>
						}
					/>

					{/* Avatar + name + stats */}
					<View style={styles.profileTop}>
						<View style={styles.avatar}>{profile?.avatar_url ? <Image source={{ uri: profile.avatar_url }} style={styles.avatarImg} contentFit="cover" /> : <View style={[styles.avatarImg, { backgroundColor: Colors.secundaire }]} />}</View>
						<Text style={styles.name}>{profile?.display_name ?? "Runner"}</Text>

						<View style={styles.statsRow}>
							<View style={styles.statItem}>
								<Text style={styles.statNum}>{unlockedCount}</Text>
								<Text style={styles.statLabel}>Cards</Text>
							</View>
							<View style={styles.statDivider} />
							<View style={styles.statItem}>
								<Text style={styles.statNum}>{followers}</Text>
								<Text style={styles.statLabel}>Followers</Text>
							</View>
							<View style={styles.statDivider} />
							<View style={styles.statItem}>
								<Text style={styles.statNum}>{following}</Text>
								<Text style={styles.statLabel}>Following</Text>
							</View>
						</View>
					</View>

					{/* Featured card */}
					{visibleSections.featured && featuredCard && featuredImage && (
						<View style={styles.featuredSection}>
							<Text style={styles.sectionTitle}>FEATURED CARD</Text>
							<Pressable onPress={() => setExpandedCard(featuredCard)} style={styles.featuredCard}>
								<Image source={featuredImage} style={styles.featuredImage} contentFit="cover" />
								<View style={styles.featuredOverlay}>
									<Star size={16} color={Colors.white} fill={Colors.white} strokeWidth={2} />
								</View>
							</Pressable>
							<Text style={styles.featuredName}>{featuredCard.creature_name}</Text>
							<Text style={styles.featuredLocation}>
								{featuredCard.race.city}, {featuredCard.race.country}
							</Text>
						</View>
					)}

					{/* Active challenges */}
					{visibleSections.challenges && challenges.length > 0 && (
						<View style={styles.section}>
							<Text style={styles.sectionTitle}>ACTIVE CHALLENGES</Text>
							{challenges.map((c) => (
								<Pressable key={c.id} style={styles.challengeCard} onPress={() => router.push(`/challenge/${c.id}` as any)}>
									<View style={styles.challengeCardTop}>
										<View style={{ flex: 1 }}>
											<Text style={styles.challengeTitle}>{c.title}</Text>
											<Text style={styles.challengeMeta}>{daysLeft(c.deadline)}</Text>
										</View>
										<ChevronRight size={20} color={Colors.ink70} strokeWidth={2.2} />
									</View>
									{userId && <ChallengeRow challengeId={c.id} userId={userId} />}
									<View style={styles.progressBar}>
										<View style={[styles.progressFill, { width: `${Math.min(100, (c.user_progress ?? 0) * 100)}%` }]} />
									</View>
								</Pressable>
							))}
						</View>
					)}

					{/* Collection */}
					{visibleSections.collection && (
						<View style={styles.section}>
							<Text style={styles.sectionTitle}>MY COLLECTION</Text>

							<ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.pillsRow}>
								{CONTINENTS.map((c) => (
									<Pressable key={c} style={[styles.pill, continent === c && styles.pillActive]} onPress={() => setContinent(c)}>
										<Text style={[styles.pillText, continent === c && styles.pillTextActive]}>{c}</Text>
									</Pressable>
								))}
							</ScrollView>

							{loading ? (
								<Text style={styles.muted}>Loading...</Text>
							) : filteredCards.length === 0 ? (
								<Text style={styles.muted}>No cards in this continent yet.</Text>
							) : (
								<View style={styles.grid}>
									{filteredCards.map((card) => (
										<MuseumCardItem key={card.id} card={card} width={cardWidth} isFeatured={card.id === featuredId} onPress={() => handleCardPress(card)} />
									))}
								</View>
							)}
						</View>
					)}
				</ScrollView>
			</SafeAreaView>

			{/* Filter modal */}
			<Modal visible={filterModalOpen} transparent animationType="fade" onRequestClose={() => setFilterModalOpen(false)}>
				<Pressable style={styles.modalBackdrop} onPress={() => setFilterModalOpen(false)}>
					<Pressable style={styles.filterCard} onPress={(e) => e.stopPropagation()}>
						<View style={styles.filterHeader}>
							<Text style={styles.filterTitle}>SHOW SECTIONS</Text>
							<Pressable onPress={() => setFilterModalOpen(false)}>
								<X size={20} color={Colors.white} strokeWidth={2.4} />
							</Pressable>
						</View>

						<Pressable style={styles.filterRow} onPress={() => setVisibleSections((s) => ({ ...s, featured: !s.featured }))}>
							<Text style={styles.filterRowText}>Featured Card</Text>
							<View style={[styles.filterCheckbox, visibleSections.featured && styles.filterCheckboxActive]}>{visibleSections.featured && <Check size={14} color={Colors.white} strokeWidth={3} />}</View>
						</Pressable>

						<Pressable style={styles.filterRow} onPress={() => setVisibleSections((s) => ({ ...s, challenges: !s.challenges }))}>
							<Text style={styles.filterRowText}>Active Challenges</Text>
							<View style={[styles.filterCheckbox, visibleSections.challenges && styles.filterCheckboxActive]}>{visibleSections.challenges && <Check size={14} color={Colors.white} strokeWidth={3} />}</View>
						</Pressable>

						<Pressable style={styles.filterRow} onPress={() => setVisibleSections((s) => ({ ...s, collection: !s.collection }))}>
							<Text style={styles.filterRowText}>My Collection</Text>
							<View style={[styles.filterCheckbox, visibleSections.collection && styles.filterCheckboxActive]}>{visibleSections.collection && <Check size={14} color={Colors.white} strokeWidth={3} />}</View>
						</Pressable>

						<View style={styles.filterFooter}>
							<Pressable style={styles.filterReset} onPress={() => setVisibleSections({ featured: true, challenges: true, collection: true })}>
								<Text style={styles.filterResetText}>Reset</Text>
							</Pressable>
							<Pressable style={styles.filterApply} onPress={() => setFilterModalOpen(false)}>
								<Text style={styles.filterApplyText}>Done</Text>
							</Pressable>
						</View>
					</Pressable>
				</Pressable>
			</Modal>

			{/* Locked card modal */}
			<Modal visible={lockedModal !== null} transparent animationType="fade" onRequestClose={() => setLockedModal(null)}>
				<Pressable style={styles.modalBackdrop} onPress={() => setLockedModal(null)}>
					<View style={styles.modalCard}>
						<View style={styles.modalLockIcon}>
							<Lock size={36} color={Colors.white} strokeWidth={2.4} />
						</View>
						<Text style={styles.modalTitle}>STILL LOCKED</Text>
						<Text style={styles.modalRaceName}>{lockedModal?.creature_name}</Text>
						<Text style={styles.modalRaceLocation}>
							{lockedModal?.race.city}, {lockedModal?.race.country}
						</Text>
						<Text style={styles.modalHint}>Run the {lockedModal?.race.name} to unlock this card.</Text>
						<Pressable
							style={styles.modalBtn}
							onPress={() => {
								const raceId = lockedModal?.race.id;
								setLockedModal(null);
								if (raceId) router.push(`/race/${raceId}` as any);
							}}
						>
							<Text style={styles.modalBtnText}>View race</Text>
						</Pressable>
					</View>
				</Pressable>
			</Modal>

			{/* Expanded card modal (full screen, opaque) */}
			<Modal visible={expandedCard !== null} animationType="slide" presentationStyle="pageSheet" onRequestClose={() => setExpandedCard(null)}>
				<View style={styles.expandedContainer}>
					<CosmicBackground>
						<SafeAreaView edges={["top", "bottom"]} style={{ flex: 1 }}>
							<View style={styles.expandedHeader}>
								<View style={{ flex: 1 }}>
									<Text style={styles.expandedRarity}>{expandedCard?.rarity.toUpperCase()}</Text>
									<Text style={styles.expandedName}>{expandedCard?.creature_name}</Text>
								</View>
								<Pressable style={styles.expandedCloseBtn} onPress={() => setExpandedCard(null)}>
									<X size={22} color={Colors.white} strokeWidth={2.6} />
								</Pressable>
							</View>

							<ScrollView style={{ flex: 1 }} contentContainerStyle={{ paddingBottom: 120 }} showsVerticalScrollIndicator={false}>
								<View style={styles.expandedCardWrap}>
									{expandedImage && (
										<View style={styles.expandedCardClip}>
											<Image source={expandedImage} style={styles.expandedCardImage} contentFit="cover" />
										</View>
									)}
								</View>

								<View style={styles.expandedFooter}>
									<View style={styles.expandedRow}>
										<Text style={styles.expandedRowLabel}>Race</Text>
										<Text style={styles.expandedRowValue}>{expandedCard?.race.name}</Text>
									</View>
									<View style={styles.expandedRow}>
										<Text style={styles.expandedRowLabel}>Location</Text>
										<Text style={styles.expandedRowValue}>
											{expandedCard?.race.city}, {expandedCard?.race.country}
										</Text>
									</View>
									<View style={styles.expandedRow}>
										<Text style={styles.expandedRowLabel}>Continent</Text>
										<Text style={styles.expandedRowValue}>{expandedCard?.race.continent}</Text>
									</View>
									{expandedCard?.unlocked_at && (
										<View style={styles.expandedRow}>
											<Text style={styles.expandedRowLabel}>Unlocked</Text>
											<Text style={styles.expandedRowValue}>{new Date(expandedCard.unlocked_at).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}</Text>
										</View>
									)}
								</View>
							</ScrollView>

							<View style={styles.expandedButtonWrap}>
								<Pressable style={[styles.featuredBtn, isExpandedFeatured && styles.featuredBtnActive]} onPress={handleSetFeatured}>
									{isExpandedFeatured ? <Check size={18} color={Colors.white} strokeWidth={2.6} /> : <Star size={18} color={Colors.white} strokeWidth={2.4} />}
									<Text style={styles.featuredBtnText}>{isExpandedFeatured ? "Featured on profile" : "Set as featured"}</Text>
								</Pressable>
							</View>
						</SafeAreaView>
					</CosmicBackground>
				</View>
			</Modal>
		</CosmicBackground>
	);
}

function MuseumCardItem({ card, width, isFeatured, onPress }: { card: MuseumCard; width: number; isFeatured: boolean; onPress: () => void }) {
	const image = card.unlocked ? resolveCardImage(card) : null;
	const aspectRatio = 3 / 4;

	return (
		<Pressable style={[styles.cardItem, { width }]} onPress={onPress}>
			<View style={[styles.cardImageWrap, { aspectRatio }, isFeatured && styles.cardImageFeatured]}>
				{card.unlocked && image ? (
					<Image source={image} style={styles.cardImage} contentFit="cover" />
				) : (
					<View style={styles.cardLocked}>
						<Lock size={28} color={Colors.white50} strokeWidth={2} />
						<Text style={styles.cardLockedQ}>???</Text>
					</View>
				)}
				{card.unlocked && (
					<View style={[styles.rarityBadge, card.rarity === "legendary" && styles.rarityLegendary]}>
						<Text style={styles.rarityText}>{card.rarity.toUpperCase()}</Text>
					</View>
				)}
				{isFeatured && (
					<View style={styles.featuredStar}>
						<Star size={14} color={Colors.white} fill={Colors.white} strokeWidth={2} />
					</View>
				)}
			</View>
			<Text style={styles.cardName} numberOfLines={1}>
				{card.unlocked ? card.creature_name : "???"}
			</Text>
			<Text style={styles.cardLocation} numberOfLines={1}>
				{card.unlocked ? `${card.race.city}, ${card.race.country_code}` : `${card.race.continent}`}
			</Text>
		</Pressable>
	);
}

function ChallengeRow({ challengeId, userId }: { challengeId: string; userId: string }) {
	const [participants, setParticipants] = useState<any[]>([]);
	const [unreadCount, setUnreadCount] = useState(0);

	useFocusEffect(
		useCallback(() => {
			let cancelled = false;
			(async () => {
				const [p, u] = await Promise.all([fetchChallengeParticipants(challengeId), countUnreadMessages(challengeId, userId)]);
				if (!cancelled) {
					setParticipants(p);
					setUnreadCount(u);
				}
			})();
			return () => {
				cancelled = true;
			};
		}, [challengeId, userId]),
	);

	return (
		<View style={{ flexDirection: "row", alignItems: "center", marginVertical: 8, justifyContent: "space-between" }}>
			<View style={{ flexDirection: "row", alignItems: "center" }}>
				{participants.length > 0 && (
					<>
						<View style={{ flexDirection: "row" }}>
							{participants.slice(0, 5).map((p, i) => (
								<View key={p.id} style={[styles.participantAvatar, { marginLeft: i === 0 ? 0 : -8 }]}>
									{p.avatar_url ? <Image source={{ uri: p.avatar_url }} style={styles.participantAvatarImg} contentFit="cover" /> : <View style={[styles.participantAvatarImg, { backgroundColor: Colors.secundaire }]} />}
								</View>
							))}
						</View>
						<Text style={{ marginLeft: 8, fontFamily: Fonts.body, fontSize: 12, color: Colors.ink70 }}>
							{participants.length} {participants.length === 1 ? "runner" : "runners"}
						</Text>
					</>
				)}
			</View>

			{unreadCount > 0 && (
				<View style={styles.unreadBadge}>
					<Text style={styles.unreadBadgeText}>{unreadCount > 9 ? "9+" : unreadCount}</Text>
				</View>
			)}
		</View>
	);
}

const styles = StyleSheet.create({
	profileTop: { alignItems: "center", paddingHorizontal: Spacing.lg, marginBottom: Spacing.xl },
	avatar: { width: 96, height: 96, borderRadius: 48, overflow: "hidden", borderWidth: 3, borderColor: Colors.secundaire, marginBottom: Spacing.base },
	avatarImg: { width: "100%", height: "100%" },
	name: { fontFamily: Fonts.display, fontStyle: "italic", fontSize: 26, color: Colors.white, marginBottom: Spacing.base },
	statsRow: { flexDirection: "row", alignItems: "center", backgroundColor: Colors.white08, borderRadius: Radius.lg, paddingVertical: 14, paddingHorizontal: Spacing.lg, gap: Spacing.lg },
	statItem: { alignItems: "center" },
	statNum: { fontFamily: Fonts.bodyBold, fontSize: 20, fontWeight: "800", color: Colors.white },
	statLabel: { fontFamily: Fonts.body, fontSize: 11, color: Colors.white70, marginTop: 2, letterSpacing: 0.5 },
	statDivider: { width: 1, height: 30, backgroundColor: Colors.white15 },

	featuredSection: { paddingHorizontal: Spacing.lg, marginBottom: Spacing.xl, alignItems: "center" },
	featuredCard: { width: 200, aspectRatio: 3 / 4, borderRadius: Radius.lg, overflow: "hidden", borderWidth: 2, borderColor: "#FFD15C", position: "relative" },
	featuredImage: { width: "100%", height: "100%" },
	featuredOverlay: { position: "absolute", top: 10, left: 10, width: 28, height: 28, borderRadius: 14, backgroundColor: "#FFD15C", alignItems: "center", justifyContent: "center" },
	featuredName: { fontFamily: Fonts.display, fontStyle: "italic", fontSize: 22, color: Colors.white, marginTop: Spacing.base },
	featuredLocation: { fontFamily: Fonts.body, fontSize: 13, color: Colors.white70 },

	section: { marginBottom: Spacing.xl },
	sectionTitle: { fontFamily: Fonts.bodyBold, fontSize: 14, fontWeight: "800", color: Colors.white, letterSpacing: 2, paddingHorizontal: Spacing.lg, marginBottom: Spacing.md, textAlign: "center" },

	challengeCard: { marginHorizontal: Spacing.lg, backgroundColor: Colors.white, borderRadius: Radius.lg, padding: Spacing.base, marginBottom: Spacing.sm },
	challengeTitle: { fontFamily: Fonts.bodyBold, fontSize: 15, fontWeight: "800", color: Colors.ink, marginBottom: 4 },
	challengeMeta: { fontFamily: Fonts.body, fontSize: 12, color: Colors.ink70, marginBottom: 10 },
	progressBar: { height: 6, borderRadius: 3, backgroundColor: Colors.ink08, overflow: "hidden" },
	progressFill: { height: "100%", backgroundColor: Colors.secundaire },

	pillsRow: { paddingHorizontal: Spacing.lg, gap: 8, paddingBottom: Spacing.md },
	pill: { paddingHorizontal: 16, paddingVertical: 8, borderRadius: Radius.pill, borderWidth: 1.5, borderColor: Colors.white30 },
	pillActive: { backgroundColor: Colors.secundaire, borderColor: Colors.secundaire },
	pillText: { fontFamily: Fonts.bodyBold, fontSize: 13, fontWeight: "700", color: Colors.white70 },
	pillTextActive: { color: Colors.white },

	grid: { paddingHorizontal: Spacing.lg, flexDirection: "row", flexWrap: "wrap", gap: Spacing.sm },
	cardItem: { marginBottom: Spacing.base },
	cardImageWrap: { width: "100%", borderRadius: Radius.lg, overflow: "hidden", backgroundColor: Colors.white08, position: "relative", marginBottom: 8 },
	cardImageFeatured: { borderWidth: 2, borderColor: "#FFD15C" },
	cardImage: { width: "100%", height: "100%" },
	cardLocked: { flex: 1, alignItems: "center", justifyContent: "center", backgroundColor: "#1a1d3a", gap: 8 },
	cardLockedQ: { fontFamily: Fonts.display, fontSize: 24, fontStyle: "italic", color: Colors.white50, letterSpacing: 2 },
	rarityBadge: { position: "absolute", top: 8, right: 8, backgroundColor: Colors.secundaire, paddingHorizontal: 8, paddingVertical: 3, borderRadius: Radius.pill },
	rarityLegendary: { backgroundColor: "#FFD15C" },
	rarityText: { fontFamily: Fonts.bodyBold, fontSize: 9, fontWeight: "800", color: Colors.white, letterSpacing: 0.5 },
	featuredStar: { position: "absolute", top: 8, left: 8, width: 26, height: 26, borderRadius: 13, backgroundColor: "#FFD15C", alignItems: "center", justifyContent: "center" },
	cardName: { fontFamily: Fonts.bodyBold, fontSize: 14, fontWeight: "800", color: Colors.white, marginBottom: 2 },
	cardLocation: { fontFamily: Fonts.body, fontSize: 11, color: Colors.white70 },

	challengeCardTop: { flexDirection: "row", alignItems: "center", gap: 8 },
	participantAvatar: { width: 28, height: 28, borderRadius: 14, borderWidth: 2, borderColor: Colors.white, overflow: "hidden" },
	participantAvatarImg: { width: "100%", height: "100%" },

	unreadBadge: {
		minWidth: 22,
		height: 22,
		borderRadius: 11,
		backgroundColor: "#FF5757",
		alignItems: "center",
		justifyContent: "center",
		paddingHorizontal: 6,
	},
	unreadBadgeText: {
		fontFamily: Fonts.bodyBold,
		fontSize: 11,
		fontWeight: "800",
		color: Colors.white,
	},

	muted: { color: Colors.white70, fontFamily: Fonts.body, fontSize: 14, textAlign: "center", paddingVertical: Spacing.lg, paddingHorizontal: Spacing.lg },

	filterCard: {
		width: 320,
		backgroundColor: Colors.hoofdkleur,
		borderRadius: Radius.xl,
		borderWidth: 1,
		borderColor: Colors.white15,
		padding: Spacing.lg,
	},
	filterHeader: {
		flexDirection: "row",
		justifyContent: "space-between",
		alignItems: "center",
		marginBottom: Spacing.base,
	},
	filterTitle: {
		fontFamily: Fonts.display,
		fontStyle: "italic",
		fontSize: 18,
		color: Colors.white,
		letterSpacing: 1,
	},
	filterRow: {
		flexDirection: "row",
		alignItems: "center",
		justifyContent: "space-between",
		paddingVertical: 14,
		borderBottomWidth: 1,
		borderBottomColor: Colors.white15,
	},
	filterRowText: {
		fontFamily: Fonts.body,
		fontSize: 15,
		color: Colors.white,
	},
	filterCheckbox: {
		width: 24,
		height: 24,
		borderRadius: 6,
		borderWidth: 2,
		borderColor: Colors.white30,
		alignItems: "center",
		justifyContent: "center",
	},
	filterCheckboxActive: {
		backgroundColor: Colors.secundaire,
		borderColor: Colors.secundaire,
	},
	filterFooter: {
		flexDirection: "row",
		gap: 10,
		marginTop: Spacing.lg,
	},
	filterReset: {
		flex: 1,
		paddingVertical: 12,
		borderRadius: Radius.pill,
		backgroundColor: Colors.white15,
		alignItems: "center",
	},
	filterResetText: {
		fontFamily: Fonts.bodyBold,
		fontSize: 14,
		fontWeight: "800",
		color: Colors.white,
	},
	filterApply: {
		flex: 1,
		paddingVertical: 12,
		borderRadius: Radius.pill,
		backgroundColor: Colors.secundaire,
		alignItems: "center",
	},
	filterApplyText: {
		fontFamily: Fonts.bodyBold,
		fontSize: 14,
		fontWeight: "800",
		color: Colors.white,
	},

	// Locked modal
	modalBackdrop: { flex: 1, backgroundColor: "rgba(4, 8, 26, 0.82)", alignItems: "center", justifyContent: "center" },
	modalCard: { width: 320, backgroundColor: Colors.hoofdkleur, borderRadius: Radius.xl, borderWidth: 1, borderColor: Colors.white15, padding: Spacing.lg, alignItems: "center" },
	modalLockIcon: { width: 72, height: 72, borderRadius: 36, backgroundColor: Colors.white15, alignItems: "center", justifyContent: "center", marginBottom: Spacing.base },
	modalTitle: { fontFamily: Fonts.display, fontStyle: "italic", fontSize: 20, color: Colors.violetLight, letterSpacing: 2, marginBottom: 8 },
	modalRaceName: { fontFamily: Fonts.display, fontStyle: "italic", fontSize: 22, color: Colors.white, textAlign: "center", marginBottom: 4 },
	modalRaceLocation: { fontFamily: Fonts.body, fontSize: 13, color: Colors.white70, marginBottom: Spacing.base },
	modalHint: { fontFamily: Fonts.body, fontSize: 14, color: Colors.white70, textAlign: "center", marginBottom: Spacing.lg, paddingHorizontal: Spacing.base },
	modalBtn: { width: "100%", height: 48, borderRadius: Radius.pill, backgroundColor: Colors.secundaire, alignItems: "center", justifyContent: "center" },
	modalBtnText: { fontFamily: Fonts.bodyBold, fontSize: 15, fontWeight: "800", color: Colors.white },

	// Expanded modal
	expandedContainer: { flex: 1 },
	expandedHeader: { flexDirection: "row", alignItems: "center", paddingHorizontal: Spacing.lg, paddingTop: Spacing.lg, paddingBottom: Spacing.base, gap: Spacing.base },
	expandedRarity: { fontFamily: Fonts.bodyBold, fontSize: 11, fontWeight: "800", color: Colors.violetLight, letterSpacing: 2, marginBottom: 2 },
	expandedName: { fontFamily: Fonts.display, fontStyle: "italic", fontSize: 24, color: Colors.white },
	expandedCloseBtn: { width: 40, height: 40, borderRadius: 20, backgroundColor: Colors.white15, alignItems: "center", justifyContent: "center" },
	expandedCardWrap: { alignItems: "center", paddingHorizontal: Spacing.lg, paddingVertical: Spacing.sm },
	expandedCardImage: { width: "100%", aspectRatio: 3 / 4, borderRadius: Radius.lg, maxHeight: 440 },
	expandedCardClip: {
		width: "100%",
		aspectRatio: 3 / 4,
		borderRadius: Radius.lg,
		overflow: "hidden",
		maxHeight: 440,
	},
	expandedFooter: { paddingHorizontal: Spacing.lg, paddingTop: Spacing.lg, gap: 8 },
	expandedRow: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", paddingVertical: 8, borderBottomWidth: 1, borderBottomColor: Colors.white15 },
	expandedRowLabel: { fontFamily: Fonts.body, fontSize: 13, color: Colors.white70 },
	expandedRowValue: { fontFamily: Fonts.bodyBold, fontSize: 14, fontWeight: "700", color: Colors.white, textAlign: "right", flex: 1, marginLeft: Spacing.base },
	expandedButtonWrap: { paddingHorizontal: Spacing.lg, paddingBottom: Spacing.base, paddingTop: Spacing.sm },
	featuredBtn: { flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 8, height: 52, borderRadius: Radius.pill, backgroundColor: Colors.secundaire },
	featuredBtnActive: { backgroundColor: "#FFD15C" },
	featuredBtnText: { fontFamily: Fonts.bodyBold, fontSize: 15, fontWeight: "800", color: Colors.white },
});
