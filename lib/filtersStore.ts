import { create } from "zustand";

export type Level = "beginner" | "intermediate" | "advanced";

export type RaceFilters = {
	year?: number;
	month?: number; // 1-12
	continents: string[];
	distances: number[];
	levels: Level[];
	surfaces: string[];
	superHalf: boolean;
	majors: boolean;
};

export const DEFAULT_FILTERS: RaceFilters = {
	continents: [],
	distances: [],
	levels: [],
	surfaces: [],
	superHalf: false,
	majors: false,
};

type FiltersStore = {
	filters: RaceFilters;
	setFilters: (f: RaceFilters) => void;
	resetFilters: () => void;
};

export const useFiltersStore = create<FiltersStore>((set) => ({
	filters: DEFAULT_FILTERS,
	setFilters: (f) => set({ filters: f }),
	resetFilters: () => set({ filters: DEFAULT_FILTERS }),
}));
