import { CosmicBackground } from "@/components/CosmicBackground";
import { Colors, Fonts } from "@/constants/theme";
import { Text, View } from "react-native";

export default function Scan() {
	return (
		<CosmicBackground>
			<View style={{ flex: 1, alignItems: "center", justifyContent: "center" }}>
				<Text style={{ fontFamily: Fonts.display, fontSize: 36, fontStyle: "italic", color: Colors.white }}>Scan</Text>
				<Text style={{ color: Colors.white70, marginTop: 8 }}>Coming in MVP2</Text>
			</View>
		</CosmicBackground>
	);
}
