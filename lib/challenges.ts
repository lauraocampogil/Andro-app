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

export type SuggestedChallenge = {
	id: string; // ← ajouté : identifiant stable (= template_key)
	template_key: string;
	type: ChallengeType;
	title: string;
	description: string;
	continent: string | null;
	distance_km: number | null;
	target_count: number | null;
	deadline: string; // ISO
	duration_label: string; // human readable
	difficulty: "easy" | "medium" | "hard";
	participants_count: number; // ← ajouté
};

// userId est accepté pour usage futur (filtrer les challenges déjà rejoints).
export async function fetchSuggestedChallenges(userId?: string): Promise<SuggestedChallenge[]> {
	const now = new Date();
	const addDays = (d: number) => {
		const x = new Date(now);
		x.setDate(x.getDate() + d);
		return x.toISOString();
	};
	const endOfYear = new Date(now.getFullYear(), 11, 31).toISOString();

	return [
		{
			id: "europe-10k-30d",
			template_key: "europe-10k-30d",
			type: "color_continent",
			title: "Color Europe",
			description: "Unlock 3 race cards across Europe before the deadline.",
			continent: "Europe",
			distance_km: null,
			target_count: 3,
			deadline: addDays(30),
			duration_label: "30 days",
			difficulty: "medium",
			participants_count: 0,
		},
		{
			id: "yearly-10-races",
			template_key: "yearly-10-races",
			type: "yearly_races",
			title: "10 Races This Year",
			description: "Complete 10 races before December 31st.",
			continent: null,
			distance_km: null,
			target_count: 10,
			deadline: endOfYear,
			duration_label: `until Dec 31`,
			difficulty: "hard",
			participants_count: 0,
		},
		{
			id: "marathon-sprint-14d",
			template_key: "marathon-sprint-14d",
			type: "marathon_battle",
			title: "Marathon Sprint",
			description: "Be the first to finish a 42 km marathon within 2 weeks.",
			continent: null,
			distance_km: 42,
			target_count: null,
			deadline: addDays(14),
			duration_label: "14 days",
			difficulty: "hard",
			participants_count: 0,
		},
		{
			id: "weekend-warrior-7d",
			template_key: "weekend-warrior-7d",
			type: "yearly_races",
			title: "Weekend Warrior",
			description: "Run 2 races this week. Quick and punchy.",
			continent: null,
			distance_km: null,
			target_count: 2,
			deadline: addDays(7),
			duration_label: "7 days",
			difficulty: "easy",
			participants_count: 0,
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
