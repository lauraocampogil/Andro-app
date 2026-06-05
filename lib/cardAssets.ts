import { ImageSourcePropType } from "react-native";

const card_capetown = require("@/assets/cards/card_capetown.png");
const card_melbourne = require("@/assets/cards/card_melbourne.png");
const card_toronto = require("@/assets/cards/card_toronto.png");
const card_seoul = require("@/assets/cards/card_seoul.png");
const card_brussel = require("@/assets/cards/card_brussel.png");
const card_rio = require("@/assets/cards/card_rio.png");
const card_lisbon = require("@/assets/cards/card_lisbon.png");
const card_tokyo = require("@/assets/cards/card_tokyo.png");

export const cardBack = require("@/assets/cards/back_card.png");

const CARDS_BY_QR: Record<string, ImageSourcePropType> = {
	"ANDRO-CPT-001": card_capetown,
	"ANDRO-MEL-001": card_melbourne,
	"ANDRO-TOR-001": card_toronto,
	"ANDRO-SEL-001": card_seoul,
	"ANDRO-BRU-001": card_brussel,
	"ANDRO-RIO-001": card_rio,
	"ANDRO-LIS-001": card_lisbon,
	"ANDRO-TYO-001": card_tokyo,
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

	if (card.creature_image_url && card.creature_image_url.startsWith("http")) {
		return { uri: card.creature_image_url };
	}

	return card_brussel;
}
