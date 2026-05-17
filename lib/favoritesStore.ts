import { create } from "zustand";
import { addFavorite, fetchFavoriteRaceIds, removeFavorite } from "./favorites";

type FavoritesStore = {
	favoriteIds: Set<string>;
	loadFavorites: (userId: string) => Promise<void>;
	toggleFavorite: (userId: string, raceId: string) => Promise<void>;
	isFavorite: (raceId: string) => boolean;
};

export const useFavoritesStore = create<FavoritesStore>((set, get) => ({
	favoriteIds: new Set(),

	loadFavorites: async (userId) => {
		const ids = await fetchFavoriteRaceIds(userId);
		set({ favoriteIds: new Set(ids) });
	},

	toggleFavorite: async (userId, raceId) => {
		const current = get().favoriteIds;
		const next = new Set(current);
		if (current.has(raceId)) {
			next.delete(raceId);
			set({ favoriteIds: next });
			const ok = await removeFavorite(userId, raceId);
			if (!ok) set({ favoriteIds: current });
		} else {
			next.add(raceId);
			set({ favoriteIds: next });
			const ok = await addFavorite(userId, raceId);
			if (!ok) set({ favoriteIds: current });
		}
	},

	isFavorite: (raceId) => get().favoriteIds.has(raceId),
}));
