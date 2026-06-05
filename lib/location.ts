import { supabase } from "@/lib/supabase";
import * as Location from "expo-location";

export type LocationData = {
	latitude: number;
	longitude: number;
	city: string | null;
	country_code: string | null;
};

export async function requestLocationPermission(): Promise<boolean> {
	const { status } = await Location.requestForegroundPermissionsAsync();
	return status === "granted";
}

export async function getCurrentLocation(precision: "precise" | "city"): Promise<LocationData | null> {
	const { status } = await Location.getForegroundPermissionsAsync();
	if (status !== "granted") {
		const granted = await requestLocationPermission();
		if (!granted) return null;
	}

	try {
		const loc = await Location.getCurrentPositionAsync({
			accuracy: precision === "precise" ? Location.Accuracy.High : Location.Accuracy.Low,
		});

		// Reverse geocode to get city + country
		const reverse = await Location.reverseGeocodeAsync({
			latitude: loc.coords.latitude,
			longitude: loc.coords.longitude,
		});
		const place = reverse[0];

		return {
			latitude: precision === "city" ? Math.round(loc.coords.latitude * 100) / 100 : loc.coords.latitude,
			longitude: precision === "city" ? Math.round(loc.coords.longitude * 100) / 100 : loc.coords.longitude,
			city: place?.city ?? place?.subregion ?? null,
			country_code: place?.isoCountryCode ?? null,
		};
	} catch (err) {
		console.error("Location error:", err);
		return null;
	}
}

export async function saveUserLocation(userId: string, loc: LocationData): Promise<boolean> {
	const { error } = await supabase
		.from("profiles")
		.update({
			latitude: loc.latitude,
			longitude: loc.longitude,
			city: loc.city,
			country_code: loc.country_code,
			location_updated_at: new Date().toISOString(),
		})
		.eq("id", userId);
	return !error;
}
