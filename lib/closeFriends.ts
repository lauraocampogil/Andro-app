import { supabase } from "@/lib/supabase";

export async function addCloseFriend(userId: string, friendId: string): Promise<boolean> {
	const { error } = await supabase.from("close_friends").insert({ user_id: userId, close_friend_id: friendId });
	return !error;
}

export async function removeCloseFriend(userId: string, friendId: string): Promise<boolean> {
	const { error } = await supabase.from("close_friends").delete().eq("user_id", userId).eq("close_friend_id", friendId);
	return !error;
}

export async function getCloseFriendIds(userId: string): Promise<string[]> {
	const { data } = await supabase.from("close_friends").select("close_friend_id").eq("user_id", userId);
	return (data ?? []).map((d) => d.close_friend_id);
}

export async function getCloseFriendProfiles(userId: string) {
	const { data } = await supabase.from("close_friends").select("close_friend_id, profile:profiles!close_friend_id(id, display_name, avatar_url)").eq("user_id", userId);
	return (data ?? []).map((d: any) => d.profile);
}
