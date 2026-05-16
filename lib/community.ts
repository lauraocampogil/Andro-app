import { supabase } from "@/lib/supabase";

export type ActivityItem = {
	id: string;
	user: { display_name: string; avatar_url: string | null };
	action_type: "scanned" | "challenged" | "joined_race";
	race?: { name: string; city: string; country: string } | null;
	created_at: string;
	is_mock: boolean;
};

export async function fetchCommunityFeed(): Promise<ActivityItem[]> {
	const { data, error } = await supabase.from("mock_activity").select("id, action_type, created_at, user:mock_users(display_name, avatar_url), race:races(name, city, country)").order("created_at", { ascending: false }).limit(20);

	if (error || !data) return [];

	return (data as any[]).map((a) => ({
		id: a.id,
		user: a.user,
		action_type: a.action_type,
		race: a.race,
		created_at: a.created_at,
		is_mock: true,
	}));
}

export function timeAgo(iso: string): string {
	const diff = Date.now() - new Date(iso).getTime();
	const hours = Math.floor(diff / 3600000);
	const days = Math.floor(hours / 24);
	if (days > 0) return `${days}d ago`;
	if (hours > 0) return `${hours}h ago`;
	const minutes = Math.floor(diff / 60000);
	return `${minutes}min ago`;
}
