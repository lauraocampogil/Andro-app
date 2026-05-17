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

export async function createChallenge(params: {
	created_by: string;
	type: "1v1_race" | "territory" | "collection";
	title: string;
	description?: string;
	target?: any;
	deadline?: string | null;
	visibility?: "everyone" | "friends" | "close_friends";
	challenged_user_ids?: string[];
}): Promise<string | null> {
	const { data, error } = await supabase
		.from("challenges")
		.insert({
			created_by: params.created_by,
			type: params.type,
			title: params.title,
			description: params.description,
			target: params.target ?? {},
			deadline: params.deadline,
			visibility: params.visibility ?? "everyone",
			challenged_user_ids: params.challenged_user_ids ?? [],
		})
		.select("id")
		.single();

	if (error || !data) {
		console.error("Error creating challenge:", error);
		return null;
	}

	// Auto-join creator
	await supabase.from("challenge_participants").insert({ challenge_id: data.id, user_id: params.created_by });

	return data.id;
}

export async function fetchChallengeParticipants(challengeId: string) {
	const { data } = await supabase.from("challenge_participants").select("user_id, profile:profiles!user_id(display_name, avatar_url)").eq("challenge_id", challengeId).limit(5);
	return (data ?? []).map((d: any) => d.profile);
}
