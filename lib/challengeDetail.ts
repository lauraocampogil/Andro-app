import { Challenge } from "@/lib/challenges";
import { supabase } from "@/lib/supabase";

export type ChallengeDetail = Challenge & {
	race?: { id: string; name: string; city: string; country: string; race_date: string } | null;
	participants: { id: string; display_name: string; avatar_url: string | null; progress: number; completed: boolean }[];
};

export async function fetchChallengeDetail(challengeId: string): Promise<ChallengeDetail | null> {
	const { data: ch, error } = await supabase.from("challenges").select("*, race:races(id, name, city, country, race_date)").eq("id", challengeId).maybeSingle();

	if (error || !ch) return null;

	const { data: parts } = await supabase.from("challenge_participants").select("user_id, progress, completed").eq("challenge_id", challengeId);

	const userIds = (parts ?? []).map((p) => p.user_id);
	const { data: profiles } = await supabase.from("profiles").select("id, display_name, avatar_url").in("id", userIds);
	const profileMap = new Map((profiles ?? []).map((p: any) => [p.id, p]));

	const participants = (parts ?? []).map((p) => {
		const prof = profileMap.get(p.user_id);
		return {
			id: p.user_id,
			display_name: prof?.display_name ?? "Anonymous",
			avatar_url: prof?.avatar_url ?? null,
			progress: p.progress ?? 0,
			completed: p.completed ?? false,
		};
	});

	// Sort leaderboard by progress descending
	participants.sort((a, b) => (b.completed ? 1 : 0) - (a.completed ? 1 : 0) || b.progress - a.progress);

	return { ...(ch as any), participants };
}
