import { supabase } from "@/lib/supabase";

export type Race = {
	id: string;
	name: string;
	city: string;
	country: string;
	country_code: string;
	continent: string;
	distance_km: number;
	race_date: string;
	surface: string;
	level: "beginner" | "intermediate" | "advanced";
	is_major: boolean;
	is_superhalf: boolean;
	lat: number;
	lng: number;
	course_image_url?: string | null;
	start_address?: string | null;
	finish_address?: string | null;
	price_eur?: number | null;
	route_image_url?: string | null;
	included_items?: string[] | null;
};

export type CompletedRace = {
	user_id: string;
	race_id: string;
	scanned_at: string;
	finish_time?: string | null;
	finish_pace?: string | null;
	race: Race;
};
export async function fetchRaceById(id: string): Promise<Race | null> {
	const { data, error } = await supabase.from("races").select("*").eq("id", id).maybeSingle();
	if (error || !data) return null;
	return data as Race;
}

export async function fetchAllRaces(): Promise<Race[]> {
	const { data, error } = await supabase.from("races").select("*").order("race_date", { ascending: true });

	if (error) {
		console.error("fetchAllRaces error:", error);
		return [];
	}
	return data || [];
}

export async function fetchUserCompletedRaces(userId: string): Promise<CompletedRace[]> {
	const { data: userCards, error: ucError } = await supabase.from("user_cards").select("*").eq("user_id", userId);

	if (ucError) {
		console.error("user_cards fetch error:", ucError);
		return [];
	}
	if (!userCards || userCards.length === 0) return [];

	const cardIds = userCards.map((uc: any) => uc.card_id).filter(Boolean);
	if (cardIds.length === 0) return [];

	const { data: cards, error: cError } = await supabase.from("cards").select("id, race_id").in("id", cardIds);

	if (cError || !cards) {
		console.error("cards fetch error:", cError);
		return [];
	}

	const raceIds = cards.map((c: any) => c.race_id).filter(Boolean);
	if (raceIds.length === 0) return [];

	const { data: races, error: rError } = await supabase.from("races").select("*").in("id", raceIds);

	if (rError || !races) {
		console.error("races fetch error:", rError);
		return [];
	}

	// Step 4: Combine everything into CompletedRace objects
	const result: CompletedRace[] = [];
	for (const userCard of userCards) {
		const card = cards.find((c: any) => c.id === userCard.card_id);
		if (!card) continue;
		const race = races.find((r: any) => r.id === card.race_id);
		if (!race) continue;
		result.push({
			user_id: userCard.user_id,
			race_id: race.id,
			scanned_at: userCard.scanned_at || new Date().toISOString(),
			finish_time: userCard.finish_time || null,
			finish_pace: userCard.finish_pace || null,
			race: race as Race,
		});
	}

	return result;
}

export function getCompletedCountryCodes(completedRaces: CompletedRace[]): string[] {
	const codes = new Set<string>();
	completedRaces.forEach((cr) => {
		if (cr.race?.country_code) {
			codes.add(cr.race.country_code);
		}
	});
	return Array.from(codes);
}
export function getCompletedContinents(completedRaces: CompletedRace[]): string[] {
	const continents = new Set<string>();
	completedRaces.forEach((cr) => {
		if (cr.race?.continent) {
			continents.add(cr.race.continent);
		}
	});
	return Array.from(continents);
}

export async function markRaceAsCompleted(userId: string, raceId: string, finishTime?: string, finishPace?: string): Promise<{ success: boolean; alreadyCollected: boolean; race?: Race }> {
	const { data: card, error: cError } = await supabase.from("cards").select("id").eq("race_id", raceId).limit(1).maybeSingle();

	if (cError || !card) {
		console.error("No card found for race:", raceId);
		return { success: false, alreadyCollected: false };
	}

	const { data: existing } = await supabase.from("user_cards").select("id").eq("user_id", userId).eq("card_id", card.id).maybeSingle();

	if (existing) {
		return { success: false, alreadyCollected: true };
	}

	const { error: insertError } = await supabase.from("user_cards").insert({
		user_id: userId,
		card_id: card.id,
		scanned_at: new Date().toISOString(),
		finish_time: finishTime || null,
		finish_pace: finishPace || null,
	});

	if (insertError) {
		console.error("markRaceAsCompleted insert error:", insertError);
		return { success: false, alreadyCollected: false };
	}

	const { data: race } = await supabase.from("races").select("*").eq("id", raceId).single();

	return { success: true, alreadyCollected: false, race: race as Race };
}

