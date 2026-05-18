import { supabase } from "@/lib/supabase";

export type ChallengeType = "marathon_battle" | "color_continent" | "yearly_races" | "territory";

export type Challenge = {
	id: string;
	type: ChallengeType | string;
	title: string;
	description: string | null;
	continent?: string | null;
	distance_km?: number | null;
	race_id?: string | null;
	target_count?: number | null;
	duration_days?: number | null;
	deadline: string | null;
	created_by: string;
	created_at: string;
	participants_count?: number;
	user_progress?: number;
};

export async function fetchActiveChallenges(userId: string): Promise<Challenge[]> {
	const { data } = await supabase.from("challenge_participants").select("progress, challenge:challenges(*)").eq("user_id", userId);
	if (!data) return [];
	return data.map((d: any) => ({ ...d.challenge, user_progress: d.progress }));
}

export async function fetchSuggestedChallenges(userId: string): Promise<Challenge[]> {
	const { data: joined } = await supabase.from("challenge_participants").select("challenge_id").eq("user_id", userId);
	const joinedIds = (joined ?? []).map((j) => j.challenge_id);

	let query = supabase.from("challenges").select("*").order("created_at", { ascending: false }).limit(10);
	if (joinedIds.length > 0) query = query.not("id", "in", `(${joinedIds.join(",")})`);

	const { data, error } = await query;
	if (error || !data) return [];

	const ids = data.map((c) => c.id);
	const { data: counts } = await supabase.from("challenge_participants").select("challenge_id").in("challenge_id", ids);

	const countMap = new Map<string, number>();
	(counts ?? []).forEach((c) => countMap.set(c.challenge_id, (countMap.get(c.challenge_id) ?? 0) + 1));

	return data.map((c) => ({ ...c, participants_count: countMap.get(c.id) ?? 0 }));
}

export async function fetchChallengeParticipants(challengeId: string) {
	const { data: participants } = await supabase.from("challenge_participants").select("user_id").eq("challenge_id", challengeId).limit(5);

	if (!participants || participants.length === 0) return [];

	const userIds = participants.map((p) => p.user_id);
	const { data: profiles } = await supabase.from("profiles").select("id, display_name, avatar_url").in("id", userIds);

	return profiles ?? [];
}

export async function joinChallenge(userId: string, challengeId: string): Promise<boolean> {
	const { error } = await supabase.from("challenge_participants").insert({ user_id: userId, challenge_id: challengeId });
	return !error;
}

export async function createChallenge(params: {
	created_by: string;
	type: ChallengeType;
	title: string;
	description?: string;
	continent?: string | null;
	distance_km?: number | null;
	race_id?: string | null;
	target_count?: number | null;
	duration_days?: number | null;
	deadline?: string | null;
	invited_user_ids?: string[];
}): Promise<string | null> {
	const { data, error } = await supabase
		.from("challenges")
		.insert({
			created_by: params.created_by,
			type: params.type,
			title: params.title,
			description: params.description,
			continent: params.continent,
			distance_km: params.distance_km,
			race_id: params.race_id,
			target_count: params.target_count,
			duration_days: params.duration_days,
			deadline: params.deadline ?? (params.duration_days ? new Date(Date.now() + params.duration_days * 86400000).toISOString() : null),
		})
		.select("id")
		.single();

	if (error || !data) {
		console.error("createChallenge error:", error);
		return null;
	}

	// Creator auto-joins
	await supabase.from("challenge_participants").insert({ challenge_id: data.id, user_id: params.created_by });

	// Send invitations to friends
	if (params.invited_user_ids && params.invited_user_ids.length > 0) {
		await supabase.from("challenge_invitations").insert(
			params.invited_user_ids.map((invitee_id) => ({
				challenge_id: data.id,
				inviter_id: params.created_by,
				invitee_id,
			})),
		);
	}

	return data.id;
}

export function daysLeft(deadline: string | null): string {
	if (!deadline) return "No deadline";
	const diff = new Date(deadline).getTime() - Date.now();
	const days = Math.floor(diff / 86400000);
	if (days < 0) return "Ended";
	if (days === 0) return "Last day";
	return `${days} days left`;
}
