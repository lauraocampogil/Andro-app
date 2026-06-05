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
	const { data: reviews, error } = await supabase.from("reviews").select("id, user_id, race_id, rating, comment, created_at").eq("race_id", raceId).order("created_at", { ascending: false });

	if (error || !reviews || reviews.length === 0) return [];

	const userIds = Array.from(new Set(reviews.map((r) => r.user_id)));
	const { data: profiles } = await supabase.from("profiles").select("id, display_name, avatar_url").in("id", userIds);
	const profileMap = new Map((profiles ?? []).map((p: any) => [p.id, p]));

	return reviews.map((r: any) => ({
		...r,
		user: profileMap.get(r.user_id) ?? { display_name: "Anonymous", avatar_url: null },
	}));
}

export async function createReview(userId: string, raceId: string, rating: number, comment: string): Promise<boolean> {
	const { error } = await supabase.from("reviews").insert({
		user_id: userId,
		race_id: raceId,
		rating,
		comment: comment.trim() || null,
	});
	if (error) console.error("createReview error:", error);
	return !error;
}

export async function getUserReviewForRace(raceId: string, userId: string): Promise<Review | null> {
	const { data } = await supabase.from("reviews").select("id, user_id, race_id, rating, comment, created_at").eq("race_id", raceId).eq("user_id", userId).maybeSingle();
	return data as Review | null;
}

export async function fetchFriendsThatGo(raceId: string, limit = 8): Promise<{ avatar_url: string | null; display_name: string | null }[]> {
	const { data: favs } = await supabase.from("user_favorites").select("user_id").eq("race_id", raceId).limit(limit);

	if (!favs || favs.length === 0) return [];

	const userIds = Array.from(new Set(favs.map((f) => f.user_id)));
	const { data: profiles } = await supabase.from("profiles").select("id, display_name, avatar_url").in("id", userIds);

	return (profiles ?? []).map((p: any) => ({ avatar_url: p.avatar_url, display_name: p.display_name }));
}
