import { supabase } from "@/lib/supabase";

export type Review = {
	id: string;
	user_id: string;
	race_id: string;
	rating: number;
	comment: string | null;
	created_at: string;
	user?: {
		display_name: string | null;
		avatar_url: string | null;
	};
};

export async function fetchReviewsForRace(raceId: string): Promise<Review[]> {
	const { data, error } = await supabase.from("reviews").select("*, user:profiles(display_name, avatar_url)").eq("race_id", raceId).order("created_at", { ascending: false });
	if (error || !data) return [];
	return data as Review[];
}

export async function createReview(userId: string, raceId: string, rating: number, comment: string): Promise<boolean> {
	const { error } = await supabase.from("reviews").insert({
		user_id: userId,
		race_id: raceId,
		rating,
		comment: comment || null,
	});
	return !error;
}

export async function fetchFriendsThatGo(raceId: string, limit = 8): Promise<{ avatar_url: string | null; display_name: string | null }[]> {
	const { data, error } = await supabase.from("user_favorites").select("user:profiles(avatar_url, display_name)").eq("race_id", raceId).limit(limit);
	if (error || !data) return [];
	return data.map((d: any) => d.user).filter(Boolean);
}
