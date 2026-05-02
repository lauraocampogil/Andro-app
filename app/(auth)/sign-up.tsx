import { Button } from "@/components/Button";
import { CosmicBackground } from "@/components/CosmicBackground";
import { Input } from "@/components/Input";
import { Colors, Fonts, FontSizes, Spacing } from "@/constants/theme";
import { useAuth } from "@/lib/auth";
import { useRouter } from "expo-router";
import React, { useState } from "react";
import { KeyboardAvoidingView, Platform, SafeAreaView, ScrollView, StyleSheet, Text, View } from "react-native";

export default function SignUp() {
	const router = useRouter();
	const { signUp, loading } = useAuth();
	const [name, setName] = useState("");
	const [email, setEmail] = useState("");
	const [password, setPassword] = useState("");
	const [error, setError] = useState<string | null>(null);

	const handle = async () => {
		setError(null);
		if (!name.trim()) return setError("Enter your name");
		if (!email.includes("@")) return setError("Invalid email");
		if (password.length < 6) return setError("Password too short (min 6)");
		const { error: e } = await signUp(email.trim(), password, name.trim());
		if (e) setError(e);
		else router.push("/(auth)/concept");
	};

	return (
		<CosmicBackground>
			<SafeAreaView style={{ flex: 1 }}>
				<KeyboardAvoidingView behavior={Platform.OS === "ios" ? "padding" : "height"} style={{ flex: 1 }}>
					<ScrollView contentContainerStyle={styles.c} keyboardShouldPersistTaps="handled">
						<Text style={styles.title}>Create account</Text>
						<Text style={styles.sub}>Welcome to Andro. Let's get you exploring.</Text>
						<View style={{ marginTop: 32 }}>
							<Input label="Display name" value={name} onChangeText={setName} placeholder="Laura" autoCapitalize="words" />
							<Input label="Email" value={email} onChangeText={setEmail} placeholder="laura@example.com" autoCapitalize="none" keyboardType="email-address" />
							<Input label="Password" value={password} onChangeText={setPassword} placeholder="Min 6 characters" secureTextEntry error={error || undefined} />
						</View>
						<View style={{ marginTop: 16 }}>
							<Button label="Continue" onPress={handle} loading={loading} />
							<Text onPress={() => router.replace("/(auth)/sign-in")} style={styles.link}>
								I already have an account
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
	sub: { fontFamily: Fonts.body, fontSize: FontSizes.body, color: Colors.white70, lineHeight: 21 },
	link: { fontFamily: Fonts.body, fontSize: FontSizes.body, color: Colors.violetLight, marginTop: 16, textAlign: "center" },
});
