import { supabase } from "@/lib/supabase";

export type ChallengeVisibility = "everyone" | "friends" | "close_friends";

export type UserSettings = {
	challenge_visibility: ChallengeVisibility;
	notifications_enabled: boolean;
	notification_sound: boolean;
	location_enabled: boolean;
	location_precision: "precise" | "city" | "off";
};

export async function getUserSettings(userId: string): Promise<UserSettings> {
	const { data } = await supabase.from("user_settings").select("*").eq("user_id", userId).maybeSingle();
	return {
		challenge_visibility: data?.challenge_visibility ?? "everyone",
		notifications_enabled: data?.notifications_enabled ?? true,
		notification_sound: data?.notification_sound ?? true,
		location_enabled: data?.location_enabled ?? false,
		location_precision: data?.location_precision ?? "city",
	};
}

export async function updateChallengeVisibility(userId: string, visibility: ChallengeVisibility): Promise<boolean> {
	const { error } = await supabase.from("user_settings").upsert({ user_id: userId, challenge_visibility: visibility, updated_at: new Date().toISOString() });
	return !error;
}

export async function updateSetting(userId: string, key: keyof Omit<UserSettings, "challenge_visibility">, value: any): Promise<boolean> {
	const { error } = await supabase.from("user_settings").upsert({ user_id: userId, [key]: value, updated_at: new Date().toISOString() });
	return !error;
}
