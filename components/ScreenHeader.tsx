import { Spacing } from "@/constants/theme";
import React, { ReactNode } from "react";
import { StyleSheet, View } from "react-native";

type Props = {
	left?: ReactNode;
	center?: ReactNode;
	right?: ReactNode;
};

export function ScreenHeader({ left, center, right }: Props) {
	return (
		<View style={styles.header}>
			{left && <View>{left}</View>}
			{center ? <View style={styles.center}>{center}</View> : <View style={styles.spacer} />}
			{right && <View>{right}</View>}
		</View>
	);
}

const styles = StyleSheet.create({
	header: {
		flexDirection: "row",
		alignItems: "center",
		gap: Spacing.sm,
		paddingHorizontal: Spacing.lg,
		paddingTop: Spacing.sm,
		paddingBottom: Spacing.lg,
	},
	center: {
		flex: 1,
	},
	spacer: {
		flex: 1,
	},
});
