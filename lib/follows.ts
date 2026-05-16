import { supabase } from "@/lib/supabase";

export async function followUser(followerId: string, followingId: string): Promise<boolean> {
	const { error } = await supabase.from("follows").insert({ follower_id: followerId, following_id: followingId });
	return !error;
}

export async function unfollowUser(followerId: string, followingId: string): Promise<boolean> {
	const { error } = await supabase.from("follows").delete().eq("follower_id", followerId).eq("following_id", followingId);
	return !error;
}

export async function getFollowingIds(userId: string): Promise<string[]> {
	const { data } = await supabase.from("follows").select("following_id").eq("follower_id", userId);
	return (data ?? []).map((d) => d.following_id);
}

export async function getFollowersCount(userId: string): Promise<number> {
	const { count } = await supabase.from("follows").select("*", { count: "exact", head: true }).eq("following_id", userId);
	return count ?? 0;
}

export async function getFollowingCount(userId: string): Promise<number> {
	const { count } = await supabase.from("follows").select("*", { count: "exact", head: true }).eq("follower_id", userId);
	return count ?? 0;
}
