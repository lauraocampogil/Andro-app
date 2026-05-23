import { supabase } from "@/lib/supabase";

export type RegisteredUser = { id: string; display_name: string | null; avatar_url: string | null };

export async function registerForRace(raceId: string, userId: string, tickets: number): Promise<boolean> {
	const { error } = await supabase.from("race_registrations").upsert({ race_id: raceId, user_id: userId, tickets }, { onConflict: "race_id,user_id" });
	if (error) console.error("registerForRace error:", error);
	return !error;
}

export async function fetchVisibleRegistrants(raceId: string, currentUserId: string): Promise<RegisteredUser[]> {
	const { data: regs } = await supabase.from("race_registrations").select("user_id").eq("race_id", raceId);
	if (!regs || regs.length === 0) return [];
	const userIds = Array.from(new Set(regs.map((r) => r.user_id)));

	// Their profiles + privacy flag
	const { data: profiles } = await supabase.from("profiles").select("id, display_name, avatar_url, account_private").in("id", userIds);
	if (!profiles) return [];

	const { data: follows } = await supabase.from("follows").select("following_id").eq("follower_id", currentUserId);
	const followingSet = new Set((follows ?? []).map((f) => f.following_id));
	const { data: closeOf } = await supabase.from("close_friends").select("user_id").eq("close_friend_id", currentUserId);
	const closeFriendOfSet = new Set((closeOf ?? []).map((c) => c.user_id));

	return profiles
		.filter((p: any) => {
			if (p.id === currentUserId) return true;
			if (!p.account_private) return true;
			if (followingSet.has(p.id)) return true;
			if (closeFriendOfSet.has(p.id)) return true;
			return false;
		})
		.map((p: any) => ({ id: p.id, display_name: p.display_name, avatar_url: p.avatar_url }));
}

export async function getRegistrationCount(raceId: string): Promise<number> {
	const { count } = await supabase.from("race_registrations").select("*", { count: "exact", head: true }).eq("race_id", raceId);
	return count ?? 0;
}
