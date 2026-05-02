import { useAuth } from "@/lib/auth";
import { Stack, useRouter, useSegments } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { useEffect } from "react";

export default function RootLayout() {
	const { initialized, session, init } = useAuth();
	const router = useRouter();
	const segments = useSegments();

	useEffect(() => {
		init();
	}, []);

	useEffect(() => {
		if (!initialized) return;
		const inAuth = (segments[0] as string) === "(auth)";
		const inTabs = (segments[0] as string) === "(tabs)";
		if (!session && inTabs) router.replace("/(auth)/welcome" as any);
		else if (session && inAuth) router.replace("/(tabs)/home" as any);
	}, [initialized, session, segments]);

	if (!initialized) return null;

	return (
		<>
			<StatusBar style="light" />
			<Stack screenOptions={{ headerShown: false, animation: "fade" }}>
				<Stack.Screen name="index" />
				<Stack.Screen name="(auth)" />
				<Stack.Screen name="(tabs)" />
			</Stack>
		</>
	);
}
