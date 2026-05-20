import { supabase } from "@/lib/supabase";

export type ChallengeMessage = {
	id: string;
	challenge_id: string;
	user_id: string;
	content: string;
	created_at: string;
	user: { display_name: string; avatar_url: string | null } | null;
};

export async function fetchMessages(challengeId: string): Promise<ChallengeMessage[]> {
	const { data, error } = await supabase.from("challenge_messages").select("id, challenge_id, user_id, content, created_at").eq("challenge_id", challengeId).order("created_at", { ascending: true });

	if (error || !data) return [];

	const userIds = Array.from(new Set(data.map((m) => m.user_id)));
	const { data: profiles } = await supabase.from("profiles").select("id, display_name, avatar_url").in("id", userIds);
	const profileMap = new Map((profiles ?? []).map((p: any) => [p.id, p]));

	return data.map((m) => ({ ...m, user: profileMap.get(m.user_id) ?? null }));
}

export async function sendMessage(challengeId: string, userId: string, content: string): Promise<boolean> {
	const { error } = await supabase.from("challenge_messages").insert({ challenge_id: challengeId, user_id: userId, content });
	return !error;
}

export function subscribeToMessages(challengeId: string, onMessage: (msg: ChallengeMessage) => void) {
	const channel = supabase
		.channel(`challenge_messages:${challengeId}`)
		.on("postgres_changes", { event: "INSERT", schema: "public", table: "challenge_messages", filter: `challenge_id=eq.${challengeId}` }, async (payload: any) => {
			const newMsg = payload.new;
			const { data: profile } = await supabase.from("profiles").select("display_name, avatar_url").eq("id", newMsg.user_id).maybeSingle();
			onMessage({ ...newMsg, user: profile ?? null });
		})
		.subscribe();
	return () => {
		supabase.removeChannel(channel);
	};
}

export async function countUnreadMessages(challengeId: string, userId: string): Promise<number> {
	// Count notifications for this user, type new_message, related to this challenge, unread
	const { count } = await supabase.from("notifications").select("*", { count: "exact", head: true }).eq("user_id", userId).eq("type", "new_message").eq("challenge_id", challengeId).eq("read", false);
	return count ?? 0;
}

export async function markChallengeMessagesAsRead(challengeId: string, userId: string): Promise<void> {
	await supabase.from("notifications").update({ read: true }).eq("user_id", userId).eq("type", "new_message").eq("challenge_id", challengeId).eq("read", false);
}
