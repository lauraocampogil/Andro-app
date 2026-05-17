import { CompletedRace, computeProgressStats, fetchUserCompletedRaces, getCompletedContinents, getCompletedCountryCodes, ProgressStats } from "@/lib/races";
import { create } from "zustand";

type RacesState = {
	completedRaces: CompletedRace[];
	countryCodes: string[];
	continents: string[];
	stats: ProgressStats;
	loading: boolean;

	loadUserRaces: (userId: string) => Promise<void>;
	refreshUserRaces: (userId: string) => Promise<void>;
};

export const useRacesStore = create<RacesState>((set) => ({
	completedRaces: [],
	countryCodes: [],
	continents: [],
	stats: {
		countriesCount: 0,
		continentsCount: 0,
		totalContinents: 7,
		worldPercent: 0,
	},
	loading: false,

	loadUserRaces: async (userId: string) => {
		set({ loading: true });
		const races = await fetchUserCompletedRaces(userId);
		set({
			completedRaces: races,
			countryCodes: getCompletedCountryCodes(races),
			continents: getCompletedContinents(races),
			stats: computeProgressStats(races),
			loading: false,
		});
	},

	refreshUserRaces: async (userId: string) => {
		const races = await fetchUserCompletedRaces(userId);
		set({
			completedRaces: races,
			countryCodes: getCompletedCountryCodes(races),
			continents: getCompletedContinents(races),
			stats: computeProgressStats(races),
		});
	},
}));
