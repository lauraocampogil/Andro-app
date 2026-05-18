import { supabase } from "@/lib/supabase";

export type ActivityItem = {
	id: string;
	user_id: string;
	user: { display_name: string; avatar_url: string | null };
	action_type: "scanned" | "joined_race" | "challenged" | "followed" | "card_featured";
	race?: { id: string; name: string; city: string; country: string } | null;
	card?: { id: string; creature_name: string } | null;
	target_user?: { id: string; display_name: string; avatar_url: string | null } | null;
	challenge?: { id: string; title: string } | null;
	created_at: string;
};

export async function fetchCommunityFeed(currentUserId: string): Promise<ActivityItem[]> {
	const { data: followingData } = await supabase.from("follows").select("following_id").eq("follower_id", currentUserId);

	const followingIds = (followingData ?? []).map((f) => f.following_id);
	if (followingIds.length === 0) return [];

	// Fetch activities
	const { data: activities, error } = await supabase
		.from("activities")
		.select(
			`
			id, user_id, action_type, created_at, target_user_id,
			race:races(id, name, city, country),
			card:cards(id, creature_name),
			challenge:challenges(id, title)
		`,
		)
		.in("user_id", followingIds)
		.order("created_at", { ascending: false })
		.limit(50);

	if (error || !activities) {
		console.error("fetchCommunityFeed error:", error);
		return [];
	}

	// Collect all user IDs we need profiles for (authors + targets)
	const userIds = new Set<string>();
	activities.forEach((a: any) => {
		userIds.add(a.user_id);
		if (a.target_user_id) userIds.add(a.target_user_id);
	});

	const { data: profiles } = await supabase.from("profiles").select("id, display_name, avatar_url").in("id", Array.from(userIds));

	const profileMap = new Map<string, any>();
	(profiles ?? []).forEach((p) => profileMap.set(p.id, p));

	return activities.map((a: any) => ({
		id: a.id,
		user_id: a.user_id,
		user: profileMap.get(a.user_id) ?? { display_name: "Someone", avatar_url: null },
		action_type: a.action_type,
		race: a.race,
		card: a.card,
		target_user: a.target_user_id ? profileMap.get(a.target_user_id) : null,
		challenge: a.challenge,
		created_at: a.created_at,
	}));
}

export function timeAgo(iso: string): string {
	const diff = Date.now() - new Date(iso).getTime();
	const minutes = Math.floor(diff / 60000);
	const hours = Math.floor(minutes / 60);
	const days = Math.floor(hours / 24);
	if (days > 0) return `${days}d ago`;
	if (hours > 0) return `${hours}h ago`;
	if (minutes > 0) return `${minutes}min ago`;
	return "now";
}

// Suggested users — keep as is
export type SuggestedUser = {
	id: string;
	display_name: string;
	avatar_url: string | null;
	is_following: boolean;
};

export async function fetchSuggestedUsers(currentUserId: string): Promise<SuggestedUser[]> {
	const { data: alreadyFollowing } = await supabase.from("follows").select("following_id").eq("follower_id", currentUserId);
	const followingIds = (alreadyFollowing ?? []).map((f) => f.following_id);
	followingIds.push(currentUserId);

	let query = supabase.from("profiles").select("id, display_name, avatar_url").limit(10);
	if (followingIds.length > 0) query = query.not("id", "in", `(${followingIds.join(",")})`);

	const { data, error } = await query;
	if (error || !data) return [];

	return data.map((p: any) => ({
		id: p.id,
		display_name: p.display_name ?? "Anonymous",
		avatar_url: p.avatar_url,
		is_following: false,
	}));
}
