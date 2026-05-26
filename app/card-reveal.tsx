import { Button } from "@/components/Button";
import { CosmicBackground } from "@/components/CosmicBackground";
import { Colors, Fonts, FontSizes, Radius, Spacing } from "@/constants/theme";
import { cardBack, resolveCardImage } from "@/lib/cardAssets";
import { getRevealStatus } from "@/lib/races";
import { supabase } from "@/lib/supabase";
import { useLocalSearchParams, useRouter } from "expo-router";
import React, { useEffect, useMemo, useState } from "react";
import { Image, StyleSheet, Text, View } from "react-native";
import Animated, { Easing, runOnJS, useAnimatedStyle, useSharedValue, withDelay, withSpring, withTiming } from "react-native-reanimated";
import { SafeAreaView } from "react-native-safe-area-context";

const TOTAL_CARDS = 8;

type CardData = {
	id: string;
	qr_code: string;
	rarity: string;
	creature_name: string;
	creature_image_url: string;
	race: {
		name: string;
		city: string;
		country: string;
		country_code?: string;
		continent?: string;
	};
};

type RevealStatus = { isFirstOfContinent: boolean; allSixComplete: boolean };

export default function CardReveal() {
	const router = useRouter();
	const params = useLocalSearchParams<{ qr: string; already?: string }>();
	const qrCode = params.qr;
	const alreadyCollected = params.already === "true";

	const [card, setCard] = useState<CardData | null>(null);
	const [unlockedCount, setUnlockedCount] = useState(0);
	const [showContent, setShowContent] = useState(false);
	const [revealStatus, setRevealStatus] = useState<RevealStatus | null>(null);

	const flipValue = useSharedValue(0);
	const scale = useSharedValue(0.5);
	const opacity = useSharedValue(0);

	useEffect(() => {
		const loadCard = async () => {
			if (!qrCode) return;

			const { data: cardData } = await supabase.from("cards").select("*, race:races(name, city, country, country_code, continent)").eq("qr_code", qrCode).maybeSingle();

			if (cardData) setCard(cardData as CardData);

			const {
				data: { user },
			} = await supabase.auth.getUser();
			if (user) {
				const { count } = await supabase.from("user_cards").select("*", { count: "exact", head: true }).eq("user_id", user.id);
				setUnlockedCount(count || 0);

				// Decide which animation Continue should trigger
				if (cardData && !alreadyCollected && (cardData as CardData).race?.continent) {
					const status = await getRevealStatus(user.id, (cardData as CardData).race.continent!, (cardData as CardData).id);
					setRevealStatus(status);
				}
			}
		};

		loadCard();
	}, [qrCode, alreadyCollected]);

	useEffect(() => {
		if (!card) return;

		scale.value = withSpring(1, { damping: 12, stiffness: 100 });
		opacity.value = withTiming(1, { duration: 400 });

		flipValue.value = withDelay(
			800,
			withTiming(1, { duration: 800, easing: Easing.inOut(Easing.ease) }, (finished) => {
				if (finished) runOnJS(setShowContent)(true);
			}),
		);
	}, [card]);

	const frontAnimatedStyle = useAnimatedStyle(() => {
		const rotateY = `${flipValue.value * 180 + 180}deg`;
		return {
			transform: [{ scale: scale.value }, { rotateY }],
		};
	});

	const backAnimatedStyle = useAnimatedStyle(() => {
		const rotateY = `${flipValue.value * 180}deg`;
		return {
			transform: [{ scale: scale.value }, { rotateY }],
		};
	});

	const contentAnimatedStyle = useAnimatedStyle(() => ({
		opacity: withTiming(showContent ? 1 : 0, { duration: 500 }),
	}));

	const cardImage = useMemo(() => (card ? resolveCardImage(card) : null), [card]);

	const handleContinue = () => {
		if (alreadyCollected) {
			router.replace("/(tabs)/home" as any);
			return;
		}
		if (revealStatus?.allSixComplete) {
			router.replace({ pathname: "/(tabs)/home", params: { allContinentsComplete: "true" } } as any);
		} else if (revealStatus?.isFirstOfContinent && card?.race?.continent) {
			router.replace({ pathname: "/(tabs)/home", params: { unlockedContinent: card.race.continent } } as any);
		} else {
			router.replace("/(tabs)/home" as any);
		}
	};

	if (!card) {
		return (
			<CosmicBackground>
				<SafeAreaView style={styles.container}>
					<Text style={styles.loadingText}>Loading...</Text>
				</SafeAreaView>
			</CosmicBackground>
		);
	}

	const glowColor = card.rarity === "legendary" ? "#FFD15C" : "#5B58EB";

	return (
		<CosmicBackground>
			<SafeAreaView style={styles.container}>
				<View style={styles.header}>
					<Text style={styles.headerText}>{alreadyCollected ? "Already in your collection" : "Card Unlocked!"}</Text>
				</View>

				<View style={styles.cardWrapper}>
					<Animated.View style={[styles.card, styles.cardBack, backAnimatedStyle]}>
						<Image source={cardBack} style={styles.cardImage} resizeMode="cover" />
					</Animated.View>

					<Animated.View style={[styles.card, styles.cardFront, frontAnimatedStyle]}>
						{cardImage ? (
							<Image source={cardImage} style={styles.cardImage} resizeMode="cover" />
						) : (
							<View style={[styles.cardPlaceholder, { backgroundColor: glowColor + "30" }]}>
								<Text style={styles.cardPlaceholderEmoji}>{card.rarity === "legendary" ? "👑" : "✨"}</Text>
								<Text style={styles.cardPlaceholderName}>{card.creature_name}</Text>
							</View>
						)}
					</Animated.View>
				</View>

				<Animated.View style={[styles.info, contentAnimatedStyle]}>
					<Text style={styles.creatureName}>{card.creature_name}</Text>
					<Text style={styles.raceName}>{card.race.name}</Text>
					<Text style={styles.raceLocation}>
						{card.race.city}, {card.race.country}
					</Text>

					<View style={styles.counter}>
						<Text style={styles.counterNum}>{unlockedCount}</Text>
						<Text style={styles.counterTotal}> / {TOTAL_CARDS}</Text>
						<Text style={styles.counterLabel}>cards collected</Text>
					</View>
				</Animated.View>

				<Animated.View style={[styles.buttonWrapper, contentAnimatedStyle]}>
					<Button label="Continue" onPress={handleContinue} />
				</Animated.View>
			</SafeAreaView>
		</CosmicBackground>
	);
}

