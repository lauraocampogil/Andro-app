import { supabase } from "@/lib/supabase";

export type Challenge = {
	id: string;
	type: "1v1_race" | "territory" | "collection";
	title: string;
	description: string | null;
	target: any;
	deadline: string | null;
	created_by: string;
	created_at: string;
	participants_count?: number;
	user_progress?: number;
};

export async function fetchActiveChallenges(userId: string): Promise<Challenge[]> {
	const { data, error } = await supabase.from("challenge_participants").select("progress, challenge:challenges(*)").eq("user_id", userId);

	if (error || !data) return [];

	return data.map((d: any) => ({
		...d.challenge,
		user_progress: d.progress,
	}));
}

export async function fetchSuggestedChallenges(userId: string): Promise<Challenge[]> {
	// All challenges not yet joined by user
	const { data: joined } = await supabase.from("challenge_participants").select("challenge_id").eq("user_id", userId);

	const joinedIds = (joined ?? []).map((j) => j.challenge_id);

	let query = supabase.from("challenges").select("*").order("created_at", { ascending: false }).limit(10);
	if (joinedIds.length > 0) query = query.not("id", "in", `(${joinedIds.join(",")})`);

	const { data, error } = await query;
	if (error || !data) return [];

	// Count participants for each
	const ids = data.map((c) => c.id);
	const { data: counts } = await supabase.from("challenge_participants").select("challenge_id").in("challenge_id", ids);

	const countMap = new Map<string, number>();
	(counts ?? []).forEach((c) => {
		countMap.set(c.challenge_id, (countMap.get(c.challenge_id) ?? 0) + 1);
	});

	return data.map((c) => ({ ...c, participants_count: countMap.get(c.id) ?? 0 }));
}

export async function joinChallenge(userId: string, challengeId: string): Promise<boolean> {
	const { error } = await supabase.from("challenge_participants").insert({ user_id: userId, challenge_id: challengeId });
	return !error;
}

export function daysLeft(deadline: string | null): string {
	if (!deadline) return "No deadline";
	const diff = new Date(deadline).getTime() - Date.now();
	const days = Math.floor(diff / 86400000);
	if (days < 0) return "Ended";
	if (days === 0) return "Last day";
	return `${days} days left`;
}
