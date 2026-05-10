import countriesData from "@/assets/data/countries.json";
import { Country } from "@/components/Globe3D/Country";
import { Canvas, useFrame, useThree } from "@react-three/fiber/native";
import React, { Suspense, useRef } from "react";
import { PanResponder, StyleSheet, View, ViewStyle } from "react-native";
import * as THREE from "three";

const COLOR_DEFAULT = "#45455b";
const COLOR_COMPLETED = "#79a1ff";
const COLOR_OCEAN = "#2e3141";

const MIN_ZOOM = 1.5;
const MAX_ZOOM = 7;

type Props = {
	completedCountries?: string[];
	rotationSpeed?: number;
	interactive?: boolean;
	zoomable?: boolean;
	cameraDistance?: number;
	globeRadius?: number;
	style?: ViewStyle;
};

type GlobeInnerProps = {
	completedCountries: string[];
	rotationSpeed: number;
	manualRotation: { current: { x: number; y: number } };
	zoomRef: { current: number };
	interactive: boolean;
	zoomable: boolean;
	globeRadius: number;
};

function Globe({ completedCountries, rotationSpeed, manualRotation, zoomRef, interactive, zoomable, globeRadius }: GlobeInnerProps) {
	// DEBUG LOG: see what completedCountries arrives
	console.log("🌍 Globe inner rendering with:", completedCountries);

	// DEBUG: log all country features that contain "France" to find the right code
	countriesData.features.forEach((f: any) => {
		const props = f.properties;
		if (props.NAME?.includes("France") || props.NAME_EN?.includes("France") || props.NAME_LONG?.includes("France")) {
			console.log("🇫🇷 Found France in geojson:", {
				ISO_A3: props.ISO_A3,
				ISO_A2: props.ISO_A2,
				ADM0_A3: props.ADM0_A3,
				NAME: props.NAME,
				NAME_LONG: props.NAME_LONG,
			});
		}
	});

	const groupRef = useRef<THREE.Group>(null);
	const { camera } = useThree();

	useFrame((_, delta) => {
		if (!groupRef.current) return;

		if (zoomable) {
			camera.position.z = zoomRef.current;
			camera.updateProjectionMatrix();
		}

		if (interactive) {
			groupRef.current.rotation.y = manualRotation.current.y;
			groupRef.current.rotation.x = manualRotation.current.x;
		} else {
			groupRef.current.rotation.y += delta * rotationSpeed;
		}
	});

	return (
		<group ref={groupRef}>
			<mesh>
				<sphereGeometry args={[globeRadius, 64, 64]} />
				<meshStandardMaterial color={COLOR_OCEAN} roughness={0.5} metalness={0.2} emissive={COLOR_OCEAN} emissiveIntensity={0.2} />
			</mesh>

			{countriesData.features.map((feature: any, idx: number) => {
				// FIX: fallback to ADM0_A3 when ISO_A3 is missing (-99) — Natural Earth quirk for France, Norway, etc.
				const code = feature.properties.ISO_A3 !== "-99" ? feature.properties.ISO_A3 : feature.properties.ADM0_A3;

				const isCompleted = completedCountries.includes(code);
				const color = isCompleted ? COLOR_COMPLETED : COLOR_DEFAULT;

				// DEBUG LOG: log specific countries (France, Belgium, Norway)
				if (code === "FRA" || code === "BEL" || code === "NOR") {
					console.log(`🌍 Country ${code} (${feature.properties.NAME}): isCompleted=${isCompleted}, color=${color}`);
				}

				const polygons: number[][][][] = feature.geometry.type === "MultiPolygon" ? feature.geometry.coordinates : [feature.geometry.coordinates];

				return <Country key={`${code}-${idx}-${color}`} polygons={polygons} radius={globeRadius} color={color} />;
			})}
		</group>
	);
}

export function Globe3D({ completedCountries = [], rotationSpeed = 0.1, interactive = false, zoomable = false, cameraDistance = 2.5, globeRadius = 0.8, style }: Props) {
	console.log("🌐 Globe3D outer received:", completedCountries);

	const zoomRef = useRef(cameraDistance);
	const manualRotation = useRef({ x: 0, y: 0 });
	const lastPan = useRef({ x: 0, y: 0 });
	const initialPinchDistance = useRef<number | null>(null);
	const initialZoom = useRef(cameraDistance);

	const panResponder = useRef(
		PanResponder.create({
			onStartShouldSetPanResponder: () => interactive || zoomable,
			onMoveShouldSetPanResponder: () => interactive || zoomable,
			onPanResponderGrant: () => {
				lastPan.current = { x: 0, y: 0 };
				initialPinchDistance.current = null;
				initialZoom.current = zoomRef.current;
			},
			onPanResponderMove: (evt, gesture) => {
				const touches = evt.nativeEvent.touches;

				if (touches.length === 2 && zoomable) {
					const dx = touches[0].pageX - touches[1].pageX;
					const dy = touches[0].pageY - touches[1].pageY;
					const distance = Math.sqrt(dx * dx + dy * dy);

					if (initialPinchDistance.current === null) {
						initialPinchDistance.current = distance;
						initialZoom.current = zoomRef.current;
						return;
					}

					const scale = initialPinchDistance.current / distance;
					const newZoom = Math.max(MIN_ZOOM, Math.min(MAX_ZOOM, initialZoom.current * scale));
					zoomRef.current = newZoom;
				} else if (touches.length === 1 && interactive) {
					initialPinchDistance.current = null;

					const dx = gesture.dx - lastPan.current.x;
					const dy = gesture.dy - lastPan.current.y;

					manualRotation.current.y += dx * 0.005;
					manualRotation.current.x += dy * 0.005;

					manualRotation.current.x = Math.max(-Math.PI / 2, Math.min(Math.PI / 2, manualRotation.current.x));

					lastPan.current = { x: gesture.dx, y: gesture.dy };
				}
			},
			onPanResponderRelease: () => {
				initialPinchDistance.current = null;
			},
		}),
	).current;

	return (
		<View style={[styles.container, style]} {...(interactive || zoomable ? panResponder.panHandlers : {})}>
			<Canvas camera={{ position: [0, 0, cameraDistance], fov: 45 }}>
				<ambientLight intensity={0.4} />
				<directionalLight position={[5, 3, 5]} intensity={1.2} color="#FFFFFF" />
				<pointLight position={[-3, 2, -3]} intensity={0.6} color="#8A87FF" />
				<pointLight position={[0, -3, 2]} intensity={0.4} color="#5B58EB" />
				<Suspense fallback={null}>
					<Globe completedCountries={completedCountries} rotationSpeed={rotationSpeed} manualRotation={manualRotation} zoomRef={zoomRef} interactive={interactive} zoomable={zoomable} globeRadius={globeRadius} />
				</Suspense>
			</Canvas>
		</View>
	);
}

const styles = StyleSheet.create({
	container: { flex: 1, backgroundColor: "transparent" },
});
