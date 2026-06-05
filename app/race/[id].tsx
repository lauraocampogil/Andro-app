import { Button } from "@/components/Button";
import { CosmicBackground } from "@/components/CosmicBackground";
import { ZoomableImage } from "@/components/ZoomableImage";
import { Colors, Fonts, FontSizes, Radius, Spacing } from "@/constants/theme";
import { useAuth } from "@/lib/auth";
import { useFavoritesStore } from "@/lib/favoritesStore";
import { fetchVisibleRegistrants, getRegistrationCount, RegisteredUser, registerForRace } from "@/lib/raceRegistrations";
import { fetchRaceById, Race } from "@/lib/races";
import { createReview, fetchFriendsThatGo, fetchReviewsForRace, Review } from "@/lib/reviews";
import { Image } from "expo-image";
import { useLocalSearchParams, useRouter } from "expo-router";
import { Calendar, Crown, Footprints, Globe, Heart, HeartHandshake, Map, Minus, Plus, Star, X } from "lucide-react-native";
import React, { useEffect, useRef, useState } from "react";
import { Animated, Easing, KeyboardAvoidingView, PanResponder, Platform, Pressable, ScrollView, StyleSheet, Text, TextInput, useWindowDimensions, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

type Tab = "info" | "reviews";

const ASSOCIATIONS = [
	{ id: "none", name: "Run for myself", description: "No association" },
	{ id: "unicef", name: "UNICEF", description: "Run to support children worldwide" },
	{ id: "cancer", name: "Cancer Research", description: "Raise funds for cancer research" },
	{ id: "climate", name: "Climate Action", description: "Run for the planet" },
];

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
	const [registrants, setRegistrants] = useState<RegisteredUser[]>([]);
	const [registeredCount, setRegisteredCount] = useState(0);
	const [tickets, setTickets] = useState(0);
	const [association, setAssociation] = useState("none");
	const [reviewText, setReviewText] = useState("");
	const [reviewRating, setReviewRating] = useState(0);
	const [favLocal, setFavLocal] = useState(false);

	// Finger-drag sheet
	const PEEK_OFFSET = SCREEN_H * 0.45;
	const sheetY = useRef(new Animated.Value(SCREEN_H)).current;
	const currentY = useRef(SCREEN_H);
	const dragStart = useRef(0);

	useEffect(() => {
		const subId = sheetY.addListener(({ value }) => {
			currentY.current = value;
		});
		Animated.timing(sheetY, { toValue: 0, duration: 380, easing: Easing.out(Easing.cubic), useNativeDriver: true }).start();
		return () => sheetY.removeListener(subId);
	}, []);

	const snapTo = (up: boolean) => {
		Animated.timing(sheetY, {
			toValue: up ? 0 : PEEK_OFFSET,
			duration: 260,
			easing: Easing.out(Easing.cubic),
			useNativeDriver: true,
		}).start();
	};

	const panResponder = useRef(
		PanResponder.create({
			onMoveShouldSetPanResponder: (_, g) => Math.abs(g.dy) > 4,
			onPanResponderGrant: () => {
				dragStart.current = currentY.current;
			},
			onPanResponderMove: (_, g) => {
				let next = dragStart.current + g.dy;
				if (next < 0) next = 0;
				if (next > PEEK_OFFSET) next = PEEK_OFFSET;
				sheetY.setValue(next);
			},
			onPanResponderRelease: (_, g) => {
				if (g.vy > 0.5) snapTo(false);
				else if (g.vy < -0.5) snapTo(true);
				else snapTo(currentY.current > PEEK_OFFSET / 2 ? false : true);
			},
		}),
	).current;

	useEffect(() => {
		if (!id) return;
		(async () => {
			const r = await fetchRaceById(id);
			setRace(r);
			const [rev, fr] = await Promise.all([fetchReviewsForRace(id), fetchFriendsThatGo(id)]);
			setReviews(rev);
			setFriends(fr);
			if (userId) {
				const [regs, count] = await Promise.all([fetchVisibleRegistrants(id, userId), getRegistrationCount(id)]);
				setRegistrants(regs);
				setRegisteredCount(count);
			}
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
	const pricePerTicket = race.price_eur ?? 44;
	const total = tickets * pricePerTicket;
	const routeImage = race.route_image_url ?? race.course_image_url ?? null;

	const handleToggleFavorite = () => {
		if (!userId) return;
		setFavLocal((prev) => !prev);
		toggleFavorite(userId, race.id);
	};

	const handleRegister = async () => {
		if (!userId || tickets === 0) return;
		const ok = await registerForRace(race.id, userId, tickets);
		if (ok) {
			const [regs, count] = await Promise.all([fetchVisibleRegistrants(race.id, userId), getRegistrationCount(race.id)]);
			setRegistrants(regs);
			setRegisteredCount(count);
		}
	};

	return (
		<View style={styles.container}>
			{/* Hero — the route lives here, pinch to zoom */}
			<View style={styles.hero}>
				{routeImage ? (
					<ZoomableImage uri={routeImage} style={styles.heroImage} />
				) : (
					<View style={[styles.heroImage, styles.heroPlaceholder]}>
						<Map size={40} color={Colors.white50} strokeWidth={2} />
						<Text style={styles.heroPlaceholderText}>Route map coming soon</Text>
					</View>
				)}

				<SafeAreaView edges={["top"]} style={styles.heroOverlay} pointerEvents="box-none">
					<View style={styles.heroTop} pointerEvents="box-none">
						<View style={styles.cityPill}>
							<Text style={styles.cityText}>
								{race.city.toUpperCase()}, {race.country_code}
							</Text>
						</View>
						<Pressable style={styles.closeBtn} onPress={() => router.back()}>
							<X size={20} color={Colors.white} strokeWidth={2.6} />
						</Pressable>
					</View>
					<View style={styles.routeBadge}>
						<Map size={13} color={Colors.white} strokeWidth={2.4} />
						<Text style={styles.routeBadgeText}>Pinch to zoom · {race.distance_km} km</Text>
					</View>
				</SafeAreaView>
			</View>

			{/* Draggable sheet */}
			<Animated.View style={[styles.sheet, { transform: [{ translateY: sheetY }] }]}>
				<CosmicBackground>
					<KeyboardAvoidingView behavior={Platform.OS === "ios" ? "padding" : undefined} keyboardVerticalOffset={Platform.OS === "ios" ? 0 : 80} style={{ flex: 1 }}>
						{/* Drag handle */}
						<View style={styles.handleZone} {...panResponder.panHandlers}>
							<View style={styles.handleBar} />
							<Text style={styles.handleHintText}>Drag to see the route</Text>
						</View>

						<View style={{ flex: 1 }}>
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

							<ScrollView style={{ flex: 1 }} contentContainerStyle={{ paddingBottom: 60 }} showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">
								{tab === "info" ? (
									<InfoTab
										race={race}
										tickets={tickets}
										setTickets={setTickets}
										pricePerTicket={pricePerTicket}
										total={total}
										association={association}
										setAssociation={setAssociation}
										registrants={registrants}
										registeredCount={registeredCount}
										onRegister={handleRegister}
									/>
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
					</KeyboardAvoidingView>
				</CosmicBackground>
			</Animated.View>
		</View>
	);
}

function InfoTab({
	race,
	tickets,
	setTickets,
	pricePerTicket,
	total,
	association,
	setAssociation,
	registrants,
	registeredCount,
	onRegister,
}: {
	race: Race;
	tickets: number;
	setTickets: (n: number) => void;
	pricePerTicket: number;
	total: number;
	association: string;
	setAssociation: (s: string) => void;
	registrants: RegisteredUser[];
	registeredCount: number;
	onRegister: () => void;
}) {
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

			{/* Association */}
			<Text style={[styles.sectionTitle, { marginTop: Spacing.xl }]}>Run with an association</Text>
			<Text style={styles.associationIntro}>Dedicate your race to a cause. A part of your ticket goes to the association.</Text>
			{ASSOCIATIONS.map((a) => {
				const selected = association === a.id;
				return (
					<Pressable key={a.id} style={[styles.associationItem, selected && styles.associationItemActive]} onPress={() => setAssociation(a.id)}>
						<View style={[styles.associationIcon, selected && { backgroundColor: Colors.secundaire }]}>
							<HeartHandshake size={18} color={Colors.white} strokeWidth={2.2} />
						</View>
						<View style={{ flex: 1 }}>
							<Text style={styles.associationName}>{a.name}</Text>
							<Text style={styles.associationDesc}>{a.description}</Text>
						</View>
						{selected && <Text style={styles.associationCheck}>✓</Text>}
					</Pressable>
				);
			})}

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
					<Pressable style={[styles.registerBtn, tickets === 0 && { opacity: 0.5 }]} disabled={tickets === 0} onPress={onRegister}>
						<Text style={styles.registerBtnText}>Register</Text>
					</Pressable>
				</View>
			</View>

			{/* Registered runners (privacy-aware) */}
			{registrants.length > 0 && (
				<View style={{ marginTop: Spacing.lg }}>
					<Text style={styles.addressLabel}>{registeredCount} runners registered</Text>
					<View style={[styles.friendsRow, { marginTop: 8 }]}>
						{registrants.slice(0, 10).map((r, i) => (
							<View key={r.id} style={[styles.friendAvatar, { marginLeft: i === 0 ? 0 : -10 }]}>
								{r.avatar_url ? <Image source={{ uri: r.avatar_url }} style={styles.friendAvatarImg} contentFit="cover" /> : <View style={[styles.friendAvatarImg, { backgroundColor: Colors.secundaire }]} />}
							</View>
						))}
					</View>
				</View>
			)}

			<Text style={[styles.sectionTitle, { marginTop: Spacing.xl }]}>What's included</Text>
			{(race.included_items ?? []).map((item) => (
				<View key={item} style={styles.includedItem}>
					<Text style={styles.includedCheck}>✓</Text>
					<Text style={styles.includedText}>{item}</Text>
				</View>
			))}
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
						<View style={{ flex: 1 }}>
							<Text style={styles.reviewUserName}>{r.user?.display_name ?? "Anonymous"}</Text>
							<View style={{ flexDirection: "row", gap: 2, marginVertical: 3 }}>
								{[1, 2, 3, 4, 5].map((n) => (
									<Star key={n} size={12} color="#FFD15C" fill={n <= r.rating ? "#FFD15C" : "transparent"} strokeWidth={1.5} />
								))}
							</View>
							{r.comment ? <Text style={styles.reviewComment}>{r.comment}</Text> : null}
						</View>
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
					<Text style={styles.friendsTitle}>Friends that go</Text>
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

	hero: { ...StyleSheet.absoluteFillObject },
	heroImage: { width: "100%", height: "100%" },
	heroPlaceholder: { backgroundColor: Colors.hoofdkleur, alignItems: "center", justifyContent: "center", gap: 10 },
	heroPlaceholderText: { fontFamily: Fonts.body, fontSize: 14, color: Colors.white50 },
	heroOverlay: { ...StyleSheet.absoluteFillObject, padding: Spacing.lg },
	heroTop: { flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
	cityPill: { backgroundColor: Colors.white, paddingHorizontal: 18, paddingVertical: 12, borderRadius: Radius.pill },
	cityText: { fontFamily: Fonts.display, fontStyle: "italic", fontSize: 15, color: Colors.ink, letterSpacing: 0 },
	closeBtn: { width: 44, height: 44, borderRadius: 22, backgroundColor: Colors.hoofdkleur, alignItems: "center", justifyContent: "center" },
	routeBadge: { flexDirection: "row", alignItems: "center", gap: 6, alignSelf: "flex-start", marginTop: 14, backgroundColor: "rgba(4,8,26,0.6)", paddingHorizontal: 12, paddingVertical: 7, borderRadius: Radius.pill },
	routeBadgeText: { fontFamily: Fonts.bodyBold, fontSize: 12, fontWeight: "700", color: Colors.white },

	sheet: { position: "absolute", left: 0, right: 0, top: 300, bottom: 0, borderTopLeftRadius: 40, borderTopRightRadius: 40, overflow: "hidden" },

	handleZone: { alignItems: "center", paddingTop: 12, paddingBottom: 8 },
	handleBar: { width: 44, height: 5, borderRadius: 3, backgroundColor: Colors.white30 },
	handleHintText: { fontFamily: Fonts.body, fontSize: 11, color: Colors.white70, marginTop: 6 },

	tabs: { flexDirection: "row", alignSelf: "center", backgroundColor: Colors.white15, borderRadius: Radius.pill, padding: 4, marginBottom: Spacing.base, marginTop: 4 },
	tab: { paddingHorizontal: 28, paddingVertical: 9, borderRadius: Radius.pill },
	tabActive: { backgroundColor: Colors.white },
	tabText: { fontFamily: Fonts.bodyBold, fontSize: 14, fontWeight: "700", color: Colors.white },
	tabTextActive: { color: Colors.ink },

	metaRow: { flexDirection: "row", alignItems: "center", gap: Spacing.base, paddingHorizontal: Spacing.lg, marginBottom: Spacing.lg },
	metaItem: { flexDirection: "row", alignItems: "center", gap: 5 },
	metaText: { fontFamily: Fonts.body, fontSize: 13, color: Colors.white },
	heartBtn: { marginLeft: "auto", width: 38, height: 38, borderRadius: 19, backgroundColor: Colors.secundaire, alignItems: "center", justifyContent: "center" },
	heartBtnActive: { backgroundColor: "#FF5757" },

	sectionTitle: { fontFamily: Fonts.display, fontStyle: "italic", fontSize: FontSizes.h3, color: Colors.white, letterSpacing: 0, marginBottom: Spacing.md },

	detailRow: { flexDirection: "row", alignItems: "center", gap: 10, marginBottom: 10 },
	detailLabel: { fontFamily: Fonts.body, fontSize: 14, color: Colors.white, minWidth: 110 },
	detailPills: { flexDirection: "row", alignItems: "center", gap: 6 },
	detailPill: { paddingHorizontal: 12, paddingVertical: 5, borderRadius: Radius.pill, borderWidth: 1, borderColor: Colors.white50 },
	detailPillText: { fontFamily: Fonts.body, fontSize: 12, color: Colors.white },

	addressLabel: { fontFamily: Fonts.bodyBold, fontSize: 13, color: Colors.white, fontWeight: "700" },
	addressText: { fontFamily: Fonts.body, fontSize: 13, color: Colors.white70, marginTop: 2 },

	associationIntro: { fontFamily: Fonts.body, fontSize: 13, color: Colors.white70, marginBottom: Spacing.md },
	associationItem: { flexDirection: "row", alignItems: "center", gap: 12, padding: 12, backgroundColor: Colors.white08, borderRadius: Radius.lg, borderWidth: 1, borderColor: Colors.white15, marginBottom: 8 },
	associationItemActive: { borderColor: Colors.secundaire, backgroundColor: "rgba(91, 88, 235, 0.18)" },
	associationIcon: { width: 38, height: 38, borderRadius: 19, backgroundColor: Colors.white15, alignItems: "center", justifyContent: "center" },
	associationName: { fontFamily: Fonts.bodyBold, fontSize: 14, fontWeight: "800", color: Colors.white },
	associationDesc: { fontFamily: Fonts.body, fontSize: 12, color: Colors.white70, marginTop: 2 },
	associationCheck: { fontFamily: Fonts.bodyBold, fontSize: 18, color: Colors.secundaire },

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

	includedItem: { flexDirection: "row", alignItems: "center", gap: 6, marginBottom: 8 },
	includedCheck: { color: Colors.white, fontWeight: "800", fontSize: 14 },
	includedText: { fontFamily: Fonts.body, fontSize: 13, color: Colors.white },

	emptyReviews: { fontFamily: Fonts.body, fontSize: 14, color: Colors.white70, textAlign: "center", paddingVertical: Spacing.lg },
	reviewCard: { flexDirection: "row", alignItems: "flex-start", backgroundColor: Colors.white, borderRadius: Radius.lg, padding: 12, marginBottom: 8, gap: 12 },
	reviewAvatar: { width: 40, height: 40, borderRadius: 20, overflow: "hidden" },
	reviewAvatarImg: { width: "100%", height: "100%" },
	reviewUserName: { fontFamily: Fonts.bodyBold, fontSize: 13, fontWeight: "800", color: Colors.ink },
	reviewComment: { fontFamily: Fonts.body, fontSize: 13, color: Colors.ink },

	starsRow: { flexDirection: "row", justifyContent: "center", gap: 10, marginTop: Spacing.lg, marginBottom: Spacing.md },
	reviewInput: { minHeight: 80, backgroundColor: Colors.white08, borderRadius: Radius.md, padding: 12, color: Colors.white, fontFamily: Fonts.body, fontSize: 14, marginBottom: Spacing.md, textAlignVertical: "top" },

	friendsTitle: { fontFamily: Fonts.display, fontStyle: "italic", fontSize: FontSizes.h3, color: Colors.white, marginBottom: Spacing.md },
	friendsRow: { flexDirection: "row" },
	friendAvatar: { width: 48, height: 48, borderRadius: 24, borderWidth: 2, borderColor: Colors.hoofdkleur, overflow: "hidden" },
	friendAvatarImg: { width: "100%", height: "100%" },
});
