import { ImageSourcePropType } from "react-native";

const europe = require("@/assets/continents/europe.png");
const asia = require("@/assets/continents/asia.png");
const africa = require("@/assets/continents/africa.png");
const northAmerica = require("@/assets/continents/north-America.png");
const southAmerica = require("@/assets/continents/south-America.png");
const australia = require("@/assets/continents/australia.png");

const CONTINENTS: Record<string, ImageSourcePropType> = {
	Europe: europe,
	Asia: asia,
	Africa: africa,
	"North America": northAmerica,
	"South America": southAmerica,
	Australia: australia,
};

export function getContinentImage(continent: string): ImageSourcePropType | null {
	return CONTINENTS[continent] ?? null;
}

export function hasContinentImage(continent: string): boolean {
	return continent in CONTINENTS;
}
