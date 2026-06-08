import { Button } from "@/components/Button";
import { CosmicBackground } from "@/components/CosmicBackground";
import { Input } from "@/components/Input";
import { Colors, Fonts, FontSizes, Spacing } from "@/constants/theme";
import { useAuth } from "@/lib/auth";
import { Image } from "expo-image";
import { useRouter } from "expo-router";
import React, { useState } from "react";
import { KeyboardAvoidingView, Platform, SafeAreaView, ScrollView, StyleSheet, Text, View } from "react-native";

export default function SignIn() {
	const router = useRouter();
	const [email, setEmail] = useState("");
	const [password, setPassword] = useState("");
	const [error, setError] = useState<string | null>(null);
	const { signIn, resetPassword, loading } = useAuth();
	const [info, setInfo] = useState<string | null>(null);

	const handle = async () => {
		setError(null);
		if (!email.includes("@")) return setError("Invalid email");
		if (password.length < 6) return setError("Password too short");
		const { error: e } = await signIn(email.trim(), password);
		if (e) setError(e);
		else router.replace("/(tabs)/home");
	};

	const handleReset = async () => {
		setError(null);
		setInfo(null);
		if (!email.includes("@")) return setError("Enter your email above first.");
		const { error: e } = await resetPassword(email.trim());
		if (e) setError(e);
		else setInfo("Check your inbox for a reset link.");
	};

	return (
		<CosmicBackground>
			<SafeAreaView style={{ flex: 1 }}>
				<KeyboardAvoidingView behavior={Platform.OS === "ios" ? "padding" : "height"} style={{ flex: 1 }}>
					<ScrollView contentContainerStyle={styles.c} keyboardShouldPersistTaps="handled">
						<Text style={styles.title}>Welcome back</Text>
						<Text style={styles.sub}>Andro missed you.</Text>
						<Image source={require("@/assets/animations/waving_animation.gif")} style={styles.animation} contentFit="contain" />
						<View style={{ marginTop: 32 }}>
							<Input label="Email" value={email} onChangeText={setEmail} placeholder="jean@example.com" autoCapitalize="none" keyboardType="email-address" />
							<Input label="Password" value={password} onChangeText={setPassword} placeholder="Your password" secureTextEntry error={error || undefined} />
							<Text onPress={handleReset} style={styles.forgot}>
								Forgot password?
							</Text>
							{info && <Text style={styles.info}>{info}</Text>}
						</View>
						<View style={{ marginTop: 16 }}>
							<Button label="Sign in" onPress={handle} loading={loading} />
							<Text onPress={() => router.replace("/(auth)/welcome")} style={styles.link}>
								I'm new to Andro
							</Text>
						</View>
					</ScrollView>
				</KeyboardAvoidingView>
			</SafeAreaView>
		</CosmicBackground>
	);
}

const styles = StyleSheet.create({
	c: { flexGrow: 1, paddingHorizontal: Spacing.lg, paddingTop: 60, paddingBottom: 40 },
	title: { fontFamily: Fonts.bodyBold, fontSize: FontSizes.h1, fontWeight: "800", color: Colors.white, marginBottom: 8 },
	sub: { fontFamily: Fonts.body, fontSize: FontSizes.body, color: Colors.white70 },
	link: { fontFamily: Fonts.body, fontSize: FontSizes.body, color: Colors.violetLight, marginTop: 16, textAlign: "center" },
	forgot: { fontFamily: Fonts.body, fontSize: 13, color: Colors.violetLight, textAlign: "right", marginTop: 4 },
	info: { fontFamily: Fonts.body, fontSize: 13, color: "#79a1ff", textAlign: "center", marginTop: 12 },
	animation: { width: 350, height: 250, marginBottom: 2 },
});
