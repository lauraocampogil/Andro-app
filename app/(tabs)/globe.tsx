import { CosmicBackground } from "@/components/CosmicBackground";
import { Globe3D } from "@/components/Globe3D/Globe3D";
import { Colors } from "@/constants/theme";
import { useRouter } from "expo-router";
import { ArrowLeft } from "lucide-react-native";
import React from "react";
import { Pressable, StyleSheet, View } from "react-native";

export default function GlobeFullScreen() {
	const router = useRouter();

	return (
		<CosmicBackground>
			<View style={styles.container}>
				<Pressable style={styles.backButton} onPress={() => router.back()}>
					<ArrowLeft size={24} color={Colors.white} strokeWidth={2.5} />
				</Pressable>

				<Globe3D completedCountries={["BEL", "DEU"]} rotationSpeed={0} interactive={true} zoomable={true} cameraDistance={2.5} globeRadius={0.5} />
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
		backgroundColor: Colors.white30,
		justifyContent: "center",
		alignItems: "center",
	},
});
