import { Globe3D } from "@/components/Globe3D/Globe3D";
import { Colors } from "@/constants/theme";
import { useRouter } from "expo-router";
import { ArrowLeft } from "lucide-react-native";
import React from "react";
import { Pressable, StyleSheet, View } from "react-native";

export default function GlobeFullScreen() {
	const router = useRouter();

	return (
		<View style={styles.container}>
			<Pressable style={styles.backButton} onPress={() => router.back()}>
				<ArrowLeft size={24} color={Colors.white} strokeWidth={2.5} />
			</Pressable>

			<Globe3D completedCountries={["BEL", "DEU"]} rotationSpeed={0} interactive={true} cameraDistance={2.5} />
		</View>
	);
}

const styles = StyleSheet.create({
	container: {
		flex: 1,
		backgroundColor: "#04081A",
	},
	backButton: {
		position: "absolute",
		top: 60,
		left: 20,
		zIndex: 10,
		width: 44,
		height: 44,
		borderRadius: 22,
		backgroundColor: "rgba(91, 88, 235, 0.3)",
		justifyContent: "center",
		alignItems: "center",
	},
});
