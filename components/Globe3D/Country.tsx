import { latLngToVector3 } from "@/lib/geo";
import earcut from "earcut";
import React, { useMemo } from "react";
import * as THREE from "three";

type Props = {
	polygons: number[][][][];
	radius: number;
	color: string;
};

const MAX_SEGMENT_DEG = 2;

function subdivideRing(ring: number[][]): number[][] {
	const result: number[][] = [];

	for (let i = 0; i < ring.length; i++) {
		const a = ring[i];
		const b = ring[(i + 1) % ring.length];
		if (!a || !b) continue;
		if (typeof a[0] !== "number" || typeof a[1] !== "number") continue;
		if (typeof b[0] !== "number" || typeof b[1] !== "number") continue;

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

function subdivideTrianglesOnSphere(triangles: number[], points2D: number[], radius: number): { vertices: THREE.Vector3[]; indices: number[] } {
	const verts: THREE.Vector3[] = [];
	const idx: number[] = [];

	for (let i = 0; i < points2D.length; i += 2) {
		verts.push(latLngToVector3(points2D[i + 1], points2D[i], radius * 1.005));
	}

	const MAX_EDGE_3D = radius * 0.05;

	for (let i = 0; i < triangles.length; i += 3) {
		const a = triangles[i];
		const b = triangles[i + 1];
		const c = triangles[i + 2];
		subdivideTri(verts, idx, a, b, c, MAX_EDGE_3D, radius * 1.005);
	}

	return { vertices: verts, indices: idx };
}

function subdivideTri(verts: THREE.Vector3[], idx: number[], ai: number, bi: number, ci: number, maxEdge: number, sphereRadius: number, depth: number = 0) {
	if (depth > 4) {
		idx.push(ai, bi, ci);
		return;
	}

	const a = verts[ai];
	const b = verts[bi];
	const c = verts[ci];

	const ab = a.distanceTo(b);
	const bc = b.distanceTo(c);
	const ca = c.distanceTo(a);
	const maxLen = Math.max(ab, bc, ca);

	if (maxLen <= maxEdge) {
		idx.push(ai, bi, ci);
		return;
	}

	if (ab >= bc && ab >= ca) {
		const mid = a.clone().add(b).multiplyScalar(0.5).normalize().multiplyScalar(sphereRadius);
		const mi = verts.length;
		verts.push(mid);
		subdivideTri(verts, idx, ai, mi, ci, maxEdge, sphereRadius, depth + 1);
		subdivideTri(verts, idx, mi, bi, ci, maxEdge, sphereRadius, depth + 1);
	} else if (bc >= ab && bc >= ca) {
		const mid = b.clone().add(c).multiplyScalar(0.5).normalize().multiplyScalar(sphereRadius);
		const mi = verts.length;
		verts.push(mid);
		subdivideTri(verts, idx, ai, bi, mi, maxEdge, sphereRadius, depth + 1);
		subdivideTri(verts, idx, ai, mi, ci, maxEdge, sphereRadius, depth + 1);
	} else {
		const mid = c.clone().add(a).multiplyScalar(0.5).normalize().multiplyScalar(sphereRadius);
		const mi = verts.length;
		verts.push(mid);
		subdivideTri(verts, idx, ai, bi, mi, maxEdge, sphereRadius, depth + 1);
		subdivideTri(verts, idx, mi, bi, ci, maxEdge, sphereRadius, depth + 1);
	}
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

			const ring = subdivideRing(rawRing);

			const flat2D: number[] = [];
			ring.forEach((point) => {
				const lng = point[0];
				const lat = point[1];
				if (typeof lng === "number" && typeof lat === "number") {
					flat2D.push(lng, lat);
				}
			});

			if (flat2D.length < 6) return;

			const triangles = earcut(flat2D);
			if (triangles.length === 0) return;

			const { vertices: verts3D, indices: triIndices } = subdivideTrianglesOnSphere(triangles, flat2D, radius);

			verts3D.forEach((p) => {
				allVertices.push(p.x, p.y, p.z);
			});

			triIndices.forEach((i) => {
				allIndices.push(i + vertexOffset);
			});

			vertexOffset += verts3D.length;
		});

		if (allVertices.length === 0) return null;

		geom.setAttribute("position", new THREE.Float32BufferAttribute(allVertices, 3));
		geom.setIndex(allIndices);
		geom.computeVertexNormals();
		return geom;
	}, [polygons, radius]);

	// Force material recreation when color changes (Three.js + expo-gl caching workaround)
	const material = useMemo(() => {
		return new THREE.MeshStandardMaterial({
			color: new THREE.Color(color),
			side: THREE.DoubleSide,
			roughness: 0.7,
			metalness: 0.1,
			emissive: new THREE.Color(color),
			emissiveIntensity: 0.05,
		});
	}, [color]);

	if (!geometry) return null;

	return <mesh geometry={geometry} material={material} />;
}
