import { CosmicBackground } from "@/components/CosmicBackground";
import { Globe3D } from "@/components/Globe3D/Globe3D";
import { Colors } from "@/constants/theme";
import { useAuth } from "@/lib/auth";
import { useRacesStore } from "@/lib/racesStore";
import { useRouter } from "expo-router";
import { ArrowLeft } from "lucide-react-native";
import React, { useEffect } from "react";
import { Pressable, StyleSheet, View } from "react-native";

export default function GlobeFullScreen() {
	const router = useRouter();
	const { session } = useAuth();
	const { countryCodes, loadUserRaces } = useRacesStore();

	// Reload races when this page opens (in case scan happened recently)
	useEffect(() => {
		if (session?.user?.id) {
			loadUserRaces(session.user.id);
		}
	}, [session?.user?.id]);

	return (
		<CosmicBackground>
			<View style={styles.container}>
				<Pressable style={styles.backButton} onPress={() => router.back()}>
					<ArrowLeft size={24} color={Colors.white} strokeWidth={2.5} />
				</Pressable>

				<Globe3D completedCountries={countryCodes} rotationSpeed={0} interactive={true} zoomable={true} cameraDistance={2.5} globeRadius={0.5} />
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
