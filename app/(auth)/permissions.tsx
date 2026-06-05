import { Button } from "@/components/Button";
import { CosmicBackground } from "@/components/CosmicBackground";
import { Colors, Fonts, FontSizes, Radius, Spacing } from "@/constants/theme";
import { useAuth } from "@/lib/auth";
import { getCurrentLocation, requestLocationPermission, saveUserLocation } from "@/lib/location";
import { updateSetting } from "@/lib/settings";
import * as ImagePicker from "expo-image-picker";
import { useRouter } from "expo-router";
import { Bell, Camera, MapPin } from "lucide-react-native";
import React, { useState } from "react";
import { Alert, Linking, Pressable, StyleSheet, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

const PERMS = [
	{ key: "location", Icon: MapPin, title: "Location", desc: "Find races near you" },
	{ key: "camera", Icon: Camera, title: "Camera", desc: "Scan your race cards" },
	{ key: "notifications", Icon: Bell, title: "Notifications", desc: "Race alerts & friends activity" },
];

export default function Permissions() {
	const router = useRouter();
	const { completeOnboarding, session } = useAuth();
	const userId = session?.user?.id;

	const [toggles, setToggles] = useState<Record<string, boolean>>({
		location: false,
		camera: false,
		notifications: false,
	});
	const [busy, setBusy] = useState(false);

	const togglePermission = async (key: string) => {
		// If currently ON → just turn off (cannot revoke OS permission from code)
		if (toggles[key]) {
			setToggles((prev) => ({ ...prev, [key]: false }));
			if (key === "location" && userId) {
				await updateSetting(userId, "location_enabled", false);
			}
			return;
		}

		setBusy(true);

		// Currently OFF → request real OS permission
		if (key === "location") {
			const granted = await requestLocationPermission();
			if (!granted) {
				setBusy(false);
				Alert.alert("Location permission denied", "Enable it later in your device Settings to find races near you.", [{ text: "OK" }, { text: "Open Settings", onPress: () => Linking.openSettings() }]);
				return;
			}
			// Fetch & save real location
			if (userId) {
				const loc = await getCurrentLocation("city");
				if (loc) await saveUserLocation(userId, loc);
				await updateSetting(userId, "location_enabled", true);
				await updateSetting(userId, "location_precision", "city");
			}
			setToggles((prev) => ({ ...prev, location: true }));
		}

		if (key === "camera") {
			const { status } = await ImagePicker.requestCameraPermissionsAsync();
			if (status !== "granted") {
				setBusy(false);
				Alert.alert("Camera permission denied", "You won't be able to scan race cards. Enable it later in Settings.", [{ text: "OK" }, { text: "Open Settings", onPress: () => Linking.openSettings() }]);
				return;
			}
			setToggles((prev) => ({ ...prev, camera: true }));
		}

		if (key === "notifications") {
			// For real push notifs we'd use expo-notifications. For now, just save preference.
			if (userId) {
				await updateSetting(userId, "notifications_enabled", true);
			}
			setToggles((prev) => ({ ...prev, notifications: true }));
		}

		setBusy(false);
	};

	const handleEnter = async () => {
		await completeOnboarding();
		router.replace("/(tabs)/home" as any);
	};

	return (
		<CosmicBackground>
			<SafeAreaView style={{ flex: 1 }}>
				<View style={styles.c}>
					<View style={styles.dots}>
						<View style={styles.dot} />
						<View style={styles.dot} />
						<View style={[styles.dot, styles.dotActive]} />
					</View>
					<Text style={styles.title}>Almost there!</Text>
					<Text style={styles.sub}>Let Andro help you discover races and track your runs.</Text>

					<View style={styles.list}>
						{PERMS.map(({ key, Icon, title, desc }) => {
							const isOn = toggles[key];
							return (
								<Pressable key={key} onPress={() => togglePermission(key)} disabled={busy} style={({ pressed }) => [styles.row, pressed && { opacity: 0.85 }, busy && { opacity: 0.6 }]}>
									<View style={styles.iconBox}>
										<Icon size={22} color={Colors.white} strokeWidth={2} />
									</View>
									<View style={{ flex: 1 }}>
										<Text style={styles.rTitle}>{title}</Text>
										<Text style={styles.rDesc}>{desc}</Text>
									</View>
									<View style={[styles.toggleTrack, isOn && styles.toggleTrackOn]}>
										<View style={[styles.toggleThumb, isOn && styles.toggleThumbOn]} />
									</View>
								</Pressable>
							);
						})}
					</View>

					<View style={{ flex: 1 }} />
					<Button label="Enter Andro" onPress={handleEnter} />
					<Text onPress={() => router.back()} style={styles.link}>
						Back
					</Text>
				</View>
			</SafeAreaView>
		</CosmicBackground>
	);
}

const styles = StyleSheet.create({
	c: { flex: 1, paddingHorizontal: Spacing.lg, paddingVertical: 40, alignItems: "center" },
	dots: { flexDirection: "row", gap: 6, marginBottom: 30 },
	dot: { width: 6, height: 6, borderRadius: 3, backgroundColor: Colors.white15 },
	dotActive: { width: 24, backgroundColor: Colors.violetLight },
	title: { fontFamily: Fonts.bodyBold, fontSize: FontSizes.h3, fontWeight: "800", color: Colors.white, marginTop: 8 },
	sub: { fontFamily: Fonts.body, fontSize: FontSizes.body, color: Colors.white70, textAlign: "center", marginTop: 8, maxWidth: 300 },
	list: { width: "100%", marginTop: 30, gap: 14 },
	row: { flexDirection: "row", alignItems: "center", gap: 14, backgroundColor: Colors.white08, borderWidth: 1, borderColor: Colors.white15, borderRadius: Radius.lg, padding: 16 },
	iconBox: { width: 44, height: 44, borderRadius: 12, backgroundColor: Colors.secundaire, alignItems: "center", justifyContent: "center" },
	rTitle: { fontFamily: Fonts.bodyBold, fontSize: FontSizes.body, fontWeight: "700", color: Colors.white, marginBottom: 2 },
	rDesc: { fontFamily: Fonts.body, fontSize: FontSizes.small, color: Colors.white70 },

	toggleTrack: { width: 44, height: 26, borderRadius: 13, backgroundColor: Colors.white15, padding: 3, justifyContent: "center" },
	toggleTrackOn: { backgroundColor: Colors.secundaire },
	toggleThumb: { width: 20, height: 20, borderRadius: 10, backgroundColor: Colors.white, alignSelf: "flex-start" },
	toggleThumbOn: { alignSelf: "flex-end" },

	link: { fontFamily: Fonts.body, fontSize: FontSizes.body, color: Colors.white70, marginTop: 16 },
});
