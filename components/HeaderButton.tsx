import { Colors } from "@/constants/theme";
import React, { ReactNode } from "react";
import { Pressable, StyleSheet, ViewStyle } from "react-native";

type Props = {
	onPress?: () => void;
	variant?: "light" | "primary";
	children: ReactNode;
	style?: ViewStyle;
};

export function HeaderButton({ onPress, variant = "light", children, style }: Props) {
	return (
		<Pressable onPress={onPress} style={({ pressed }) => [styles.btn, variant === "primary" ? styles.primary : styles.light, pressed && { opacity: 0.85 }, style]}>
			{children}
		</Pressable>
	);
}

const styles = StyleSheet.create({
	btn: {
		width: 44,
		height: 44,
		borderRadius: 12,
		alignItems: "center",
		justifyContent: "center",
	},
	light: { backgroundColor: Colors.white },
	primary: { backgroundColor: Colors.secundaire },
});
