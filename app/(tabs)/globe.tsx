import { Canvas, useFrame } from "@react-three/fiber/native";
import React, { Suspense, useRef } from "react";
import { StyleSheet, View } from "react-native";
import * as THREE from "three";

function Globe() {
	const meshRef = useRef<THREE.Mesh>(null);

	// Rotation auto : tourne lentement sur l'axe Y
	useFrame((_, delta) => {
		if (meshRef.current) {
			meshRef.current.rotation.y += delta * 0.15; // vitesse de rotation
		}
	});

	return (
		<mesh ref={meshRef}>
			<sphereGeometry args={[0.75, 64, 64]} />
			<meshStandardMaterial color="#1A2B6B" roughness={0.6} metalness={0.3} emissive="#5B58EB" emissiveIntensity={0.1} />
		</mesh>
	);
}

export default function Test3D() {
	return (
		<View style={styles.container}>
			<Canvas camera={{ position: [0, 0, 2.5], fov: 45 }}>
				{/* Lumière ambiante douce */}
				<ambientLight intensity={0.3} />

				{/* Lumière principale (comme un soleil) */}
				<directionalLight position={[5, 3, 5]} intensity={1.2} color="#FFFFFF" />

				{/* Lumière violette d'accent (style Andro) */}
				<pointLight position={[-3, 2, -3]} intensity={0.8} color="#8A87FF" />

				{/* Lumière froide en dessous */}
				<pointLight position={[0, -3, 2]} intensity={0.5} color="#5B58EB" />

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
