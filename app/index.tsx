import { useRouter } from "expo-router";
import { StyleSheet, Text, View } from "react-native";
import { SafeAreaProvider, SafeAreaView } from "react-native-safe-area-context";

export default function Index() {
	const router = useRouter();
	return (
		<SafeAreaProvider>
			<SafeAreaView style={styles.container}>
				<View style={styles.content}>
					<Text style={styles.title}>Welcome to ANDRO</Text>
					<Text style={styles.text}>Open up App.tsx to start working on your app!</Text>
				</View>
			</SafeAreaView>
		</SafeAreaProvider>
	);
}

const styles = StyleSheet.create({
	container: {
		flex: 1,
		backgroundColor: "#121212",
	},
	content: {
		flex: 1,
		paddingHorizontal: 20,
		paddingTop: 20,
	},
	text: {
		color: "#FFFFFF",
	},
	title: {
		color: "#FFFFFF",
		fontSize: 24,
		fontWeight: "bold",
		marginBottom: 10,
	},
});
