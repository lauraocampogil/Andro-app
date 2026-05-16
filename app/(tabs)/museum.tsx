import { CosmicBackground } from "@/components/CosmicBackground";
import { HeaderButton } from "@/components/HeaderButton";
import { ScreenHeader } from "@/components/ScreenHeader";
import { Colors, Fonts, Radius, Spacing } from "@/constants/theme";
import { useAuth } from "@/lib/auth";
import { resolveCardImage } from "@/lib/cardAssets";
import { fetchMuseumCards, getFeaturedCardId, MuseumCard, setFeaturedCard, unsetFeaturedCard } from "@/lib/museum";
import { Image } from "expo-image";
import { useFocusEffect, useRouter } from "expo-router";
import { Check, ListFilter, Lock, Star, User, X } from "lucide-react-native";
import React, { useCallback, useMemo, useState } from "react";
import { Modal, Pressable, ScrollView, StyleSheet, Text, useWindowDimensions, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

const CONTINENTS = ["All", "Europe", "Asia", "Africa", "North America", "South America", "Oceania"];

export default function Museum() {
	const router = useRouter();
	const { session } = useAuth();
	const userId = session?.user?.id;
	const { width: SCREEN_W } = useWindowDimensions();

	const [cards, setCards] = useState<MuseumCard[]>([]);
	const [loading, setLoading] = useState(true);
	const [continent, setContinent] = useState("All");
	const [lockedModal, setLockedModal] = useState<MuseumCard | null>(null);
	const [expandedCard, setExpandedCard] = useState<MuseumCard | null>(null);
	const [featuredId, setFeaturedId] = useState<string | null>(null);

	// Reload data every time the screen comes into focus (after scanning a new card etc.)
	useFocusEffect(
		useCallback(() => {
			if (!userId) return;
			let cancelled = false;
			(async () => {
				setLoading(true);
				const [data, fid] = await Promise.all([fetchMuseumCards(userId), getFeaturedCardId(userId)]);
				if (!cancelled) {
					setCards(data);
					setFeaturedId(fid);
					setLoading(false);
				}
			})();
			return () => {
				cancelled = true;
			};
		}, [userId]),
	);

	const filtered = useMemo(() => {
		if (continent === "All") return cards;
		return cards.filter((c) => c.race.continent === continent);
	}, [cards, continent]);

	const unlockedCount = cards.filter((c) => c.unlocked).length;
	const countriesCount = new Set(cards.filter((c) => c.unlocked).map((c) => c.race.country_code)).size;
	const continentsCount = new Set(cards.filter((c) => c.unlocked).map((c) => c.race.continent)).size;

	const cardWidth = (SCREEN_W - Spacing.lg * 2 - Spacing.sm) / 2;

	const handleCardPress = (card: MuseumCard) => {
		if (card.unlocked) {
			setExpandedCard(card);
		} else {
			setLockedModal(card);
		}
	};

	const handleSetFeatured = async () => {
		if (!userId || !expandedCard) return;
		if (isExpandedFeatured) {
			// Already featured - unfeature it
			const ok = await unsetFeaturedCard(userId);
			if (ok) setFeaturedId(null);
		} else {
			// Set as featured
			const ok = await setFeaturedCard(userId, expandedCard.id);
			if (ok) setFeaturedId(expandedCard.id);
		}
	};

	const expandedImage = expandedCard ? resolveCardImage(expandedCard) : null;
	const isExpandedFeatured = expandedCard?.id === featuredId;

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
						right={
							<HeaderButton variant="primary">
								<ListFilter size={20} color={Colors.white} strokeWidth={2} />
							</HeaderButton>
						}
					/>

					<View style={styles.titleRow}>
						<Text style={styles.title}>MUSEUM</Text>
					</View>

					<View style={styles.statsCard}>
						<View style={styles.statCell}>
							<Text style={styles.statNum}>
								{unlockedCount}
								<Text style={styles.statFrac}>/{cards.length || 10}</Text>
							</Text>
							<Text style={styles.statName}>CARDS</Text>
						</View>
						<View style={[styles.statCell, styles.statCellMid]}>
							<Text style={styles.statNum}>{countriesCount}</Text>
							<Text style={styles.statName}>COUNTRIES</Text>
						</View>
						<View style={styles.statCell}>
							<Text style={styles.statNum}>
								{continentsCount}
								<Text style={styles.statFrac}>/7</Text>
							</Text>
							<Text style={styles.statName}>CONTINENTS</Text>
						</View>
					</View>

					<ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.pillsRow}>
						{CONTINENTS.map((c) => (
							<Pressable key={c} style={[styles.pill, continent === c && styles.pillActive]} onPress={() => setContinent(c)}>
								<Text style={[styles.pillText, continent === c && styles.pillTextActive]}>{c}</Text>
							</Pressable>
						))}
					</ScrollView>

					{loading ? (
						<View style={styles.center}>
							<Text style={styles.muted}>Loading museum...</Text>
						</View>
					) : filtered.length === 0 ? (
						<View style={styles.center}>
							<Text style={styles.muted}>No cards in this continent yet.</Text>
						</View>
					) : (
						<View style={styles.grid}>
							{filtered.map((card) => (
								<MuseumCardItem key={card.id} card={card} width={cardWidth} isFeatured={card.id === featuredId} onPress={() => handleCardPress(card)} />
							))}
						</View>
					)}
				</ScrollView>
			</SafeAreaView>

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
			<Modal visible={expandedCard !== null} animationType="slide" onRequestClose={() => setExpandedCard(null)}>
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
								<View style={styles.expandedCardWrap}>{expandedImage && <Image source={expandedImage} style={styles.expandedCardImage} contentFit="contain" />}</View>

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

const styles = StyleSheet.create({
	titleRow: { paddingHorizontal: Spacing.lg, marginTop: Spacing.sm, marginBottom: Spacing.lg },
	title: { fontFamily: Fonts.display, fontStyle: "italic", fontSize: 32, color: Colors.white, letterSpacing: 0 },

	statsCard: {
		marginHorizontal: Spacing.lg,
		backgroundColor: Colors.white,
		borderRadius: Radius.xl,
		paddingVertical: 16,
		paddingHorizontal: 12,
		flexDirection: "row",
		marginBottom: Spacing.lg,
		shadowColor: "#000",
		shadowOffset: { width: 0, height: 8 },
		shadowOpacity: 0.3,
		shadowRadius: 24,
		elevation: 8,
	},
	statCell: { flex: 1, alignItems: "center" },
	statCellMid: { borderLeftWidth: 1, borderRightWidth: 1, borderColor: Colors.ink08 },
	statNum: { fontFamily: Fonts.display, fontSize: 22, fontStyle: "italic", fontWeight: "800", color: Colors.ink, marginBottom: 2 },
	statFrac: { fontSize: 14, color: Colors.ink50 },
	statName: { fontFamily: Fonts.bodyBold, fontSize: 9, fontWeight: "800", color: Colors.ink70, letterSpacing: 1.4 },

	pillsRow: { paddingHorizontal: Spacing.lg, gap: 8, paddingBottom: Spacing.lg },
	pill: { paddingHorizontal: 16, paddingVertical: 8, borderRadius: Radius.pill, borderWidth: 1.5, borderColor: Colors.white30, backgroundColor: "transparent" },
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

	center: { alignItems: "center", justifyContent: "center", paddingVertical: Spacing.xxl, width: "100%" },
	muted: { color: Colors.white70, fontFamily: Fonts.body, fontSize: 14 },

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

	expandedContainer: { flex: 1 },
	expandedHeader: {
		flexDirection: "row",
		alignItems: "center",
		paddingHorizontal: Spacing.lg,
		paddingTop: Spacing.lg,
		paddingBottom: Spacing.base,
		gap: Spacing.base,
	},
	expandedRarity: {
		fontFamily: Fonts.bodyBold,
		fontSize: 11,
		fontWeight: "800",
		color: Colors.violetLight,
		letterSpacing: 2,
		marginBottom: 2,
	},
	expandedName: {
		fontFamily: Fonts.display,
		fontStyle: "italic",
		fontSize: 24,
		color: Colors.white,
	},
	expandedCloseBtn: {
		width: 40,
		height: 40,
		borderRadius: 20,
		backgroundColor: Colors.white15,
		alignItems: "center",
		justifyContent: "center",
	},
	expandedCardWrap: {
		alignItems: "center",
		paddingHorizontal: Spacing.lg,
		paddingVertical: Spacing.sm,
	},
	expandedCardImage: {
		width: "100%",
		aspectRatio: 3 / 4,
		borderRadius: Radius.lg,
		maxHeight: 440,
	},
	expandedFooter: {
		paddingHorizontal: Spacing.lg,
		paddingTop: Spacing.lg,
		gap: 8,
	},
	expandedRow: {
		flexDirection: "row",
		justifyContent: "space-between",
		alignItems: "center",
		paddingVertical: 8,
		borderBottomWidth: 1,
		borderBottomColor: Colors.white15,
	},
	expandedRowLabel: {
		fontFamily: Fonts.body,
		fontSize: 13,
		color: Colors.white70,
	},
	expandedRowValue: {
		fontFamily: Fonts.bodyBold,
		fontSize: 14,
		fontWeight: "700",
		color: Colors.white,
		textAlign: "right",
		flex: 1,
		marginLeft: Spacing.base,
	},
	expandedButtonWrap: {
		paddingHorizontal: Spacing.lg,
		paddingBottom: Spacing.base,
		paddingTop: Spacing.sm,
	},
	featuredBtn: {
		flexDirection: "row",
		alignItems: "center",
		justifyContent: "center",
		gap: 8,
		height: 52,
		borderRadius: Radius.pill,
		backgroundColor: Colors.secundaire,
	},
	featuredBtnActive: { backgroundColor: "#FFD15C" },
	featuredBtnText: {
		fontFamily: Fonts.bodyBold,
		fontSize: 15,
		fontWeight: "800",
		color: Colors.white,
	},
});
