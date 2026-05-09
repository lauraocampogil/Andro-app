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

// User's completed race (from user_cards table, joined with races)
export type CompletedRace = {
	user_id: string;
	race_id: string;
	collected_at: string;
	race: Race;
};

export async function fetchAllRaces(): Promise<Race[]> {
	const { data, error } = await supabase.from("races").select("*").order("race_date", { ascending: true });

	if (error) {
		console.error("fetchAllRaces error:", error);
		return [];
	}
	return data || [];
}

export async function fetchUserCompletedRaces(userId: string): Promise<CompletedRace[]> {
	const { data, error } = await supabase
		.from("user_cards")
		.select(
			`
      user_id,
      race_id,
      collected_at,
      race:races(*)
    `,
		)
		.eq("user_id", userId);

	if (error) {
		console.error("fetchUserCompletedRaces error:", error);
		return [];
	}
	return (data as any) || [];
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

//Mark a race as completed for a user (called when QR is scanned)
export async function markRaceAsCompleted(userId: string, raceId: string): Promise<{ success: boolean; alreadyCollected: boolean; race?: Race }> {
	// Check if already collected
	const { data: existing } = await supabase.from("user_cards").select("race_id").eq("user_id", userId).eq("race_id", raceId).maybeSingle();

	if (existing) {
		return { success: false, alreadyCollected: true };
	}

	// Insert into user_cards
	const { error: insertError } = await supabase.from("user_cards").insert({
		user_id: userId,
		race_id: raceId,
		collected_at: new Date().toISOString(),
	});

	if (insertError) {
		console.error("markRaceAsCompleted error:", insertError);
		return { success: false, alreadyCollected: false };
	}

	// Fetch the race details to return for the reveal animation
	const { data: race } = await supabase.from("races").select("*").eq("id", raceId).single();

	return { success: true, alreadyCollected: false, race: race as Race };
}

// Compute global progress stats based on completed races
export type ProgressStats = {
	countriesCount: number;
	continentsCount: number;
	totalContinents: number;
	worldPercent: number;
};

export function computeProgressStats(completedRaces: CompletedRace[]): ProgressStats {
	const countries = getCompletedCountryCodes(completedRaces);
	const continents = getCompletedContinents(completedRaces);

	// 7 continents total in our DB
	const TOTAL_CONTINENTS = 7;
	// Approximate "world coverage" based on countries (out of ~195)
	const TOTAL_COUNTRIES = 195;

	return {
		countriesCount: countries.length,
		continentsCount: continents.length,
		totalContinents: TOTAL_CONTINENTS,
		worldPercent: Math.round((countries.length / TOTAL_COUNTRIES) * 100),
	};
}
