import { Challenge } from "@/lib/challenges";
import { MuseumCard } from "@/lib/museum";
import { supabase } from "@/lib/supabase";

export type PublicProfile = {
	id: string;
	display_name: string | null;
	avatar_url: string | null;
	featured_card_id: string | null;
};

export async function fetchPublicProfile(userId: string): Promise<PublicProfile | null> {
	const { data, error } = await supabase.from("profiles").select("id, display_name, avatar_url, featured_card_id").eq("id", userId).maybeSingle();
	if (error || !data) return null;
	return data as PublicProfile;
}

export async function fetchPublicMuseumCards(userId: string): Promise<MuseumCard[]> {
	const { data: allCards } = await supabase.from("cards").select("id, qr_code, rarity, creature_name, creature_image_url, race:races(id, name, city, country, country_code, continent)");
	if (!allCards) return [];

	const { data: userCards } = await supabase.from("user_cards").select("card_id, scanned_at").eq("user_id", userId);

	const unlockedMap = new Map<string, string>();
	(userCards ?? []).forEach((uc: any) => unlockedMap.set(uc.card_id, uc.scanned_at));

	return (allCards as any[]).map((c) => ({
		id: c.id,
		qr_code: c.qr_code,
		rarity: c.rarity,
		creature_name: c.creature_name,
		creature_image_url: c.creature_image_url,
		race: c.race,
		unlocked: unlockedMap.has(c.id),
		unlocked_at: unlockedMap.get(c.id) ?? null,
	}));
}

export async function fetchPublicActiveChallenges(userId: string): Promise<Challenge[]> {
	const { data } = await supabase.from("challenge_participants").select("progress, challenge:challenges(*)").eq("user_id", userId);
	if (!data) return [];
	return data.map((d: any) => ({ ...d.challenge, user_progress: d.progress }));
}

export async function isFollowing(followerId: string, followingId: string): Promise<boolean> {
	const { data } = await supabase.from("follows").select("follower_id").eq("follower_id", followerId).eq("following_id", followingId).maybeSingle();
	return !!data;
}
