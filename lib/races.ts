import { supabase } from "@/lib/supabase";

// Race type (matches Supabase schema)
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
};

// User's completed race (joined from user_cards → cards → races)
export type CompletedRace = {
	user_id: string;
	race_id: string;
	scanned_at: string;
	finish_time?: string | null;
	finish_pace?: string | null;
	race: Race;
};

/**
 * Fetch all races from Supabase
 */
export async function fetchAllRaces(): Promise<Race[]> {
	const { data, error } = await supabase.from("races").select("*").order("race_date", { ascending: true });

	if (error) {
		console.error("fetchAllRaces error:", error);
		return [];
	}
	return data || [];
}

/**
 * Fetch all races completed by a user.
 * Flow: user_cards → cards → races (via card_id, then race_id).
 */
export async function fetchUserCompletedRaces(userId: string): Promise<CompletedRace[]> {
	// Step 1: Get user_cards rows for this user
	const { data: userCards, error: ucError } = await supabase.from("user_cards").select("*").eq("user_id", userId);

	if (ucError) {
		console.error("user_cards fetch error:", ucError);
		return [];
	}
	if (!userCards || userCards.length === 0) return [];

	// Step 2: Get cards (which have race_id)
	const cardIds = userCards.map((uc: any) => uc.card_id).filter(Boolean);
	if (cardIds.length === 0) return [];

	const { data: cards, error: cError } = await supabase.from("cards").select("id, race_id").in("id", cardIds);

	if (cError || !cards) {
		console.error("cards fetch error:", cError);
		return [];
	}

	// Step 3: Get races
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

/**
 * Get unique country codes (ISO_A3) from completed races.
 * Used to color the globe.
 */
export function getCompletedCountryCodes(completedRaces: CompletedRace[]): string[] {
	const codes = new Set<string>();
	completedRaces.forEach((cr) => {
		if (cr.race?.country_code) {
			codes.add(cr.race.country_code);
		}
	});
	return Array.from(codes);
}

/**
 * Get unique continents from completed races.
 */
export function getCompletedContinents(completedRaces: CompletedRace[]): string[] {
	const continents = new Set<string>();
	completedRaces.forEach((cr) => {
		if (cr.race?.continent) {
			continents.add(cr.race.continent);
		}
	});
	return Array.from(continents);
}

/**
 * Mark a race as completed by inserting a user_cards row.
 * Called after a successful QR scan.
 */
export async function markRaceAsCompleted(userId: string, raceId: string, finishTime?: string, finishPace?: string): Promise<{ success: boolean; alreadyCollected: boolean; race?: Race }> {
	// Step 1: Find a card for this race
	const { data: card, error: cError } = await supabase.from("cards").select("id").eq("race_id", raceId).limit(1).maybeSingle();

	if (cError || !card) {
		console.error("No card found for race:", raceId);
		return { success: false, alreadyCollected: false };
	}

	// Step 2: Check if already collected
	const { data: existing } = await supabase.from("user_cards").select("id").eq("user_id", userId).eq("card_id", card.id).maybeSingle();

	if (existing) {
		return { success: false, alreadyCollected: true };
	}

	// Step 3: Insert user_cards row
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

	// Step 4: Return race details for the reveal animation
	const { data: race } = await supabase.from("races").select("*").eq("id", raceId).single();

	return { success: true, alreadyCollected: false, race: race as Race };
}

/**
 * Compute progress stats from completed races
 */
export type ProgressStats = {
	countriesCount: number;
	continentsCount: number;
	totalContinents: number;
	worldPercent: number;
};

export function computeProgressStats(completedRaces: CompletedRace[]): ProgressStats {
	const countries = getCompletedCountryCodes(completedRaces);
	const continents = getCompletedContinents(completedRaces);

	const TOTAL_CONTINENTS = 7;
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
	// Step 1: Find the card by qr_code
	const { data: card, error: cardError } = await supabase.from("cards").select("*, race:races(*)").eq("qr_code", qrCode).maybeSingle();

	if (cardError || !card) {
		console.warn("❌ Card not found for QR:", qrCode);
		return {
			success: false,
			alreadyCollected: false,
			invalidCode: true,
		};
	}

	// Step 2: Check if already collected by this user
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

	// Step 3: Insert into user_cards
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
