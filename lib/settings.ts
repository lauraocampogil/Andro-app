import { supabase } from "@/lib/supabase";

export type ChallengeVisibility = "everyone" | "friends" | "close_friends";

export type UserSettings = {
	challenge_visibility: ChallengeVisibility;
};

export async function getUserSettings(userId: string): Promise<UserSettings> {
	const { data } = await supabase.from("user_settings").select("*").eq("user_id", userId).maybeSingle();
	return { challenge_visibility: data?.challenge_visibility ?? "everyone" };
}

export async function updateChallengeVisibility(userId: string, visibility: ChallengeVisibility): Promise<boolean> {
	const { error } = await supabase.from("user_settings").upsert({ user_id: userId, challenge_visibility: visibility, updated_at: new Date().toISOString() });
	return !error;
}
