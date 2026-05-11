import { CosmicBackground } from "@/components/CosmicBackground";
import { Colors, Fonts, FontSizes, Spacing } from "@/constants/theme";
import { useAuth } from "@/lib/auth";
import { markCardScanned } from "@/lib/races";
import { useRacesStore } from "@/lib/racesStore";
import { CameraView, useCameraPermissions } from "expo-camera";
import { useRouter } from "expo-router";
import { ScanLine, X } from "lucide-react-native";
import React, { useState } from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

export default function Scan() {
	const router = useRouter();
	const [permission, requestPermission] = useCameraPermissions();
	const [scanned, setScanned] = useState(false);
	const { session } = useAuth();
	const { refreshUserRaces } = useRacesStore();

	// Permission state loading
	if (!permission) {
		return (
			<CosmicBackground>
				<View style={styles.center}>
					<Text style={styles.title}>Loading camera...</Text>
				</View>
			</CosmicBackground>
		);
	}

	// Permission denied screen
	if (!permission.granted) {
		return (
			<CosmicBackground>
				<SafeAreaView style={{ flex: 1 }}>
					<View style={styles.center}>
						<ScanLine size={64} color={Colors.violetLight} strokeWidth={1.5} />
						<Text style={styles.title}>Camera access needed</Text>
						<Text style={styles.subtitle}>Andro needs your camera to scan race cards and unlock your collection.</Text>
						<Pressable style={styles.button} onPress={requestPermission}>
							<Text style={styles.buttonText}>Allow Camera</Text>
						</Pressable>
					</View>
				</SafeAreaView>
			</CosmicBackground>
		);
	}

	// QR scan handler
	const handleScan = async ({ data }: { data: string }) => {
		if (scanned) return;
		setScanned(true);

		console.log("QR scanned:", data);

		if (!data.startsWith("ANDRO-")) {
			console.warn("Invalid QR code format:", data);
			setTimeout(() => setScanned(false), 2000);
			return;
		}

		if (!session?.user?.id) {
			console.warn("No user session");
			setTimeout(() => setScanned(false), 2000);
			return;
		}

		console.log("Processing scan...");
		const result = await markCardScanned(session.user.id, data);

		if (result.invalidCode) {
			console.warn("Card not found for this QR");
			setTimeout(() => setScanned(false), 2000);
			return;
		}

		if (result.alreadyCollected) {
			console.log("Already collected:", result.race?.name);
			// Navigate to reveal in "already collected" mode
			router.replace(`/card-reveal?qr=${data}&already=true` as any);
			return;
		}

		if (result.success) {
			console.log("Card unlocked!", result.race?.name);

			// Refresh the store so the globe + stats update for when user comes back
			await refreshUserRaces(session.user.id);

			// Navigate to reveal page
			router.replace(`/card-reveal?qr=${data}` as any);
			return;
		}

		console.warn("Scan failed");
		setTimeout(() => setScanned(false), 2000);
	};

	return (
		<View style={styles.container}>
			<CameraView style={StyleSheet.absoluteFillObject} facing="back" barcodeScannerSettings={{ barcodeTypes: ["qr"] }} onBarcodeScanned={scanned ? undefined : handleScan} />

			{/* Overlay UI on top of camera */}
			<SafeAreaView style={styles.overlay} pointerEvents="box-none">
				{/* Close button */}
				<Pressable style={styles.closeButton} onPress={() => router.back()}>
					<X size={24} color={Colors.white} strokeWidth={2.5} />
				</Pressable>

				{/* Scan frame in the center */}
				<View style={styles.scanFrameWrapper}>
					<View style={styles.scanFrame}>
						<View style={[styles.corner, styles.cornerTL]} />
						<View style={[styles.corner, styles.cornerTR]} />
						<View style={[styles.corner, styles.cornerBL]} />
						<View style={[styles.corner, styles.cornerBR]} />
					</View>
					<Text style={styles.hint}>{scanned ? "✨ Card detected" : "Point your camera at a card"}</Text>
				</View>
			</SafeAreaView>
		</View>
	);
}

const styles = StyleSheet.create({
	container: { flex: 1, backgroundColor: "#000" },
	overlay: { flex: 1, justifyContent: "space-between" },
	closeButton: {
		position: "absolute",
		top: 60,
		right: 20,
		width: 44,
		height: 44,
		borderRadius: 22,
		backgroundColor: "rgba(0,0,0,0.5)",
		justifyContent: "center",
		alignItems: "center",
		zIndex: 10,
	},
	scanFrameWrapper: {
		flex: 1,
		justifyContent: "center",
		alignItems: "center",
	},
	scanFrame: {
		width: 260,
		height: 260,
		position: "relative",
	},
	corner: {
		position: "absolute",
		width: 40,
		height: 40,
		borderColor: Colors.secundaire,
		borderWidth: 4,
	},
	cornerTL: {
		top: 0,
		left: 0,
		borderRightWidth: 0,
		borderBottomWidth: 0,
		borderTopLeftRadius: 12,
	},
	cornerTR: {
		top: 0,
		right: 0,
		borderLeftWidth: 0,
		borderBottomWidth: 0,
		borderTopRightRadius: 12,
	},
	cornerBL: {
		bottom: 0,
		left: 0,
		borderRightWidth: 0,
		borderTopWidth: 0,
		borderBottomLeftRadius: 12,
	},
	cornerBR: {
		bottom: 0,
		right: 0,
		borderLeftWidth: 0,
		borderTopWidth: 0,
		borderBottomRightRadius: 12,
	},
	hint: {
		fontFamily: Fonts.bodyBold,
		fontSize: FontSizes.body,
		color: Colors.white,
		marginTop: Spacing.lg,
		backgroundColor: "rgba(0,0,0,0.6)",
		paddingHorizontal: Spacing.base,
		paddingVertical: 8,
		borderRadius: 20,
	},
	// Permission screen
	center: {
		flex: 1,
		justifyContent: "center",
		alignItems: "center",
		paddingHorizontal: Spacing.xl,
	},
	title: {
		fontFamily: Fonts.display,
		fontSize: FontSizes.h1,
		fontStyle: "italic",
		color: Colors.white,
		marginTop: Spacing.lg,
		textAlign: "center",
	},
	subtitle: {
		fontFamily: Fonts.body,
		fontSize: FontSizes.body,
		color: Colors.violetLight,
		textAlign: "center",
		marginTop: Spacing.base,
		marginBottom: Spacing.xl,
		lineHeight: 22,
	},
	button: {
		backgroundColor: Colors.secundaire,
		paddingHorizontal: Spacing.xl,
		paddingVertical: Spacing.base,
		borderRadius: 30,
	},
	buttonText: {
		fontFamily: Fonts.bodyBold,
		fontSize: FontSizes.body,
		color: Colors.white,
		fontWeight: "700",
	},
});
