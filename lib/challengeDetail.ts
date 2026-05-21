import { Challenge } from "@/lib/challenges";
import { supabase } from "@/lib/supabase";

export type ChallengeDetail = Challenge & {
	race?: { id: string; name: string; city: string; country: string; race_date: string } | null;
	participants: { id: string; display_name: string; avatar_url: string | null; progress: number; completed: boolean }[];
	pendingInvitation: { id: string } | null;
};

export async function fetchChallengeDetail(challengeId: string, currentUserId: string): Promise<ChallengeDetail | null> {
	const { data: ch, error } = await supabase.from("challenges").select("*, race:races(id, name, city, country, race_date)").eq("id", challengeId).maybeSingle();

	if (error || !ch) return null;

	const { data: parts } = await supabase.from("challenge_participants").select("user_id, progress, completed").eq("challenge_id", challengeId);

	// Dedupe participant user_ids (fixes the doubled-avatar bug)
	const userIds = Array.from(new Set((parts ?? []).map((p) => p.user_id)));
	const { data: profiles } = await supabase.from("profiles").select("id, display_name, avatar_url").in("id", userIds);
	const profileMap = new Map((profiles ?? []).map((p: any) => [p.id, p]));

	// Build participants from the deduped id list
	const participants = userIds.map((uid) => {
		const part = (parts ?? []).find((p) => p.user_id === uid);
		const prof = profileMap.get(uid);
		return {
			id: uid,
			display_name: prof?.display_name ?? "Anonymous",
			avatar_url: prof?.avatar_url ?? null,
			progress: part?.progress ?? 0,
			completed: part?.completed ?? false,
		};
	});

	// Sort leaderboard: completed first, then by progress descending
	participants.sort((a, b) => (b.completed ? 1 : 0) - (a.completed ? 1 : 0) || b.progress - a.progress);

	const { data: invitation } = await supabase.from("challenge_invitations").select("id, status").eq("challenge_id", challengeId).eq("invitee_id", currentUserId).eq("status", "pending").maybeSingle();

	const isCreator = (ch as any).created_by === currentUserId;
	const pendingInvitation = invitation && !isCreator ? { id: invitation.id } : null;

	return { ...(ch as any), participants, pendingInvitation };
}
