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
	visibility?: string;
	created_by: string;
	created_at: string;
	participants_count?: number;
	user_progress?: number;
};

export async function fetchActiveChallenges(userId: string): Promise<Challenge[]> {
	const { data } = await supabase.from("challenge_participants").select("progress, challenge:challenges(*)").eq("user_id", userId);
	if (!data) return [];
	return data.map((d: any) => ({ ...d.challenge, user_progress: d.progress })).filter((c: any) => c.id);
}

export type SuggestedChallenge = {
	id: string;
	type: ChallengeType;
	title: string;
	description: string;
	continent: string | null;
	distance_km: number | null;
	target_count: number | null;
	deadline: string;
	difficulty: "easy" | "medium" | "hard";
};

export async function fetchSuggestedChallenges(currentUserId: string): Promise<SuggestedChallenge[]> {
	const now = new Date();
	const addDays = (d: number) => {
		const x = new Date(now);
		x.setDate(x.getDate() + d);
		return x.toISOString();
	};
	const endOfYear = new Date(now.getFullYear(), 11, 31).toISOString();

	return [
		{
			id: "tmpl-color-europe",
			type: "color_continent",
			title: "Color Europe",
			description: "Unlock 3 race cards across Europe.",
			continent: "Europe",
			distance_km: null,
			target_count: 3,
			deadline: addDays(30),
			difficulty: "medium",
		},
		{
			id: "tmpl-10-races",
			type: "yearly_races",
			title: "10 Races This Year",
			description: "Complete 10 races before December 31st.",
			continent: null,
			distance_km: null,
			target_count: 10,
			deadline: endOfYear,
			difficulty: "hard",
		},
		{
			id: "tmpl-marathon-sprint",
			type: "marathon_battle",
			title: "Marathon Sprint",
			description: "Finish a 42 km marathon within 2 weeks.",
			continent: null,
			distance_km: 42,
			target_count: null,
			deadline: addDays(14),
			difficulty: "hard",
		},
		{
			id: "tmpl-weekend-warrior",
			type: "yearly_races",
			title: "Weekend Warrior",
			description: "Run 2 races this week.",
			continent: null,
			distance_km: null,
			target_count: 2,
			deadline: addDays(7),
			difficulty: "easy",
		},
	];
}

export async function fetchChallengeParticipants(challengeId: string) {
	const { data: participants } = await supabase.from("challenge_participants").select("user_id").eq("challenge_id", challengeId);
	if (!participants || participants.length === 0) return [];
	const uniqueIds = Array.from(new Set(participants.map((p) => p.user_id)));
	const { data: profiles } = await supabase.from("profiles").select("id, display_name, avatar_url").in("id", uniqueIds.slice(0, 5));
	return profiles ?? [];
}

export async function joinChallenge(userId: string, challengeId: string): Promise<boolean> {
	const { error } = await supabase.from("challenge_participants").upsert({ user_id: userId, challenge_id: challengeId }, { onConflict: "challenge_id,user_id" });
	if (error) console.error("joinChallenge error:", error);
	return !error;
}

export async function leaveChallenge(userId: string, challengeId: string): Promise<boolean> {
	const { error } = await supabase.from("challenge_participants").delete().eq("user_id", userId).eq("challenge_id", challengeId);
	if (error) {
		console.error("leaveChallenge error:", error);
		return false;
	}
	const { data: remaining } = await supabase.from("challenge_participants").select("user_id").eq("challenge_id", challengeId);
	if (!remaining || remaining.length === 0) {
		await supabase.from("challenges").delete().eq("id", challengeId);
	}
	return true;
}

export async function fetchPublicChallenges(currentUserId: string): Promise<Challenge[]> {
	const { data } = await supabase.from("challenges").select("*").eq("visibility", "public").neq("created_by", currentUserId).order("created_at", { ascending: false }).limit(20);
	return data ?? [];
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
	visibility?: string;
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
			visibility: params.visibility ?? "everyone",
			deadline: params.deadline ?? (params.duration_days ? new Date(Date.now() + params.duration_days * 86400000).toISOString() : null),
		})
		.select("id")
		.single();

	if (error || !data) {
		console.error("createChallenge error:", error);
		return null;
	}

	await supabase.from("challenge_participants").upsert({ challenge_id: data.id, user_id: params.created_by }, { onConflict: "challenge_id,user_id" });

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
