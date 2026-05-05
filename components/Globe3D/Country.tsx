import { latLngToVector3 } from "@/lib/geo";
import React, { useMemo } from "react";
import * as THREE from "three";

type Props = {
	polygons: number[][][][]; // array of polygons, each polygon = array of rings, each ring = array of [lng, lat]
	radius: number;
	color: string;
};

export function Country({ polygons, radius, color }: Props) {
	const geometry = useMemo(() => {
		const geom = new THREE.BufferGeometry();
		const vertices: number[] = [];
		const indices: number[] = [];
		let vertexOffset = 0;

		polygons.forEach((polygon) => {
			// Take only the outer ring (polygon[0]); ignore holes for now
			const ring = polygon[0];
			if (!ring || ring.length < 3) return;

			// Convert each [lng, lat] to a 3D point on the sphere surface
			const points3D: THREE.Vector3[] = [];
			for (let i = 0; i < ring.length; i++) {
				const lng = ring[i][0];
				const lat = ring[i][1];
				if (typeof lng !== "number" || typeof lat !== "number") continue;
				points3D.push(latLngToVector3(lat, lng, radius * 1.005));
			}

			if (points3D.length < 3) return;

			// Compute centroid and project it back onto the sphere
			const center = new THREE.Vector3();
			points3D.forEach((p) => center.add(p));
			center.divideScalar(points3D.length);
			center.normalize().multiplyScalar(radius * 1.005);

			// Push centroid as the first vertex
			vertices.push(center.x, center.y, center.z);
			const centerIdx = vertexOffset;
			vertexOffset++;

			// Push all ring points
			points3D.forEach((p) => {
				vertices.push(p.x, p.y, p.z);
				vertexOffset++;
			});

			// Build triangle fan from centroid
			for (let i = 0; i < points3D.length; i++) {
				const next = (i + 1) % points3D.length;
				indices.push(centerIdx, centerIdx + 1 + i, centerIdx + 1 + next);
			}
		});

		if (vertices.length === 0) return null;

		geom.setAttribute("position", new THREE.Float32BufferAttribute(vertices, 3));
		geom.setIndex(indices);
		geom.computeVertexNormals();
		return geom;
	}, [polygons, radius]);

	if (!geometry) return null;

	return (
		<mesh geometry={geometry}>
			<meshStandardMaterial color={color} side={THREE.DoubleSide} roughness={0.7} metalness={0.1} emissive={color} emissiveIntensity={0.05} />
		</mesh>
	);
}
