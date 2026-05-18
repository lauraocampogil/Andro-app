import { Button } from "@/components/Button";
import { CosmicBackground } from "@/components/CosmicBackground";
import { Colors, Fonts, Radius, Spacing } from "@/constants/theme";
import { useAuth } from "@/lib/auth";
import { useFavoritesStore } from "@/lib/favoritesStore";
import { fetchRaceById, Race } from "@/lib/races";
import { createReview, fetchFriendsThatGo, fetchReviewsForRace, Review } from "@/lib/reviews";
import { Image } from "expo-image";
import { useLocalSearchParams, useRouter } from "expo-router";
import { Calendar, Crown, Footprints, Globe, Heart, Maximize2, Minimize2, Minus, Plus, Star, X } from "lucide-react-native";
import React, { useEffect, useState } from "react";
import { Animated, Easing, Pressable, ScrollView, StyleSheet, Text, TextInput, useWindowDimensions, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

type Tab = "info" | "reviews";

export default function RaceDetail() {
	const router = useRouter();
	const { id } = useLocalSearchParams<{ id: string }>();
	const { session } = useAuth();
	const userId = session?.user?.id;
	const { height: SCREEN_H } = useWindowDimensions();

	const { isFavorite, toggleFavorite, loadFavorites } = useFavoritesStore();
	const [race, setRace] = useState<Race | null>(null);
	const [tab, setTab] = useState<Tab>("info");
	const [reviews, setReviews] = useState<Review[]>([]);
	const [friends, setFriends] = useState<{ avatar_url: string | null; display_name: string | null }[]>([]);
	const [tickets, setTickets] = useState(0);
	const [reviewText, setReviewText] = useState("");
	const [reviewRating, setReviewRating] = useState(0);
	const [favLocal, setFavLocal] = useState(false);
	const [expanded, setExpanded] = useState(false);

	const HERO_DEFAULT = 380;
	const HERO_EXPANDED = SCREEN_H - 120;

	const heroHeight = React.useRef(new Animated.Value(HERO_DEFAULT)).current;

	useEffect(() => {
		Animated.timing(heroHeight, {
			toValue: expanded ? HERO_EXPANDED : HERO_DEFAULT,
			duration: 350,
			easing: Easing.inOut(Easing.ease),
			useNativeDriver: false,
		}).start();
	}, [expanded, HERO_EXPANDED]);

	useEffect(() => {
		if (!id) return;
		(async () => {
			const r = await fetchRaceById(id);
			setRace(r);
			const [rev, fr] = await Promise.all([fetchReviewsForRace(id), fetchFriendsThatGo(id)]);
			setReviews(rev);
			setFriends(fr);
		})();
		if (userId) loadFavorites(userId);
	}, [id, userId]);

	useEffect(() => {
		if (race) setFavLocal(isFavorite(race.id));
	}, [race, isFavorite]);

	if (!race) {
		return (
			<View style={styles.loading}>
				<Text style={{ color: Colors.white, fontFamily: Fonts.body }}>Loading...</Text>
			</View>
		);
	}

	const formatDate = (iso: string) => new Date(iso).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
	const pricePerTicket = 44;
	const total = tickets * pricePerTicket;

	const handleToggleFavorite = () => {
		if (!userId) return;
		setFavLocal((prev) => !prev);
		toggleFavorite(userId, race.id);
	};

	return (
		<View style={styles.container}>
			{/* Hero with real image */}
			<Animated.View style={[styles.hero, { height: heroHeight }]}>
				{race.course_image_url ? <Image source={{ uri: race.course_image_url }} style={styles.heroImage} contentFit="cover" /> : <View style={[styles.heroImage, { backgroundColor: Colors.hoofdkleur }]} />}

				<SafeAreaView edges={["top"]} style={styles.heroOverlay}>
					<View style={styles.heroTop}>
						<View style={styles.cityPill}>
							<Text style={styles.cityText}>
								{race.city.toUpperCase()}, {race.country_code}
							</Text>
						</View>
						<Pressable style={styles.closeBtn} onPress={() => router.back()}>
							<X size={20} color={Colors.white} strokeWidth={2.6} />
						</Pressable>
					</View>
				</SafeAreaView>

				{/* Zoom toggle — higher up to leave breathing room above the sheet */}
				<Pressable style={styles.zoomBtn} onPress={() => setExpanded((v) => !v)}>
					{expanded ? <Minimize2 size={18} color={Colors.white} strokeWidth={2.4} /> : <Maximize2 size={18} color={Colors.white} strokeWidth={2.4} />}
				</Pressable>
			</Animated.View>

			{/* Sheet with cosmic background */}
			<View style={styles.sheet}>
				<CosmicBackground>
					<View style={{ flex: 1, paddingTop: Spacing.lg }}>
						<View style={styles.tabs}>
							<Pressable style={[styles.tab, tab === "info" && styles.tabActive]} onPress={() => setTab("info")}>
								<Text style={[styles.tabText, tab === "info" && styles.tabTextActive]}>Info</Text>
							</Pressable>
							<Pressable style={[styles.tab, tab === "reviews" && styles.tabActive]} onPress={() => setTab("reviews")}>
								<Text style={[styles.tabText, tab === "reviews" && styles.tabTextActive]}>Reviews</Text>
							</Pressable>
						</View>

						<View style={styles.metaRow}>
							<View style={styles.metaItem}>
								<Calendar size={14} color={Colors.white} strokeWidth={2.2} />
								<Text style={styles.metaText}>{formatDate(race.race_date)}</Text>
							</View>
							<View style={styles.metaItem}>
								<Footprints size={14} color={Colors.white} strokeWidth={2.2} />
								<Text style={styles.metaText}>{race.level[0].toUpperCase() + race.level.slice(1)}</Text>
							</View>
							{race.is_major ? (
								<View style={styles.metaItem}>
									<Star size={14} color={Colors.white} strokeWidth={2.2} />
									<Text style={styles.metaText}>Major</Text>
								</View>
							) : race.is_superhalf ? (
								<View style={styles.metaItem}>
									<Crown size={14} color={Colors.white} strokeWidth={2.2} />
									<Text style={styles.metaText}>SuperHalf</Text>
								</View>
							) : null}

							<Pressable style={[styles.heartBtn, favLocal && styles.heartBtnActive]} onPress={handleToggleFavorite}>
								<Heart size={18} color={Colors.white} fill={favLocal ? Colors.white : "transparent"} strokeWidth={2.2} />
							</Pressable>
						</View>

						<ScrollView style={{ flex: 1 }} contentContainerStyle={{ paddingBottom: 40 }} showsVerticalScrollIndicator={false}>
							{tab === "info" ? (
								<InfoTab race={race} tickets={tickets} setTickets={setTickets} pricePerTicket={pricePerTicket} total={total} />
							) : (
								<ReviewsTab
									reviews={reviews}
									friends={friends}
									userId={userId}
									raceId={race.id}
									reviewText={reviewText}
									setReviewText={setReviewText}
									reviewRating={reviewRating}
									setReviewRating={setReviewRating}
									onSubmitted={async () => {
										setReviewText("");
										setReviewRating(0);
										const rev = await fetchReviewsForRace(race.id);
										setReviews(rev);
									}}
								/>
							)}
						</ScrollView>
					</View>
				</CosmicBackground>
			</View>
		</View>
	);
}

function InfoTab({ race, tickets, setTickets, pricePerTicket, total }: { race: Race; tickets: number; setTickets: (n: number) => void; pricePerTicket: number; total: number }) {
	return (
		<View style={{ paddingHorizontal: Spacing.lg }}>
			<Text style={styles.sectionTitle}>Race details</Text>

			<DetailRow label="Continent" pills={[race.continent]} icon={<Globe size={14} color={Colors.white} />} />
			<DetailRow label="Course surface" pills={[race.surface]} />

			<View style={{ marginTop: Spacing.base }}>
				<Text style={styles.addressLabel}>Start address:</Text>
				<Text style={styles.addressText}>{race.start_address ?? `${race.city}, ${race.country}`}</Text>
				<Text style={[styles.addressLabel, { marginTop: 8 }]}>Finish address:</Text>
				<Text style={styles.addressText}>{race.finish_address ?? `${race.city}, ${race.country}`}</Text>
			</View>

			<Text style={[styles.sectionTitle, { marginTop: Spacing.xl }]}>Register</Text>
			<View style={styles.registerCard}>
				<View style={styles.registerTop}>
					<View style={{ flex: 1 }}>
						<Text style={styles.registerRace}>{race.name}</Text>
						<Text style={styles.registerInfo}>More information</Text>
					</View>
					<Text style={styles.registerPrice}>{pricePerTicket} EUR</Text>
					<View style={styles.ticketCounter}>
						<Pressable style={styles.counterBtn} onPress={() => setTickets(Math.max(0, tickets - 1))}>
							<Minus size={14} color={Colors.ink} strokeWidth={2.6} />
						</Pressable>
						<Text style={styles.counterNum}>{tickets}</Text>
						<Pressable style={styles.counterBtn} onPress={() => setTickets(tickets + 1)}>
							<Plus size={14} color={Colors.ink} strokeWidth={2.6} />
						</Pressable>
					</View>
				</View>
				<View style={styles.registerBottom}>
					<Text style={styles.registerTickets}>{tickets} tickets selected</Text>
					<Text style={styles.registerTotal}>Total {total} EUR</Text>
					<Pressable style={[styles.registerBtn, tickets === 0 && { opacity: 0.5 }]} disabled={tickets === 0}>
						<Text style={styles.registerBtnText}>Register</Text>
					</Pressable>
				</View>
			</View>

			<Text style={[styles.sectionTitle, { marginTop: Spacing.xl }]}>What's included</Text>
			<View style={styles.includedGrid}>
				{["Card Race", "Photo Service", "Finisher Medal", "Parking", "Event T-shirts", "Drink Stations", "E-certificate", "Nutrition Stations"].map((item) => (
					<View key={item} style={styles.includedItem}>
						<Text style={styles.includedCheck}>✓</Text>
						<Text style={styles.includedText}>{item}</Text>
					</View>
				))}
			</View>
		</View>
	);
}

function DetailRow({ label, pills, icon }: { label: string; pills: string[]; icon?: React.ReactNode }) {
	return (
		<View style={styles.detailRow}>
			<Text style={styles.detailLabel}>{label}</Text>
			<View style={styles.detailPills}>
				{pills.map((p) => (
					<View key={p} style={styles.detailPill}>
						<Text style={styles.detailPillText}>{p}</Text>
					</View>
				))}
				{icon}
			</View>
		</View>
	);
}

function ReviewsTab({
	reviews,
	friends,
	userId,
	raceId,
	reviewText,
	setReviewText,
	reviewRating,
	setReviewRating,
	onSubmitted,
}: {
	reviews: Review[];
	friends: { avatar_url: string | null; display_name: string | null }[];
	userId?: string;
	raceId: string;
	reviewText: string;
	setReviewText: (s: string) => void;
	reviewRating: number;
	setReviewRating: (n: number) => void;
	onSubmitted: () => Promise<void>;
}) {
	const submit = async () => {
		if (!userId || reviewRating === 0) return;
		const ok = await createReview(userId, raceId, reviewRating, reviewText);
		if (ok) await onSubmitted();
	};

	return (
		<View style={{ paddingHorizontal: Spacing.lg }}>
			<Text style={styles.sectionTitle}>Comments</Text>

			{reviews.length === 0 ? (
				<Text style={styles.emptyReviews}>No reviews yet. Be the first to write one!</Text>
			) : (
				reviews.map((r) => (
					<View key={r.id} style={styles.reviewCard}>
						<View style={styles.reviewAvatar}>
							{r.user?.avatar_url ? <Image source={{ uri: r.user.avatar_url }} style={styles.reviewAvatarImg} contentFit="cover" /> : <View style={[styles.reviewAvatarImg, { backgroundColor: Colors.secundaire }]} />}
						</View>
						<Text style={styles.reviewComment}>{r.comment ?? `Rated ${r.rating}/5`}</Text>
					</View>
				))
			)}

			<View style={styles.starsRow}>
				{[1, 2, 3, 4, 5].map((n) => (
					<Pressable key={n} onPress={() => setReviewRating(n)}>
						<Star size={28} color={Colors.white} fill={n <= reviewRating ? Colors.white : "transparent"} strokeWidth={1.5} />
					</Pressable>
				))}
			</View>

			<TextInput value={reviewText} onChangeText={setReviewText} placeholder="Write a review..." placeholderTextColor={Colors.white50} style={styles.reviewInput} multiline />

			<Button label="Write a review" onPress={submit} disabled={reviewRating === 0} />

			{friends.length > 0 && (
				<View style={{ marginTop: Spacing.xl }}>
					<Text style={styles.friendsTitle}>FRIENDS THAT GO</Text>
					<View style={styles.friendsRow}>
						{friends.map((f, i) => (
							<View key={i} style={[styles.friendAvatar, { marginLeft: i === 0 ? 0 : -10 }]}>
								{f.avatar_url ? <Image source={{ uri: f.avatar_url }} style={styles.friendAvatarImg} contentFit="cover" /> : <View style={[styles.friendAvatarImg, { backgroundColor: Colors.secundaire }]} />}
							</View>
						))}
					</View>
				</View>
			)}
		</View>
	);
}

const styles = StyleSheet.create({
	loading: { flex: 1, alignItems: "center", justifyContent: "center", backgroundColor: Colors.hoofdkleur },
	container: { flex: 1, backgroundColor: Colors.hoofdkleur },

	hero: { position: "relative", overflow: "hidden" },
	heroImage: { width: "100%", height: "100%" },
	heroOverlay: { ...StyleSheet.absoluteFillObject, padding: Spacing.lg },
	heroTop: { flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
	cityPill: { backgroundColor: Colors.white, paddingHorizontal: 18, paddingVertical: 12, borderRadius: Radius.pill },
	cityText: { fontFamily: Fonts.display, fontStyle: "italic", fontSize: 15, color: Colors.ink, letterSpacing: 0 },
	closeBtn: { width: 44, height: 44, borderRadius: 22, backgroundColor: Colors.white15, alignItems: "center", justifyContent: "center" },
	zoomBtn: {
		position: "absolute",
		right: Spacing.lg,
		bottom: 30,
		width: 44,
		height: 44,
		borderRadius: 22,
		backgroundColor: Colors.white15,
		alignItems: "center",
		justifyContent: "center",
	},

	sheet: {
		flex: 1,
		borderTopLeftRadius: 40,
		borderTopRightRadius: 40,
		overflow: "hidden",
		marginTop: 0,
	},

	tabs: {
		flexDirection: "row",
		alignSelf: "center",
		backgroundColor: Colors.white15,
		borderRadius: Radius.pill,
		padding: 4,
		marginBottom: Spacing.base,
	},
	tab: { paddingHorizontal: 28, paddingVertical: 9, borderRadius: Radius.pill },
	tabActive: { backgroundColor: Colors.white },
	tabText: { fontFamily: Fonts.bodyBold, fontSize: 14, fontWeight: "700", color: Colors.white },
	tabTextActive: { color: Colors.ink },

	metaRow: { flexDirection: "row", alignItems: "center", gap: Spacing.base, paddingHorizontal: Spacing.lg, marginBottom: Spacing.lg },
	metaItem: { flexDirection: "row", alignItems: "center", gap: 5 },
	metaText: { fontFamily: Fonts.body, fontSize: 13, color: Colors.white },
	heartBtn: {
		marginLeft: "auto",
		width: 38,
		height: 38,
		borderRadius: 19,
		backgroundColor: Colors.secundaire,
		alignItems: "center",
		justifyContent: "center",
	},
	heartBtnActive: { backgroundColor: "#FF5757" },

	sectionTitle: {
		fontFamily: Fonts.display,
		fontStyle: "italic",
		fontSize: 18,
		color: Colors.white,
		letterSpacing: 0,
		marginBottom: Spacing.md,
		textTransform: "uppercase",
	},

	detailRow: { flexDirection: "row", alignItems: "center", gap: 10, marginBottom: 10 },
	detailLabel: { fontFamily: Fonts.body, fontSize: 14, color: Colors.white, minWidth: 110 },
	detailPills: { flexDirection: "row", alignItems: "center", gap: 6 },
	detailPill: { paddingHorizontal: 12, paddingVertical: 5, borderRadius: Radius.pill, borderWidth: 1, borderColor: Colors.white50 },
	detailPillText: { fontFamily: Fonts.body, fontSize: 12, color: Colors.white },

	addressLabel: { fontFamily: Fonts.bodyBold, fontSize: 13, color: Colors.white, fontWeight: "700" },
	addressText: { fontFamily: Fonts.body, fontSize: 13, color: Colors.white70, marginTop: 2 },

	registerCard: { backgroundColor: Colors.white, borderRadius: Radius.lg, padding: Spacing.base },
	registerTop: { flexDirection: "row", alignItems: "center", gap: 10, paddingBottom: 12, borderBottomWidth: 1, borderBottomColor: Colors.ink08 },
	registerRace: { fontFamily: Fonts.bodyBold, fontSize: 14, fontWeight: "800", color: Colors.ink },
	registerInfo: { fontFamily: Fonts.body, fontSize: 11, color: Colors.ink50, marginTop: 2 },
	registerPrice: { fontFamily: Fonts.bodyBold, fontSize: 14, fontWeight: "800", color: Colors.ink },
	ticketCounter: { flexDirection: "row", alignItems: "center", gap: 6 },
	counterBtn: { width: 24, height: 24, borderRadius: 12, backgroundColor: Colors.ink08, alignItems: "center", justifyContent: "center" },
	counterNum: { fontFamily: Fonts.bodyBold, fontSize: 14, fontWeight: "800", color: Colors.ink, minWidth: 14, textAlign: "center" },
	registerBottom: { flexDirection: "row", alignItems: "center", paddingTop: 12, gap: 10 },
	registerTickets: { fontFamily: Fonts.body, fontSize: 12, color: Colors.ink70 },
	registerTotal: { fontFamily: Fonts.bodyBold, fontSize: 13, fontWeight: "800", color: Colors.ink, marginLeft: "auto" },
	registerBtn: { backgroundColor: Colors.secundaire, paddingHorizontal: 18, paddingVertical: 8, borderRadius: Radius.pill },
	registerBtnText: { fontFamily: Fonts.bodyBold, fontSize: 13, fontWeight: "800", color: Colors.white },

	includedGrid: { flexDirection: "row", flexWrap: "wrap" },
	includedItem: { width: "50%", flexDirection: "row", alignItems: "center", gap: 6, marginBottom: 8 },
	includedCheck: { color: Colors.white, fontWeight: "800", fontSize: 14 },
	includedText: { fontFamily: Fonts.body, fontSize: 13, color: Colors.white },

	emptyReviews: { fontFamily: Fonts.body, fontSize: 14, color: Colors.white70, textAlign: "center", paddingVertical: Spacing.lg },
	reviewCard: { flexDirection: "row", alignItems: "center", backgroundColor: Colors.white, borderRadius: Radius.lg, padding: 12, marginBottom: 8, gap: 12 },
	reviewAvatar: { width: 40, height: 40, borderRadius: 20, overflow: "hidden" },
	reviewAvatarImg: { width: "100%", height: "100%" },
	reviewComment: { flex: 1, fontFamily: Fonts.body, fontSize: 13, color: Colors.ink },

	starsRow: { flexDirection: "row", justifyContent: "center", gap: 10, marginTop: Spacing.lg, marginBottom: Spacing.md },
	reviewInput: { minHeight: 80, backgroundColor: Colors.white08, borderRadius: Radius.md, padding: 12, color: Colors.white, fontFamily: Fonts.body, fontSize: 14, marginBottom: Spacing.md, textAlignVertical: "top" },

	friendsTitle: { fontFamily: Fonts.display, fontStyle: "italic", fontSize: 18, color: Colors.white, marginBottom: Spacing.md, textTransform: "uppercase" },
	friendsRow: { flexDirection: "row" },
	friendAvatar: { width: 48, height: 48, borderRadius: 24, borderWidth: 2, borderColor: Colors.hoofdkleur, overflow: "hidden" },
	friendAvatarImg: { width: "100%", height: "100%" },
});
