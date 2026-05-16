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
};

export async function fetchMuseumCards(userId: string): Promise<MuseumCard[]> {
	const { data: allCards, error: cardsError } = await supabase.from("cards").select("*, race:races(id, name, city, country, country_code, continent)");

	if (cardsError || !allCards) return [];

	const { data: userCards } = await supabase.from("user_cards").select("card_id, created_at").eq("user_id", userId);

	const unlockedMap = new Map<string, string>();
	(userCards ?? []).forEach((uc: any) => {
		unlockedMap.set(uc.card_id, uc.created_at);
	});

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
