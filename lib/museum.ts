import { supabase } from "@/lib/supabase";

export type MuseumCard = {
	id: string;
	qr_code: string;
	rarity: string;
	creature_name: string;
	creature_image_url: string | null;
	race: {
		id: string;
		name: string;
		city: string;
		country: string;
		country_code: string;
		continent: string;
	};
	unlocked: boolean;
	unlocked_at: string | null;
	finish_time: string | null;
	finish_pace: string | null;
};

export async function fetchMuseumCards(userId: string): Promise<MuseumCard[]> {
	const { data: allCards, error: cardsError } = await supabase.from("cards").select("id, qr_code, rarity, creature_name, creature_image_url, race:races(id, name, city, country, country_code, continent)");

	if (cardsError) {
		console.error("Error fetching cards:", cardsError);
		return [];
	}
	if (!allCards) return [];

	const { data: userCards, error: ucError } = await supabase.from("user_cards").select("card_id, scanned_at, finish_time, finish_pace").eq("user_id", userId);

	if (ucError) console.error("Error fetching user_cards:", ucError);

	const unlockedMap = new Map<string, any>();
	(userCards ?? []).forEach((uc: any) => {
		unlockedMap.set(uc.card_id, uc);
	});

	return (allCards as any[]).map((c) => {
		const uc = unlockedMap.get(c.id);
		return {
			id: c.id,
			qr_code: c.qr_code,
			rarity: c.rarity,
			creature_name: c.creature_name,
			creature_image_url: c.creature_image_url,
			race: c.race,
			unlocked: !!uc,
			unlocked_at: uc?.scanned_at ?? null,
			finish_time: uc?.finish_time ?? null,
			finish_pace: uc?.finish_pace ?? null,
		};
	});
}

export async function setFeaturedCard(userId: string, cardId: string): Promise<boolean> {
	const { error } = await supabase.from("profiles").update({ featured_card_id: cardId }).eq("id", userId);
	if (error) {
		console.error("setFeaturedCard error:", error);
		return false;
	}
	return true;
}

export async function getFeaturedCardId(userId: string): Promise<string | null> {
	const { data, error } = await supabase.from("profiles").select("featured_card_id").eq("id", userId).maybeSingle();
	if (error) {
		console.error("getFeaturedCardId error:", error);
		return null;
	}
	return data?.featured_card_id ?? null;
}

export async function unsetFeaturedCard(userId: string): Promise<boolean> {
	const { error } = await supabase.from("profiles").update({ featured_card_id: null }).eq("id", userId);
	if (error) {
		console.error("unsetFeaturedCard error:", error);
		return false;
	}
	return true;
}
