import { supabase } from "@/lib/supabase";

export type FollowRequestStatus = "none" | "following" | "pending";

export async function checkFollowStatus(currentUserId: string, targetUserId: string): Promise<FollowRequestStatus> {
	// Already following?
	const { data: follow } = await supabase.from("follows").select("follower_id").eq("follower_id", currentUserId).eq("following_id", targetUserId).maybeSingle();
	if (follow) return "following";

	// Pending request?
	const { data: req } = await supabase.from("follow_requests").select("status").eq("requester_id", currentUserId).eq("target_id", targetUserId).eq("status", "pending").maybeSingle();
	if (req) return "pending";

	return "none";
}

export async function isAccountPrivate(userId: string): Promise<boolean> {
	const { data } = await supabase.from("user_settings").select("account_private").eq("user_id", userId).maybeSingle();
	return data?.account_private ?? false;
}

export async function requestOrFollow(currentUserId: string, targetUserId: string): Promise<FollowRequestStatus> {
	const isPrivate = await isAccountPrivate(targetUserId);

	if (isPrivate) {
		const { error } = await supabase.from("follow_requests").insert({ requester_id: currentUserId, target_id: targetUserId });
		if (error) {
			console.error("requestOrFollow (private) error:", JSON.stringify(error));
			return "none";
		}
		return "pending";
	} else {
		const { error } = await supabase.from("follows").insert({ follower_id: currentUserId, following_id: targetUserId });
		if (error) {
			console.error("requestOrFollow (public) error:", JSON.stringify(error));
			return "none";
		}
		return "following";
	}
}

export async function cancelFollowRequest(currentUserId: string, targetUserId: string): Promise<boolean> {
	const { error } = await supabase.from("follow_requests").delete().eq("requester_id", currentUserId).eq("target_id", targetUserId).eq("status", "pending");
	return !error;
}

export async function respondToFollowRequest(requestId: string, status: "accepted" | "declined"): Promise<boolean> {
	const { error } = await supabase.from("follow_requests").update({ status, responded_at: new Date().toISOString() }).eq("id", requestId);
	return !error;
}
