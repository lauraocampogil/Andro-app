import * as THREE from "three";


// Convert latitude/longitude to a 3D point on a sphere

export function latLngToVector3(lat: number, lng: number, radius: number): THREE.Vector3 {
	const phi = (90 - lat) * (Math.PI / 180);
	const theta = (lng + 180) * (Math.PI / 180);

	return new THREE.Vector3(-(radius * Math.sin(phi) * Math.cos(theta)), radius * Math.cos(phi), radius * Math.sin(phi) * Math.sin(theta));
}

// Convert a GeoJSON polygon coordinate array into 3D points on a sphere

export function polygonToVector3Array(coordinates: number[][], radius: number): THREE.Vector3[] {
	return coordinates.map(([lng, lat]) => latLngToVector3(lat, lng, radius));
}
