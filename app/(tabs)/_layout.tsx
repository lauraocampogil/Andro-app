import { Colors } from "@/constants/theme";
import { Tabs } from "expo-router";
import { Footprints, Globe, Landmark, ScanLine, Users } from "lucide-react-native";
import React from "react";
import { Pressable, StyleSheet, View } from "react-native";

function TabBar({ state, navigation }: any) {
	const tabs = [
		{ name: "home", Icon: Globe },
		{ name: "races", Icon: Footprints },
		{ name: "scan", Icon: ScanLine, isCenter: true },
		{ name: "community", Icon: Users },
		{ name: "profile", Icon: Landmark },
	];

	return (
		<View style={styles.wrap} pointerEvents="box-none">
			<View style={styles.bar}>
				{tabs.map((tab, idx) => {
					const focused = state.index === idx;
					const { Icon } = tab;

					if (tab.isCenter) {
						return (
							<Pressable key={tab.name} onPress={() => navigation.navigate(tab.name)} style={styles.center}>
								<Icon size={26} color={Colors.white} strokeWidth={2.5} />
							</Pressable>
						);
					}

					return (
						<Pressable key={tab.name} onPress={() => navigation.navigate(tab.name)} style={styles.tab}>
							<Icon size={22} color={focused ? Colors.secundaire : Colors.ink} strokeWidth={2} />
						</Pressable>
					);
				})}
			</View>
		</View>
	);
}

export default function TabsLayout() {
	return (
		<Tabs tabBar={(props) => <TabBar {...props} />} screenOptions={{ headerShown: false }}>
			<Tabs.Screen name="home" />
			<Tabs.Screen name="races" />
			<Tabs.Screen name="scan" />
			<Tabs.Screen name="community" />
			<Tabs.Screen name="profile" />
			<Tabs.Screen name="globe" options={{ href: null }} />
		</Tabs>
	);
}

const styles = StyleSheet.create({
	wrap: { position: "absolute", bottom: 24, left: 16, right: 16 },
	bar: {
		height: 64,
		backgroundColor: Colors.white,
		borderRadius: 32,
		flexDirection: "row",
		alignItems: "center",
		paddingHorizontal: 16,
		shadowColor: "#000",
		shadowOffset: { width: 0, height: 12 },
		shadowOpacity: 0.5,
		shadowRadius: 40,
		elevation: 12,
	},
	tab: { flex: 1, height: "100%", alignItems: "center", justifyContent: "center" },
	center: {
		height: 70,
		borderRadius: 70,
		backgroundColor: Colors.secundaire,
		alignItems: "center",
		justifyContent: "center",
		marginBottom: 36,
		borderWidth: 3,
		borderColor: Colors.white,
		elevation: 12,
		flex: 1,
	},
});
