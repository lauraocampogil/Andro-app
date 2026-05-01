import { Colors, Fonts, Radius } from "@/constants/theme";
import React from "react";
import { ActivityIndicator, Pressable, StyleSheet, Text, ViewStyle } from "react-native";

type Props = {
	label: string;
	onPress: () => void;
	loading?: boolean;
	disabled?: boolean;
	style?: ViewStyle;
};

export function Button({ label, onPress, loading, disabled, style }: Props) {
	return (
		<Pressable onPress={onPress} disabled={disabled || loading} style={({ pressed }) => [styles.btn, (disabled || loading) && { opacity: 0.5 }, pressed && { opacity: 0.85, transform: [{ scale: 0.98 }] }, style]}>
			{loading ? <ActivityIndicator color={Colors.white} /> : <Text style={styles.label}>{label}</Text>}
		</Pressable>
	);
}

const styles = StyleSheet.create({
	btn: {
		height: 56,
		borderRadius: Radius.pill,
		backgroundColor: Colors.secundaire,
		alignItems: "center",
		justifyContent: "center",
		width: "100%",
		shadowColor: Colors.secundaire,
		shadowOffset: { width: 0, height: 12 },
		shadowOpacity: 0.5,
		shadowRadius: 32,
		elevation: 12,
	},
	label: {
		fontFamily: Fonts.bodyBold,
		fontSize: 16,
		fontWeight: "800",
		color: Colors.white,
		letterSpacing: 0.3,
	},
});
