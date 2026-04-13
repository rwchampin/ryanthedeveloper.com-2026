import * as THREE from 'three';
/**
 * Generates random positions on the surface of a sphere
 * @param radius number - radius of the sphere
 * @param count number - number of points
 * @returns Float32Array (x, y, z positions)
 */
export const useSphereSurfacePositions = (radius: number, count: number) => {
    const positions = new Float32Array(count * 3);

    for (let i = 0; i < count; i++) {
        // Random spherical coordinates
        const u = Math.random(); // [0,1]
        const v = Math.random(); // [0,1]

        const theta = 2 * Math.PI * u;          // azimuthal angle
        const phi = Math.acos(2 * v - 1);       // polar angle (uniform distribution)

        const x = radius * Math.sin(phi) * Math.cos(theta);
        const y = radius * Math.sin(phi) * Math.sin(theta);
        const z = radius * Math.cos(phi);

        const i3 = i * 3;
        positions[i3 + 0] = x;
        positions[i3 + 1] = y;
        positions[i3 + 2] = z;
    }

    return positions;
}