export type ProgressStats = {
	countriesCount: number;
	continentsCount: number;
	totalContinents: number;
	worldPercent: number;
};

export function computeProgressStats(completedRaces: CompletedRace[]): ProgressStats {
	const countries = getCompletedCountryCodes(completedRaces);
	const continents = getCompletedContinents(completedRaces);

	const TOTAL_CONTINENTS = 6;
	const TOTAL_COUNTRIES = 195;

	return {
		countriesCount: countries.length,
		continentsCount: continents.length,
		totalContinents: TOTAL_CONTINENTS,
		worldPercent: Math.round((countries.length / TOTAL_COUNTRIES) * 100),
	};
}

export async function markCardScanned(
	userId: string,
	qrCode: string,
): Promise<{
	success: boolean;
	alreadyCollected: boolean;
	invalidCode: boolean;
	card?: any;
	race?: Race;
}> {
	const { data: card, error: cardError } = await supabase.from("cards").select("*, race:races(*)").eq("qr_code", qrCode).maybeSingle();

	if (cardError || !card) {
		console.warn("❌ Card not found for QR:", qrCode);
		return {
			success: false,
			alreadyCollected: false,
			invalidCode: true,
		};
	}

	const { data: existing } = await supabase.from("user_cards").select("id").eq("user_id", userId).eq("card_id", card.id).maybeSingle();

	if (existing) {
		return {
			success: false,
			alreadyCollected: true,
			invalidCode: false,
			card,
			race: card.race as Race,
		};
	}

	const { error: insertError } = await supabase.from("user_cards").insert({
		user_id: userId,
		card_id: card.id,
		scanned_at: new Date().toISOString(),
	});

	if (insertError) {
		console.error("Insert error:", insertError);
		return {
			success: false,
			alreadyCollected: false,
			invalidCode: false,
		};
	}

	return {
		success: true,
		alreadyCollected: false,
		invalidCode: false,
		card,
		race: card.race as Race,
	};
}

export async function saveRaceResult(userId: string, cardId: string, finishTime: string, finishPace: string): Promise<boolean> {
	const { error } = await supabase
		.from("user_cards")
		.update({
			finish_time: finishTime.trim() || null,
			finish_pace: finishPace.trim() || null,
		})
		.eq("user_id", userId)
		.eq("card_id", cardId);
	if (error) console.error("saveRaceResult error:", error);
	return !error;
}

export async function isFirstCardOfContinent(userId: string, continent: string, justScannedCardId: string): Promise<boolean> {
	// All cards the user owns, with their continent
	const { data: userCards } = await supabase.from("user_cards").select("card_id, card:cards(race:races(continent))").eq("user_id", userId);

	if (!userCards) return true;

	// Count cards in this continent OTHER than the one just scanned
	const others = userCards.filter((uc: any) => uc.card?.race?.continent === continent && uc.card_id !== justScannedCardId);
	return others.length === 0;
}

export async function getUnlockedContinentCount(userId: string): Promise<number> {
	const { data: userCards } = await supabase.from("user_cards").select("card:cards(race:races(continent))").eq("user_id", userId);

	if (!userCards) return 0;
	const continents = new Set(userCards.map((uc: any) => uc.card?.race?.continent).filter(Boolean));
	return continents.size;
}

export async function getRevealStatus(userId: string, continent: string, justScannedCardId: string): Promise<{ isFirstOfContinent: boolean; allSixComplete: boolean }> {
	const { data: userCards } = await supabase.from("user_cards").select("card_id, card:cards(race:races(continent))").eq("user_id", userId);

	const owned = userCards ?? [];
	const continentsOwned = new Set(owned.map((uc: any) => uc.card?.race?.continent).filter(Boolean));

	const othersInContinent = owned.filter((uc: any) => uc.card?.race?.continent === continent && uc.card_id !== justScannedCardId);

	return {
		isFirstOfContinent: othersInContinent.length === 0,
		allSixComplete: continentsOwned.size >= 6,
	};
}
