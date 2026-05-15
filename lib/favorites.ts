import { supabase } from "@/lib/supabase";

export async function fetchFavoriteRaceIds(userId: string): Promise<string[]> {
	const { data, error } = await supabase.from("user_favorites").select("race_id").eq("user_id", userId);
	if (error || !data) return [];
	return data.map((d) => d.race_id);
}

export async function addFavorite(userId: string, raceId: string): Promise<boolean> {
	const { error } = await supabase.from("user_favorites").insert({ user_id: userId, race_id: raceId });
	return !error;
}

export async function removeFavorite(userId: string, raceId: string): Promise<boolean> {
	const { error } = await supabase.from("user_favorites").delete().eq("user_id", userId).eq("race_id", raceId);
	return !error;
}
