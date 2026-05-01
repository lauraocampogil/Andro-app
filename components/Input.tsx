import { Colors, Fonts, Radius } from "@/constants/theme";
import React, { useState } from "react";
import { StyleSheet, Text, TextInput, TextInputProps, View } from "react-native";

type Props = TextInputProps & {
	label: string;
	error?: string;
};

export function Input({ label, error, ...rest }: Props) {
	const [focused, setFocused] = useState(false);
	return (
		<View style={{ width: "100%", marginBottom: 16 }}>
			<Text style={styles.label}>{label}</Text>
			<TextInput
				{...rest}
				onFocus={(e) => {
					setFocused(true);
					rest.onFocus?.(e);
				}}
				onBlur={(e) => {
					setFocused(false);
					rest.onBlur?.(e);
				}}
				placeholderTextColor={Colors.white30}
				style={[styles.input, focused && styles.focused, error && styles.error]}
			/>
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
});
