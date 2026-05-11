import { useAuth } from "@/lib/auth";
import { useFonts } from "expo-font";
import { Stack, useRouter, useSegments } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { useEffect } from "react";

export default function RootLayout() {
	const { initialized, session, onboardingCompleted, init } = useAuth();
	const router = useRouter();
	const segments = useSegments();

	const [fontsLoaded] = useFonts({
		Tanker: require("@/assets/fonts/Tanker-Regular.ttf"),
		Fustat: require("@/assets/fonts/Fustat-Regular.ttf"),
		"Fustat-SemiBold": require("@/assets/fonts/Fustat-SemiBold.ttf"),
		"Fustat-Bold": require("@/assets/fonts/Fustat-Bold.ttf"),
	});

	useEffect(() => {
		init();
	}, []);

	useEffect(() => {
		if (!initialized) return;
		const inTabs = (segments[0] as string) === "(tabs)";
		const onWelcome = (segments[0] as string) === "(auth)" && (segments[1] as string) === "welcome";

		if (!session && inTabs) {
			router.replace("/(auth)/welcome" as any);
		} else if (session && onboardingCompleted && onWelcome) {
			router.replace("/(tabs)/home" as any);
		}
	}, [initialized, session, onboardingCompleted, segments]);

	if (!initialized || !fontsLoaded) return null;

	return (
		<>
			<StatusBar style="light" />
			<Stack screenOptions={{ headerShown: false, animation: "fade" }}>
				<Stack.Screen name="index" />
				<Stack.Screen name="(auth)" />
				<Stack.Screen name="(tabs)" />
				<Stack.Screen name="card-reveal" />
			</Stack>
		</>
	);
}
