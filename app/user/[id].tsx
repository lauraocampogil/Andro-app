import { CosmicBackground } from "@/components/CosmicBackground";
import { Colors, Fonts, FontSizes, Radius, Spacing } from "@/constants/theme";
import { useAuth } from "@/lib/auth";
import { resolveCardImage } from "@/lib/cardAssets";
import { Challenge, daysLeft } from "@/lib/challenges";
import { cancelFollowRequest, checkFollowStatus, FollowRequestStatus, requestOrFollow } from "@/lib/followRequests";
import { getFollowersCount, getFollowingCount, unfollowUser } from "@/lib/follows";
import { MuseumCard } from "@/lib/museum";
import { fetchPublicActiveChallenges, fetchPublicMuseumCards, fetchPublicProfile, PublicProfile } from "@/lib/userProfile";
import { BlurView } from "expo-blur";
import { Image } from "expo-image";
import { useFocusEffect, useLocalSearchParams, useRouter } from "expo-router";
import { Check, Clock, Lock, Star, UserPlus, X } from "lucide-react-native";
import React, { useCallback, useMemo, useState } from "react";
import { Modal, Pressable, ScrollView, StyleSheet, Text, useWindowDimensions, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

const CONTINENTS = ["All", "Europe", "Asia", "Africa", "North America", "South America", "Oceania"];

export default function UserProfile() {
	const router = useRouter();
	const { id } = useLocalSearchParams<{ id: string }>();
	const { session } = useAuth();
	const currentUserId = session?.user?.id;
	const { width: SCREEN_W } = useWindowDimensions();

	const [profile, setProfile] = useState<PublicProfile | null>(null);
	const [cards, setCards] = useState<MuseumCard[]>([]);
	const [challenges, setChallenges] = useState<Challenge[]>([]);
	const [followers, setFollowers] = useState(0);
	const [followingCount, setFollowingCount] = useState(0);
	const [followStatus, setFollowStatus] = useState<FollowRequestStatus>("none");
	const [continent, setContinent] = useState("All");
	const [loading, setLoading] = useState(true);
	const [expandedCard, setExpandedCard] = useState<MuseumCard | null>(null);

	useFocusEffect(
		useCallback(() => {
			if (!id || !currentUserId) return;
			let cancelled = false;
			(async () => {
				setLoading(true);
				const [p, m, ch, fr, fg, fs] = await Promise.all([fetchPublicProfile(id), fetchPublicMuseumCards(id), fetchPublicActiveChallenges(id), getFollowersCount(id), getFollowingCount(id), checkFollowStatus(currentUserId, id)]);
				if (!cancelled) {
					setProfile(p);
					setCards(m);
					setChallenges(ch);
					setFollowers(fr);
					setFollowingCount(fg);
					setFollowStatus(fs);
					setLoading(false);
				}
			})();
			return () => {
				cancelled = true;
			};
		}, [id, currentUserId]),
	);

	const filteredCards = useMemo(() => {
		if (continent === "All") return cards;
		return cards.filter((c) => c.race.continent === continent);
	}, [cards, continent]);

	const unlockedCount = cards.filter((c) => c.unlocked).length;
	const featuredCard = cards.find((c) => c.id === profile?.featured_card_id);
	const featuredImage = featuredCard ? resolveCardImage(featuredCard) : null;
	const cardWidth = (SCREEN_W - Spacing.lg * 2 - Spacing.sm) / 2;

	const handleFollow = async () => {
		if (!currentUserId || !id) return;
		if (followStatus === "following") {
			setFollowStatus("none");
			setFollowers((c) => Math.max(0, c - 1));
			await unfollowUser(currentUserId, id);
		} else if (followStatus === "pending") {
			setFollowStatus("none");
			await cancelFollowRequest(currentUserId, id);
		} else {
			const newStatus = await requestOrFollow(currentUserId, id);
			setFollowStatus(newStatus);
			if (newStatus === "following") setFollowers((c) => c + 1);
		}
	};

	const handleCardPress = (card: MuseumCard) => {
		if (!card.unlocked) return;
		setExpandedCard(card);
	};

	const expandedImage = expandedCard ? resolveCardImage(expandedCard) : null;

	if (!profile && !loading) {
		return (
			<CosmicBackground>
				<SafeAreaView style={{ flex: 1, alignItems: "center", justifyContent: "center" }}>
					<Text style={{ color: Colors.white, fontFamily: Fonts.body }}>Profile not found</Text>
				</SafeAreaView>
			</CosmicBackground>
		);
	}

	const isMyOwnProfile = currentUserId === id;
	const isPrivate = profile?.account_private ?? false;
	const canViewContent = isMyOwnProfile || followStatus === "following" || !isPrivate;

	return (
		<CosmicBackground>
			<SafeAreaView edges={["top"]} style={{ flex: 1 }}>
				<View style={styles.header}>
					<Pressable style={styles.backBtn} onPress={() => router.back()}>
						<X size={22} color={Colors.white} strokeWidth={2.4} />
					</Pressable>
					<View />
				</View>

				<ScrollView style={{ flex: 1 }} contentContainerStyle={{ paddingBottom: 120 }} showsVerticalScrollIndicator={false}>
					{/* Avatar + name + stats */}
					<View style={styles.profileTop}>
						<View style={styles.avatar}>{profile?.avatar_url ? <Image source={{ uri: profile.avatar_url }} style={styles.avatarImg} contentFit="cover" /> : <View style={[styles.avatarImg, { backgroundColor: Colors.secundaire }]} />}</View>
						<Text style={styles.name}>{profile?.display_name ?? "Runner"}</Text>

						{!isMyOwnProfile && (
							<Pressable style={[styles.followBtn, followStatus === "following" && styles.followBtnFollowing, followStatus === "pending" && styles.followBtnPending]} onPress={handleFollow}>
								{followStatus === "following" ? (
									<>
										<Check size={16} color={Colors.white} strokeWidth={2.6} />
										<Text style={styles.followBtnText}>Following</Text>
									</>
								) : followStatus === "pending" ? (
									<>
										<Clock size={16} color={Colors.white} strokeWidth={2.4} />
										<Text style={styles.followBtnText}>Requested</Text>
									</>
								) : (
									<>
										<UserPlus size={16} color={Colors.white} strokeWidth={2.4} />
										<Text style={styles.followBtnText}>Follow</Text>
									</>
								)}
							</Pressable>
						)}

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
								<Text style={styles.statNum}>{followingCount}</Text>
								<Text style={styles.statLabel}>Following</Text>
							</View>
						</View>
					</View>

					{canViewContent ? (
						<>
							{/* Featured card */}
							{featuredCard && featuredImage && (
								<View style={styles.featuredSection}>
									<Text style={styles.sectionTitle}>Featured card</Text>
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
							{challenges.length > 0 && (
								<View style={styles.section}>
									<Text style={styles.sectionTitle}>Active challenges</Text>
									{challenges.map((c) => (
										<View key={c.id} style={styles.challengeCard}>
											<Text style={styles.challengeTitle}>{c.title}</Text>
											<Text style={styles.challengeMeta}>{daysLeft(c.deadline)}</Text>
											<View style={styles.progressBar}>
												<View style={[styles.progressFill, { width: `${Math.min(100, (c.user_progress ?? 0) * 100)}%` }]} />
											</View>
										</View>
									))}
								</View>
							)}

							{/* Collection */}
							<View style={styles.section}>
								<Text style={styles.sectionTitle}>Collection</Text>

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
										{filteredCards.map((card) => {
											const image = resolveCardImage(card);
											const isFeatured = card.id === profile?.featured_card_id;
											return (
												<Pressable key={card.id} style={[styles.cardItem, { width: cardWidth }]} onPress={() => handleCardPress(card)}>
													<View style={[styles.cardImageWrap, { aspectRatio: 3 / 4 }, isFeatured && styles.cardImageFeatured]}>
														{image ? (
															<>
																<Image source={image} style={styles.cardImage} contentFit="cover" />
																{!card.unlocked && (
																	<>
																		<BlurView intensity={38} tint="dark" style={StyleSheet.absoluteFill} />
																		<View style={styles.lockedOverlay}>
																			<Lock size={26} color={Colors.white} strokeWidth={2.2} />
																		</View>
																	</>
																)}
															</>
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
														{card.unlocked ? `${card.race.city}, ${card.race.country_code}` : card.race.continent}
													</Text>
												</Pressable>
											);
										})}
									</View>
								)}
							</View>
						</>
					) : (
						<View style={styles.privateBox}>
							<Lock size={40} color={Colors.white50} strokeWidth={2} />
							<Text style={styles.privateTitle}>This account is private</Text>
							<Text style={styles.privateDesc}>Follow this account to see their cards and challenges.</Text>
						</View>
					)}
				</ScrollView>
			</SafeAreaView>

			{/* Expanded card (read-only) */}
			<Modal visible={expandedCard !== null} animationType="slide" presentationStyle="pageSheet" onRequestClose={() => setExpandedCard(null)}>
				<View style={{ flex: 1 }}>
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
											<Image source={expandedImage} style={{ width: "100%", height: "100%" }} contentFit="cover" />
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
						</SafeAreaView>
					</CosmicBackground>
				</View>
			</Modal>
		</CosmicBackground>
	);
}

const styles = StyleSheet.create({
	header: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", paddingHorizontal: Spacing.lg, paddingTop: Spacing.sm },
	backBtn: { width: 44, height: 44, borderRadius: 22, backgroundColor: Colors.white15, alignItems: "center", justifyContent: "center" },

	profileTop: { alignItems: "center", paddingHorizontal: Spacing.lg, marginTop: Spacing.base, marginBottom: Spacing.xl },
	avatar: { width: 96, height: 96, borderRadius: 48, overflow: "hidden", borderWidth: 3, borderColor: Colors.secundaire, marginBottom: Spacing.base },
	avatarImg: { width: "100%", height: "100%" },
	name: { fontFamily: Fonts.display, fontStyle: "italic", fontSize: FontSizes.h2, color: Colors.white, marginBottom: Spacing.sm },

	followBtn: { flexDirection: "row", alignItems: "center", gap: 6, paddingHorizontal: 20, paddingVertical: 10, borderRadius: Radius.pill, backgroundColor: Colors.secundaire, marginBottom: Spacing.base },
	followBtnFollowing: { backgroundColor: Colors.white15 },
	followBtnPending: { backgroundColor: "rgba(255, 209, 92, 0.25)", borderWidth: 1, borderColor: "#FFD15C" },
	followBtnText: { fontFamily: Fonts.bodyBold, fontSize: 13, fontWeight: "800", color: Colors.white },

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
	sectionTitle: { fontFamily: Fonts.display, fontStyle: "italic", fontSize: FontSizes.h3, color: Colors.white, letterSpacing: 0, paddingHorizontal: Spacing.lg, marginBottom: Spacing.md, textAlign: "center" },

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
	lockedOverlay: { ...StyleSheet.absoluteFillObject, alignItems: "center", justifyContent: "center" },
	rarityBadge: { position: "absolute", top: 8, right: 8, backgroundColor: Colors.secundaire, paddingHorizontal: 8, paddingVertical: 3, borderRadius: Radius.pill },
	rarityLegendary: { backgroundColor: "#FFD15C" },
	rarityText: { fontFamily: Fonts.bodyBold, fontSize: 9, fontWeight: "800", color: Colors.white, letterSpacing: 0.5 },
	featuredStar: { position: "absolute", top: 8, left: 8, width: 26, height: 26, borderRadius: 13, backgroundColor: "#FFD15C", alignItems: "center", justifyContent: "center" },
	cardName: { fontFamily: Fonts.bodyBold, fontSize: 14, fontWeight: "800", color: Colors.white, marginBottom: 2 },
	cardLocation: { fontFamily: Fonts.body, fontSize: 11, color: Colors.white70 },

	privateBox: { alignItems: "center", paddingVertical: Spacing.xxl, paddingHorizontal: Spacing.lg, gap: 8 },
	privateTitle: { fontFamily: Fonts.display, fontStyle: "italic", fontSize: FontSizes.h3, color: Colors.white },
	privateDesc: { fontFamily: Fonts.body, fontSize: 13, color: Colors.white70, textAlign: "center" },

	muted: { color: Colors.white70, fontFamily: Fonts.body, fontSize: 14, textAlign: "center", paddingVertical: Spacing.lg, paddingHorizontal: Spacing.lg },

	expandedHeader: { flexDirection: "row", alignItems: "center", paddingHorizontal: Spacing.lg, paddingTop: Spacing.lg, paddingBottom: Spacing.base, gap: Spacing.base },
	expandedRarity: { fontFamily: Fonts.bodyBold, fontSize: 11, fontWeight: "800", color: Colors.violetLight, letterSpacing: 2, marginBottom: 2 },
	expandedName: { fontFamily: Fonts.display, fontStyle: "italic", fontSize: 24, color: Colors.white },
	expandedCloseBtn: { width: 40, height: 40, borderRadius: 20, backgroundColor: Colors.white15, alignItems: "center", justifyContent: "center" },
	expandedCardWrap: { alignItems: "center", paddingHorizontal: Spacing.lg, paddingVertical: Spacing.sm },
	expandedCardClip: { width: "100%", aspectRatio: 3 / 4, borderRadius: Radius.lg, overflow: "hidden", maxHeight: 440 },
	expandedFooter: { paddingHorizontal: Spacing.lg, paddingTop: Spacing.lg, gap: 8 },
	expandedRow: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", paddingVertical: 8, borderBottomWidth: 1, borderBottomColor: Colors.white15 },
	expandedRowLabel: { fontFamily: Fonts.body, fontSize: 13, color: Colors.white70 },
	expandedRowValue: { fontFamily: Fonts.bodyBold, fontSize: 14, fontWeight: "700", color: Colors.white, textAlign: "right", flex: 1, marginLeft: Spacing.base },
});
