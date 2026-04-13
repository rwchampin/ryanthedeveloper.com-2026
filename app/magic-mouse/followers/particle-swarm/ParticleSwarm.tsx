'use client';
import { useMemo, useRef } from 'react';
import { useSphereSurfacePositions } from './useSphereSurfacePositions';
import * as THREE from 'three';
import { useFrame } from '@react-three/fiber';



type OrbitData = {
    axis: THREE.Vector3;
    radius: number;
    speed: number;
    phase: number;
};

export function createGlobalOrbitData(count: number, baseRadius: number): OrbitData[] {
    const data: OrbitData[] = [];

    for (let i = 0; i < count; i++) {
        data.push({
            axis: new THREE.Vector3(
                Math.random() * 2 - 1,
                Math.random() * 2 - 1,
                Math.random() * 2 - 1
            ).normalize(),

            // spread particles across sphere radius
            radius: baseRadius * (0.8 + Math.random() * 0.4),

            speed: 0.5 + Math.random() * 2,
            phase: Math.random() * Math.PI * 2,
        });
    }

    return data;
}

export function updateGlobalOrbitPositions(
    orbitData: OrbitData[],
    positions: Float32Array,
    time: number
) {
    const base = new THREE.Vector3(1, 0, 0); // starting direction
    const quat = new THREE.Quaternion();

    for (let i = 0; i < orbitData.length; i++) {
        const d = orbitData[i];

        quat.setFromAxisAngle(d.axis, time * d.speed + d.phase);

        const pos = base
            .clone()
            .applyQuaternion(quat)
            .multiplyScalar(d.radius);

        const i3 = i * 3;
        positions[i3 + 0] = pos.x;
        positions[i3 + 1] = pos.y;
        positions[i3 + 2] = pos.z;
    }
}


export const ParticleSwarm = ({
    radius = 0.5,
    count = 124,
}) => {
    const points = useRef<THREE.Points>(null);
    const positions = useSphereSurfacePositions(radius, count);
    const orbitData = useMemo(() => createGlobalOrbitData(count, radius), [count, radius]);

    useFrame(({ clock }) => {
        updateGlobalOrbitPositions(orbitData, positions, clock.getElapsedTime());
        if (points.current){
            points.current.geometry.attributes.position.needsUpdate = true;
        }
    });
    
    return (
        <points ref={points}>
            <bufferGeometry>
                <bufferAttribute
                    args={[positions, 3]}
                    attach="attributes-position"
                    count={positions.length / 3}
                    array={positions}
                    itemSize={3}
                />
            </bufferGeometry>
            <pointsMaterial color="#5786F5" size={0.015} sizeAttenuation />
        </points>
    );
};