const CARD_WIDTH = 260;
const CARD_HEIGHT = 360;

const styles = StyleSheet.create({
	container: { flex: 1, alignItems: "center", justifyContent: "space-between", paddingVertical: Spacing.xl },
	loadingText: { color: Colors.white, fontFamily: Fonts.body },
	header: { alignItems: "center", marginTop: Spacing.lg },
	headerText: { fontFamily: Fonts.display, fontSize: FontSizes.h2, fontStyle: "italic", color: Colors.violetLight, letterSpacing: 1 },
	cardWrapper: { width: CARD_WIDTH, height: CARD_HEIGHT, alignItems: "center", justifyContent: "center", position: "relative" },
	glow: { position: "absolute", width: CARD_WIDTH + 60, height: CARD_HEIGHT + 60, borderRadius: CARD_WIDTH, opacity: 0.3 },
	card: {
		position: "absolute",
		width: CARD_WIDTH,
		height: CARD_HEIGHT,
		borderRadius: Radius.xl,
		backgroundColor: Colors.hoofdkleur,
		shadowColor: "#000",
		shadowOffset: { width: 0, height: 12 },
		shadowOpacity: 0.5,
		shadowRadius: 24,
		elevation: 12,
		overflow: "hidden",
		backfaceVisibility: "hidden",
	},
	cardBack: { alignItems: "center", justifyContent: "center" },
	cardFront: { backgroundColor: "transparent" },
	cardImage: { width: "100%", height: "100%", backgroundColor: "transparent" },
	cardPlaceholder: { flex: 1, alignItems: "center", justifyContent: "center", padding: Spacing.lg },
	cardPlaceholderEmoji: { fontSize: 64, marginBottom: Spacing.base },
	cardPlaceholderName: { fontFamily: Fonts.display, fontSize: FontSizes.h1, fontStyle: "italic", color: Colors.ink, textAlign: "center" },
	info: { alignItems: "center", paddingHorizontal: Spacing.xl },
	creatureName: { fontFamily: Fonts.display, fontSize: FontSizes.h1, fontStyle: "italic", color: Colors.white, marginBottom: 4 },
	raceName: { fontFamily: Fonts.bodyBold, fontSize: FontSizes.body, color: Colors.violetLight, marginBottom: 2 },
	raceLocation: { fontFamily: Fonts.body, fontSize: FontSizes.small, color: Colors.white50 ?? "#ffffff80", marginBottom: Spacing.lg },
	counter: { flexDirection: "row", alignItems: "baseline", flexWrap: "wrap", justifyContent: "center", backgroundColor: "rgba(255, 255, 255, 0.1)", paddingHorizontal: Spacing.lg, paddingVertical: Spacing.base, borderRadius: Radius.lg },
	counterNum: { fontFamily: Fonts.display, fontSize: 32, fontStyle: "italic", color: Colors.white },
	counterTotal: { fontFamily: Fonts.bodyBold, fontSize: FontSizes.body, color: Colors.violetLight },
	counterLabel: { fontFamily: Fonts.body, fontSize: FontSizes.small, color: Colors.white, marginLeft: Spacing.base, opacity: 0.8 },
	buttonWrapper: { width: "100%", paddingHorizontal: Spacing.xl },
});
