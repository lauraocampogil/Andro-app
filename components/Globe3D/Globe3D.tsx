import countriesData from "@/assets/data/countries.json";
import { Country } from "@/components/Globe3D/Country";
import { Canvas, useFrame } from "@react-three/fiber/native";
import React, { Suspense, useRef } from "react";
import { PanResponder, StyleSheet, View, ViewStyle } from "react-native";
import * as THREE from "three";

const GLOBE_RADIUS = 0.8;
const COLOR_DEFAULT = "#3D3D5C";
const COLOR_COMPLETED = "#5B58EB";
const COLOR_OCEAN = "#262a3d";

type Props = {
	completedCountries?: string[];
	rotationSpeed?: number;
	interactive?: boolean;
	cameraDistance?: number;
	style?: ViewStyle;
};

type GlobeInnerProps = {
	completedCountries: string[];
	rotationSpeed: number;
	manualRotation: { current: { x: number; y: number } };
	interactive: boolean;
};

function Globe({ completedCountries, rotationSpeed, manualRotation, interactive }: GlobeInnerProps) {
	const groupRef = useRef<THREE.Group>(null);

	useFrame((_, delta) => {
		if (!groupRef.current) return;

		if (interactive) {
			// Apply manual rotation from finger drag
			groupRef.current.rotation.y = manualRotation.current.y;
			groupRef.current.rotation.x = manualRotation.current.x;
		} else {
			// Auto-rotate
			groupRef.current.rotation.y += delta * rotationSpeed;
		}
	});

	return (
		<group ref={groupRef}>
			{/* Ocean sphere */}
			<mesh>
				<sphereGeometry args={[GLOBE_RADIUS, 64, 64]} />
				<meshStandardMaterial color={COLOR_OCEAN} roughness={0.5} metalness={0.2} emissive={COLOR_OCEAN} emissiveIntensity={0.2} />
			</mesh>

			{/* All countries */}
			{countriesData.features.map((feature: any, idx: number) => {
				const code = feature.properties.ISO_A3;
				const isCompleted = completedCountries.includes(code);
				const color = isCompleted ? COLOR_COMPLETED : COLOR_DEFAULT;

				const polygons: number[][][][] = feature.geometry.type === "MultiPolygon" ? feature.geometry.coordinates : [feature.geometry.coordinates];

				return <Country key={`${code}-${idx}`} polygons={polygons} radius={GLOBE_RADIUS} color={color} />;
			})}
		</group>
	);
}

export function Globe3D({ completedCountries = [], rotationSpeed = 0.1, interactive = false, cameraDistance = 2.5, style }: Props) {
	// Manual rotation state (updated by gestures)
	const manualRotation = useRef({ x: 0, y: 0 });
	const lastPan = useRef({ x: 0, y: 0 });

	// PanResponder for finger-drag rotation
	const panResponder = useRef(
		PanResponder.create({
			onStartShouldSetPanResponder: () => interactive,
			onMoveShouldSetPanResponder: () => interactive,
			onPanResponderGrant: () => {
				lastPan.current = { x: 0, y: 0 };
			},
			onPanResponderMove: (_, gesture) => {
				const dx = gesture.dx - lastPan.current.x;
				const dy = gesture.dy - lastPan.current.y;

				// Convert pixel movement to rotation (sensitivity factor 0.005)
				manualRotation.current.y += dx * 0.005;
				manualRotation.current.x += dy * 0.005;

				// Clamp X rotation to avoid flipping upside down
				manualRotation.current.x = Math.max(-Math.PI / 2, Math.min(Math.PI / 2, manualRotation.current.x));

				lastPan.current = { x: gesture.dx, y: gesture.dy };
			},
		}),
	).current;

	return (
		<View style={[styles.container, style]} {...(interactive ? panResponder.panHandlers : {})}>
			<Canvas camera={{ position: [0, 0, cameraDistance], fov: 45 }}>
				<ambientLight intensity={0.4} />
				<directionalLight position={[5, 3, 5]} intensity={1.2} color="#FFFFFF" />
				<pointLight position={[-3, 2, -3]} intensity={0.6} color="#8A87FF" />
				<pointLight position={[0, -3, 2]} intensity={0.4} color="#5B58EB" />
				<Suspense fallback={null}>
					<Globe completedCountries={completedCountries} rotationSpeed={rotationSpeed} manualRotation={manualRotation} interactive={interactive} />
				</Suspense>
			</Canvas>
		</View>
	);
}

const styles = StyleSheet.create({
	container: { flex: 1, backgroundColor: "transparent" },
});
