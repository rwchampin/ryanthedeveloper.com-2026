import { MeshSurfaceSampler } from 'three-stdlib';
import * as THREE from 'three';

export const useSurfaceSampler = (surfaceMesh: any, count: number) => {
	if (!surfaceMesh) return [];
	const sampledPoints: THREE.Vector3[] = [];
	const sampler = new MeshSurfaceSampler(surfaceMesh)
		.setWeightAttribute('color')
		.build();

	const position = new THREE.Vector3();

	// Sample randomly from the surface, creating an instance of the sample geometry at each sample point.
	for (let i = 0; i < count; i++) {
		sampler.sample(position);
		sampledPoints.push(position.clone());
	}

	return sampledPoints;

}