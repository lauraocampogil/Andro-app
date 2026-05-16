import { CosmicBackground } from "@/components/CosmicBackground";
import { HeaderButton } from "@/components/HeaderButton";
import { ScreenHeader } from "@/components/ScreenHeader";
import { Colors, Fonts, Radius, Spacing } from "@/constants/theme";
import { useAuth } from "@/lib/auth";
import { resolveCardImage } from "@/lib/cardAssets";
import { fetchMuseumCards, MuseumCard } from "@/lib/museum";
import { Image } from "expo-image";
import { useRouter } from "expo-router";
import { Lock, Menu, User } from "lucide-react-native";
import React, { useEffect, useMemo, useState } from "react";
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

	useEffect(() => {
		if (!userId) return;
		(async () => {
			const data = await fetchMuseumCards(userId);
			setCards(data);
			setLoading(false);
		})();
	}, [userId]);

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
			router.push({ pathname: "/card-reveal", params: { qr: card.qr_code, already: "true" } } as any);
		} else {
			setLockedModal(card);
		}
	};

	return (
		<CosmicBackground>
			<SafeAreaView edges={["top"]} style={{ flex: 1 }}>
				<ScreenHeader
					left={
						<HeaderButton onPress={() => router.push("/(tabs)/profile" as any)}>
							<User size={20} color={Colors.ink} strokeWidth={2} />
						</HeaderButton>
					}
					right={
						<HeaderButton variant="primary">
							<Menu size={20} color={Colors.white} strokeWidth={2} />
						</HeaderButton>
					}
				/>

				<View style={styles.titleRow}>
					<Text style={styles.title}>MUSEUM</Text>
				</View>

				{/* Stats card */}
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

				{/* Continent filter pills */}
				<ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.pillsRow}>
					{CONTINENTS.map((c) => (
						<Pressable key={c} style={[styles.pill, continent === c && styles.pillActive]} onPress={() => setContinent(c)}>
							<Text style={[styles.pillText, continent === c && styles.pillTextActive]}>{c}</Text>
						</Pressable>
					))}
				</ScrollView>

				{/* Cards grid */}
				{loading ? (
					<View style={styles.center}>
						<Text style={styles.muted}>Loading museum...</Text>
					</View>
				) : (
					<ScrollView style={{ flex: 1 }} contentContainerStyle={styles.grid} showsVerticalScrollIndicator={false}>
						{filtered.length === 0 ? (
							<View style={styles.center}>
								<Text style={styles.muted}>No cards in this continent yet.</Text>
							</View>
						) : (
							filtered.map((card) => <MuseumCardItem key={card.id} card={card} width={cardWidth} onPress={() => handleCardPress(card)} />)
						)}
					</ScrollView>
				)}
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
		</CosmicBackground>
	);
}

