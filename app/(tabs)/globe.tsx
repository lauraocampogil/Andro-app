import countriesData from "@/assets/data/countries.json";
import { Country } from "@/components/Globe3D/Country";
import { Canvas, useFrame } from "@react-three/fiber/native";
import React, { Suspense, useRef } from "react";
import { StyleSheet, View } from "react-native";
import * as THREE from "three";

const GLOBE_RADIUS = 0.4;

// Colors Andro
const COLOR_DEFAULT = "#3D3D5C"; 
const COLOR_COMPLETED = "#5B58EB";
const COLOR_OCEAN = "#0A1340";


const COMPLETED_COUNTRIES = ["BEL", "DEU"]; // Belgium + Germany for test

function Globe() {
	const groupRef = useRef<THREE.Group>(null);

	useFrame((_, delta) => {
		if (groupRef.current) {
			groupRef.current.rotation.y += delta * 0.1;
		}
	});

	console.log("🌍 Globe rendering");
	console.log("📊 features count:", countriesData?.features?.length);
	console.log("🇧🇪 first country:", countriesData?.features?.[0]?.properties?.NAME);

	return (
		<group ref={groupRef}>
			{/* Oceans (below) */}
			<mesh>
				<sphereGeometry args={[GLOBE_RADIUS, 64, 64]} />
				<meshStandardMaterial color={COLOR_OCEAN} roughness={0.5} metalness={0.2} emissive={COLOR_OCEAN} emissiveIntensity={0.2} />
			</mesh>

			{/* All countries */}
			{countriesData.features.map((feature: any, idx: number) => {
				const code = feature.properties.ISO_A3;
				const isCompleted = COMPLETED_COUNTRIES.includes(code);
				const color = isCompleted ? COLOR_COMPLETED : COLOR_DEFAULT;

				// Normalize to MultiPolygon structure: array of polygons, each polygon = array of rings
				const polygons: number[][][][] = feature.geometry.type === "MultiPolygon" ? feature.geometry.coordinates : [feature.geometry.coordinates];

				return <Country key={`${code}-${idx}`} polygons={polygons} radius={GLOBE_RADIUS} color={color} />;
			})}
		</group>
	);
}

export default function Globe3D() {
	return (
		<View style={styles.container}>
			<Canvas camera={{ position: [0, 0, 2.5], fov: 45 }}>
				<ambientLight intensity={0.4} />
				<directionalLight position={[5, 3, 5]} intensity={1.2} color="#FFFFFF" />
				<pointLight position={[-3, 2, -3]} intensity={0.6} color="#8A87FF" />
				<pointLight position={[0, -3, 2]} intensity={0.4} color="#5B58EB" />
				<Suspense fallback={null}>
					<Globe />
				</Suspense>
			</Canvas>
		</View>
	);
}

const styles = StyleSheet.create({
	container: { flex: 1, backgroundColor: "#04081A" },
});
