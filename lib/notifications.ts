import { supabase } from "@/lib/supabase";

export type Notification = {
	id: string;
	type: "challenge_invite" | "challenge_accepted" | "challenge_declined" | "new_follower" | "race_reminder" | "new_message" | "follow_request" | "follow_request_accepted";
	from_user: { id: string; display_name: string; avatar_url: string | null } | null;
	challenge: { id: string; title: string } | null;
	invitation_id: string | null;
	follow_request_id: string | null;
	read: boolean;
	created_at: string;
};

export async function fetchNotifications(userId: string): Promise<Notification[]> {
	const { data, error } = await supabase
		.from("notifications")
		.select("id, type, from_user_id, challenge_id, invitation_id, follow_request_id, read, created_at, challenge:challenges(id, title)")
		.eq("user_id", userId)
		.order("created_at", { ascending: false })
		.limit(50);

	if (error || !data) return [];

	// Resolve sender profiles
	const fromIds = Array.from(new Set(data.map((n: any) => n.from_user_id).filter(Boolean)));
	const { data: profiles } = await supabase.from("profiles").select("id, display_name, avatar_url").in("id", fromIds);
	const profileMap = new Map((profiles ?? []).map((p: any) => [p.id, p]));

	// Find which challenge invitations are already resolved (accepted/declined)
	const inviteIds = Array.from(new Set(data.filter((n: any) => n.type === "challenge_invite" && n.invitation_id).map((n: any) => n.invitation_id)));
	let resolvedInviteIds = new Set<string>();
	if (inviteIds.length > 0) {
		const { data: invites } = await supabase.from("challenge_invitations").select("id, status").in("id", inviteIds);
		resolvedInviteIds = new Set((invites ?? []).filter((i: any) => i.status !== "pending").map((i: any) => i.id));
	}

	// Find which follow requests are already resolved (accepted/declined)
	const followReqIds = Array.from(new Set(data.filter((n: any) => n.type === "follow_request" && n.follow_request_id).map((n: any) => n.follow_request_id)));
	let resolvedFollowReqIds = new Set<string>();
	if (followReqIds.length > 0) {
		const { data: reqs } = await supabase.from("follow_requests").select("id, status").in("id", followReqIds);
		resolvedFollowReqIds = new Set((reqs ?? []).filter((r: any) => r.status !== "pending").map((r: any) => r.id));
	}

	const mapped: Notification[] = data.map((n: any) => ({
		id: n.id,
		type: n.type,
		from_user: n.from_user_id ? (profileMap.get(n.from_user_id) ?? null) : null,
		challenge: n.challenge,
		invitation_id: n.invitation_id,
		follow_request_id: n.follow_request_id,
		read: n.read,
		created_at: n.created_at,
	}));

	// Drop challenge_invite / follow_request notifications whose underlying request is no longer pending.
	// This is what stops accept/decline buttons from reappearing after the invite was answered.
	return mapped.filter((n) => {
		if (n.type === "challenge_invite" && n.invitation_id && resolvedInviteIds.has(n.invitation_id)) {
			return false;
		}
		if (n.type === "follow_request" && n.follow_request_id && resolvedFollowReqIds.has(n.follow_request_id)) {
			return false;
		}
		return true;
	});
}

export async function countUnreadNotifications(userId: string): Promise<number> {
	const { count } = await supabase.from("notifications").select("*", { count: "exact", head: true }).eq("user_id", userId).eq("read", false);
	return count ?? 0;
}

export async function markAsRead(notificationId: string): Promise<boolean> {
	const { error } = await supabase.from("notifications").update({ read: true }).eq("id", notificationId);
	return !error;
}

export async function respondToInvitation(invitationId: string, status: "accepted" | "declined"): Promise<boolean> {
	const { error } = await supabase.from("challenge_invitations").update({ status, responded_at: new Date().toISOString() }).eq("id", invitationId);
	return !error;
}