function MuseumCardItem({ card, width, onPress }: { card: MuseumCard; width: number; onPress: () => void }) {
	const image = card.unlocked ? resolveCardImage(card) : null;
	const aspectRatio = 3 / 4;

	return (
		<Pressable style={[styles.cardItem, { width }]} onPress={onPress}>
			<View style={[styles.cardImageWrap, { aspectRatio }]}>
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
	title: {
		fontFamily: Fonts.display,
		fontStyle: "italic",
		fontSize: 32,
		color: Colors.white,
		letterSpacing: 0,
	},

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
	statCellMid: {
		borderLeftWidth: 1,
		borderRightWidth: 1,
		borderColor: Colors.ink08,
	},
	statNum: {
		fontFamily: Fonts.display,
		fontSize: 22,
		fontStyle: "italic",
		fontWeight: "800",
		color: Colors.ink,
		marginBottom: 2,
	},
	statFrac: { fontSize: 14, color: Colors.ink50 },
	statName: {
		fontFamily: Fonts.bodyBold,
		fontSize: 9,
		fontWeight: "800",
		color: Colors.ink70,
		letterSpacing: 1.4,
	},

	pillsRow: {
		paddingHorizontal: Spacing.lg,
		gap: 8,
		paddingBottom: Spacing.lg,
	},
	pill: {
		paddingHorizontal: 16,
		paddingVertical: 8,
		borderRadius: Radius.pill,
		borderWidth: 1.5,
		borderColor: Colors.white30,
		backgroundColor: "transparent",
	},
	pillActive: {
		backgroundColor: Colors.secundaire,
		borderColor: Colors.secundaire,
	},
	pillText: { fontFamily: Fonts.bodyBold, fontSize: 13, fontWeight: "700", color: Colors.white70 },
	pillTextActive: { color: Colors.white },

	grid: {
		paddingHorizontal: Spacing.lg,
		paddingBottom: 120,
		flexDirection: "row",
		flexWrap: "wrap",
		gap: Spacing.sm,
	},

	cardItem: {
		marginBottom: Spacing.base,
	},
	cardImageWrap: {
		width: "100%",
		borderRadius: Radius.lg,
		overflow: "hidden",
		backgroundColor: Colors.white08,
		position: "relative",
		marginBottom: 8,
	},
	cardImage: { width: "100%", height: "100%" },
	cardLocked: {
		flex: 1,
		alignItems: "center",
		justifyContent: "center",
		backgroundColor: "#1a1d3a",
		gap: 8,
	},
	cardLockedQ: {
		fontFamily: Fonts.display,
		fontSize: 24,
		fontStyle: "italic",
		color: Colors.white50,
		letterSpacing: 2,
	},
	rarityBadge: {
		position: "absolute",
		top: 8,
		right: 8,
		backgroundColor: Colors.secundaire,
		paddingHorizontal: 8,
		paddingVertical: 3,
		borderRadius: Radius.pill,
	},
	rarityLegendary: { backgroundColor: "#FFD15C" },
	rarityText: {
		fontFamily: Fonts.bodyBold,
		fontSize: 9,
		fontWeight: "800",
		color: Colors.white,
		letterSpacing: 0.5,
	},
	cardName: {
		fontFamily: Fonts.bodyBold,
		fontSize: 14,
		fontWeight: "800",
		color: Colors.white,
		marginBottom: 2,
	},
	cardLocation: {
		fontFamily: Fonts.body,
		fontSize: 11,
		color: Colors.white70,
	},

	center: { flex: 1, alignItems: "center", justifyContent: "center", paddingVertical: Spacing.xxl, width: "100%" },
	muted: { color: Colors.white70, fontFamily: Fonts.body, fontSize: 14 },

	// Locked modal
	modalBackdrop: {
		flex: 1,
		backgroundColor: "rgba(4, 8, 26, 0.82)",
		alignItems: "center",
		justifyContent: "center",
	},
	modalCard: {
		width: 320,
		backgroundColor: Colors.hoofdkleur,
		borderRadius: Radius.xl,
		borderWidth: 1,
		borderColor: Colors.white15,
		padding: Spacing.lg,
		alignItems: "center",
	},
	modalLockIcon: {
		width: 72,
		height: 72,
		borderRadius: 36,
		backgroundColor: Colors.white15,
		alignItems: "center",
		justifyContent: "center",
		marginBottom: Spacing.base,
	},
	modalTitle: {
		fontFamily: Fonts.display,
		fontStyle: "italic",
		fontSize: 20,
		color: Colors.violetLight,
		letterSpacing: 2,
		marginBottom: 8,
	},
	modalRaceName: {
		fontFamily: Fonts.display,
		fontStyle: "italic",
		fontSize: 22,
		color: Colors.white,
		textAlign: "center",
		marginBottom: 4,
	},
	modalRaceLocation: {
		fontFamily: Fonts.body,
		fontSize: 13,
		color: Colors.white70,
		marginBottom: Spacing.base,
	},
	modalHint: {
		fontFamily: Fonts.body,
		fontSize: 14,
		color: Colors.white70,
		textAlign: "center",
		marginBottom: Spacing.lg,
		paddingHorizontal: Spacing.base,
	},
	modalBtn: {
		width: "100%",
		height: 48,
		borderRadius: Radius.pill,
		backgroundColor: Colors.secundaire,
		alignItems: "center",
		justifyContent: "center",
	},
	modalBtnText: {
		fontFamily: Fonts.bodyBold,
		fontSize: 15,
		fontWeight: "800",
		color: Colors.white,
	},
});
