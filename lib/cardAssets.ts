import { ImageSourcePropType } from "react-native";

const card_brussel = require("@/assets/cards/card_brussel.png");

const CARDS_BY_QR: Record<string, ImageSourcePropType> = {
	"ANDRO-BRU-001": card_brussel,
};

const CARDS_BY_COUNTRY: Record<string, ImageSourcePropType> = {
	BEL: card_brussel,
	BE: card_brussel,
};

const CARDS_BY_RACE_NAME: Record<string, ImageSourcePropType> = {
	"Brussels Marathon": card_brussel,
};

type CardLike = {
	qr_code?: string | null;
	creature_image_url?: string | null;
	race?: {
		name?: string | null;
		country_code?: string | null;
	} | null;
};

export function resolveCardImage(card: CardLike): ImageSourcePropType {
	if (card.qr_code && CARDS_BY_QR[card.qr_code]) return CARDS_BY_QR[card.qr_code];

	const code = card.race?.country_code;
	if (code && CARDS_BY_COUNTRY[code]) return CARDS_BY_COUNTRY[code];

	const name = card.race?.name;
	if (name && CARDS_BY_RACE_NAME[name]) return CARDS_BY_RACE_NAME[name];

	if (card.creature_image_url && card.creature_image_url.startsWith("http")) {
		return { uri: card.creature_image_url };
	}

	return card_brussel;
}
