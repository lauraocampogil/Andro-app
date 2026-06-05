import { Colors, Fonts, Radius } from "@/constants/theme";
import { Eye, EyeOff } from "lucide-react-native";
import React, { useState } from "react";
import { Pressable, StyleSheet, Text, TextInput, TextInputProps, View } from "react-native";

type Props = TextInputProps & {
	label: string;
	error?: string;
};

export function Input({ label, error, secureTextEntry, ...rest }: Props) {
	const [focused, setFocused] = useState(false);
	const [reveal, setReveal] = useState(false);
	const isPassword = !!secureTextEntry;

	return (
		<View style={{ width: "100%", marginBottom: 16 }}>
			<Text style={styles.label}>{label}</Text>
			<View style={{ position: "relative", justifyContent: "center" }}>
				<TextInput
					{...rest}
					secureTextEntry={isPassword && !reveal}
					onFocus={(e) => {
						setFocused(true);
						rest.onFocus?.(e);
					}}
					onBlur={(e) => {
						setFocused(false);
						rest.onBlur?.(e);
					}}
					placeholderTextColor={Colors.white30}
					style={[styles.input, isPassword && { paddingRight: 52 }, focused && styles.focused, error && styles.error]}
				/>
				{isPassword && (
					<Pressable style={styles.eyeBtn} onPress={() => setReveal((r) => !r)} hitSlop={8}>
						{reveal ? <EyeOff size={20} color={Colors.white70} strokeWidth={2} /> : <Eye size={20} color={Colors.white70} strokeWidth={2} />}
					</Pressable>
				)}
			</View>
			{error && <Text style={styles.errorText}>{error}</Text>}
		</View>
	);
}

const styles = StyleSheet.create({
	label: { fontFamily: Fonts.bodyBold, fontSize: 11, fontWeight: "700", color: Colors.white70, letterSpacing: 1.5, textTransform: "uppercase", marginBottom: 8 },
	input: { height: 56, borderRadius: Radius.md, paddingHorizontal: 16, fontSize: 15, fontFamily: Fonts.body, color: Colors.white, backgroundColor: Colors.white08, borderWidth: 1, borderColor: Colors.white15 },
	focused: { borderColor: Colors.secundaire, backgroundColor: "rgba(91,88,235,0.08)" },
	error: { borderColor: "#FF5757" },
	errorText: { fontFamily: Fonts.body, fontSize: 12, color: "#FF5757", marginTop: 6, marginLeft: 4 },
	eyeBtn: { position: "absolute", right: 14, padding: 4 },
});
