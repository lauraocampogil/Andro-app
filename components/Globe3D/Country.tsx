import { latLngToVector3 } from "@/lib/geo";
import earcut from "earcut";
import React, { useMemo } from "react";
import * as THREE from "three";

type Props = {
	polygons: number[][][][];
	radius: number;
	color: string;
};

// Maximum angular distance between two adjacent points before we subdivide
const MAX_SEGMENT_DEG = 3; // degrees

function subdivideRing(ring: number[][]): number[][] {
	const result: number[][] = [];

	for (let i = 0; i < ring.length; i++) {
		const a = ring[i];
		const b = ring[(i + 1) % ring.length];
		if (!a || !b) continue;

		result.push(a);

		const lngDiff = Math.abs(b[0] - a[0]);
		const latDiff = Math.abs(b[1] - a[1]);
		const maxDiff = Math.max(lngDiff, latDiff);

		if (maxDiff > MAX_SEGMENT_DEG) {
			const steps = Math.ceil(maxDiff / MAX_SEGMENT_DEG);
			for (let s = 1; s < steps; s++) {
				const t = s / steps;
				result.push([a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t]);
			}
		}
	}

	return result;
}

export function Country({ polygons, radius, color }: Props) {
	const geometry = useMemo(() => {
		const geom = new THREE.BufferGeometry();
		const allVertices: number[] = [];
		const allIndices: number[] = [];
		let vertexOffset = 0;

		polygons.forEach((polygon) => {
			const rawRing = polygon[0];
			if (!rawRing || rawRing.length < 3) return;

			// Subdivide long edges so they curve nicely on the sphere
			const ring = subdivideRing(rawRing);

			// Flatten to [x1, y1, x2, y2, ...] for earcut
			const flat2D: number[] = [];
			ring.forEach((point) => {
				const lng = point[0];
				const lat = point[1];
				if (typeof lng === "number" && typeof lat === "number") {
					flat2D.push(lng, lat);
				}
			});

			if (flat2D.length < 6) return;

			// Triangulate the 2D polygon
			const triangles = earcut(flat2D);
			if (triangles.length === 0) return;

			// Project each 2D point onto the sphere
			const points3D: THREE.Vector3[] = [];
			for (let i = 0; i < flat2D.length; i += 2) {
				const lng = flat2D[i];
				const lat = flat2D[i + 1];
				points3D.push(latLngToVector3(lat, lng, radius * 1.005));
			}

			points3D.forEach((p) => {
				allVertices.push(p.x, p.y, p.z);
			});

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
