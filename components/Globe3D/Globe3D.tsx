import countriesData from "@/assets/data/countries.json";
import { Country } from "@/components/Globe3D/Country";
import { latLngToVector3 } from "@/lib/geo";
import { Canvas, useFrame, useThree } from "@react-three/fiber/native";
import React, { Suspense, useRef } from "react";
import { PanResponder, StyleSheet, View, ViewStyle } from "react-native";
import * as THREE from "three";

const COLOR_DEFAULT = "#38383f";
const COLOR_COMPLETED = "#79a1ff";
const COLOR_OCEAN = "#484a56";
const COLOR_PIN = "#FF5757";

const MIN_ZOOM = 1.5;
const MAX_ZOOM = 7;

type LatLng = { lat: number; lng: number };

type Props = {
	completedCountries?: string[];
	rotationSpeed?: number;
	interactive?: boolean;
	zoomable?: boolean;
	cameraDistance?: number;
	globeRadius?: number;
	userLocation?: LatLng | null;
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
	userLocation?: LatLng | null;
};

// Convert latitude/longitude to a 3D point on the sphere surface
function latLngToVector(lat: number, lng: number, radius: number): [number, number, number] {
	const phi = (90 - lat) * (Math.PI / 180);
	const theta = (lng + 180) * (Math.PI / 180);
	const x = -(radius * Math.sin(phi) * Math.cos(theta));
	const z = radius * Math.sin(phi) * Math.sin(theta);
	const y = radius * Math.cos(phi);
	return [x, y, z];
}

function Globe({ completedCountries, rotationSpeed, manualRotation, zoomRef, interactive, zoomable, globeRadius, userLocation }: GlobeInnerProps) {
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
	const pinVec = userLocation ? latLngToVector3(userLocation.lat, userLocation.lng, globeRadius * 1.01) : null;
	const pinPos: [number, number, number] | null = pinVec ? [pinVec.x, pinVec.y, pinVec.z] : null;

	return (
		<group ref={groupRef}>
			<mesh>
				<sphereGeometry args={[globeRadius, 64, 64]} />
				<meshStandardMaterial color={COLOR_OCEAN} roughness={0.5} metalness={0.2} emissive={COLOR_OCEAN} emissiveIntensity={0.2} />
			</mesh>

			{countriesData.features.map((feature: any, idx: number) => {
				const code = feature.properties.ISO_A3 !== "-99" ? feature.properties.ISO_A3 : feature.properties.ADM0_A3;
				const isCompleted = completedCountries.includes(code);
				const color = isCompleted ? COLOR_COMPLETED : COLOR_DEFAULT;
				const polygons: number[][][][] = feature.geometry.type === "MultiPolygon" ? feature.geometry.coordinates : [feature.geometry.coordinates];
				return <Country key={`${code}-${idx}-${color}`} polygons={polygons} radius={globeRadius} color={color} countryCode={code} />;
			})}

			{/* User location pin */}
			{pinPos && (
				<group position={pinPos}>
					<mesh>
						<sphereGeometry args={[globeRadius * 0.035, 16, 16]} />
						<meshStandardMaterial color={COLOR_PIN} emissive={COLOR_PIN} emissiveIntensity={0.6} />
					</mesh>
				</group>
			)}
		</group>
	);
}

export function Globe3D({ completedCountries = [], rotationSpeed = 0.1, interactive = false, zoomable = false, cameraDistance = 2.5, globeRadius = 0.8, userLocation = null, style }: Props) {
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
					<Globe completedCountries={completedCountries} rotationSpeed={rotationSpeed} manualRotation={manualRotation} zoomRef={zoomRef} interactive={interactive} zoomable={zoomable} globeRadius={globeRadius} userLocation={userLocation} />
				</Suspense>
			</Canvas>
		</View>
	);
}

const styles = StyleSheet.create({
	container: { flex: 1, backgroundColor: "transparent" },
});
