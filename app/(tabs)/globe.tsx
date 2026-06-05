import { CosmicBackground } from "@/components/CosmicBackground";
import { Globe3D } from "@/components/Globe3D/Globe3D";
import { Colors } from "@/constants/theme";
import { useAuth } from "@/lib/auth";
import { useRacesStore } from "@/lib/racesStore";
import { supabase } from "@/lib/supabase";
import { useRouter } from "expo-router";
import { ArrowLeft } from "lucide-react-native";
import React, { useEffect, useState } from "react";
import { Pressable, StyleSheet, View } from "react-native";

export default function GlobeFullScreen() {
	const router = useRouter();
	const { session } = useAuth();
	const { countryCodes, loadUserRaces } = useRacesStore();
	const [userLoc, setUserLoc] = useState<{ lat: number; lng: number } | null>(null);

	useEffect(() => {
		if (session?.user?.id) {
			loadUserRaces(session.user.id);
		}
	}, [session?.user?.id]);

	useEffect(() => {
		if (!session?.user?.id) return;
		(async () => {
			const { data } = await supabase.from("profiles").select("latitude, longitude").eq("id", session.user.id).maybeSingle();
			if (data?.latitude != null && data?.longitude != null) {
				setUserLoc({ lat: data.latitude, lng: data.longitude });
			}
		})();
	}, [session?.user?.id]);

	return (
		<CosmicBackground>
			<View style={styles.container}>
				<Pressable style={styles.backButton} onPress={() => router.back()}>
					<ArrowLeft size={24} color={Colors.white} strokeWidth={2.5} />
				</Pressable>

				<Globe3D completedCountries={countryCodes} rotationSpeed={0} interactive={true} zoomable={true} cameraDistance={2.5} globeRadius={0.5} userLocation={userLoc} />
			</View>
		</CosmicBackground>
	);
}

const styles = StyleSheet.create({
	container: {
		flex: 1,
	},
	backButton: {
		position: "absolute",
		top: 60,
		left: 20,
		zIndex: 10,
		width: 44,
		height: 44,
		borderRadius: 22,
		backgroundColor: Colors.white15,
		justifyContent: "center",
		alignItems: "center",
	},
});
