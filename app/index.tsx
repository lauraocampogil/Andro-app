import { useAuth } from "@/lib/auth";
import { Redirect } from "expo-router";

export default function Index() {
	const { session, initialized } = useAuth();
	if (!initialized) return null;

	const href = session ? "/(tabs)/home" : "/(auth)/welcome";
	return <Redirect href={href as any} />;
}
