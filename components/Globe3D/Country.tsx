import { latLngToVector3 } from "@/lib/geo";
import earcut from "earcut";
import React, { useMemo } from "react";
import * as THREE from "three";

type Props = {
	polygons: number[][][][];
	radius: number;
	color: string;
};

export function Country({ polygons, radius, color }: Props) {
	const geometry = useMemo(() => {
		const geom = new THREE.BufferGeometry();
		const allVertices: number[] = [];
		const allIndices: number[] = [];
		let vertexOffset = 0;

		polygons.forEach((polygon) => {
			const ring = polygon[0];
			if (!ring || ring.length < 3) return;

			// Flatten the 2D polygon coords for earcut [x1, y1, x2, y2, ...]
			const flat2D: number[] = [];
			ring.forEach((point) => {
				const lng = point[0];
				const lat = point[1];
				if (typeof lng === "number" && typeof lat === "number") {
					flat2D.push(lng, lat);
				}
			});

			if (flat2D.length < 6) return; // need at least 3 points

			// Earcut returns triangle indices for 2D polygon
			const triangles = earcut(flat2D);

			// Convert each 2D point to 3D on the sphere
			const points3D: THREE.Vector3[] = [];
			for (let i = 0; i < flat2D.length; i += 2) {
				const lng = flat2D[i];
				const lat = flat2D[i + 1];
				points3D.push(latLngToVector3(lat, lng, radius * 1.005));
			}

			// Push 3D vertices to global vertex array
			points3D.forEach((p) => {
				allVertices.push(p.x, p.y, p.z);
			});

			// Push triangle indices (offset by current vertex count)
			triangles.forEach((idx) => {
				allIndices.push(idx + vertexOffset);
			});

			vertexOffset += points3D.length;
		});

		if (allVertices.length === 0) return null;

		geom.setAttribute("position", new THREE.Float32BufferAttribute(allVertices, 3));
		geom.setIndex(allIndices);
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
