import { ImageSourcePropType } from "react-native";

const europe = require("@/assets/continents/europe.png");

const CONTINENTS: Record<string, ImageSourcePropType> = {
	Europe: europe,
};

export function getContinentImage(continent: string): ImageSourcePropType | null {
	return CONTINENTS[continent] ?? null;
}

export function hasContinentImage(continent: string): boolean {
	return continent in CONTINENTS;
}
