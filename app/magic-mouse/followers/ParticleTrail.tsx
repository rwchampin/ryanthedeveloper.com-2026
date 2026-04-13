"use client";

import { useFrame } from "@react-three/fiber";
import * as THREE from "three";
import { useRef, useMemo } from "react";

type TrailPoint = {
    position: THREE.Vector3;
};

type Props = {
    count?: number;
    color?: string;
    size?: number;
    followSpeed?: number; // how fast each point follows the one ahead
};

export const ParticleTrail = ({
    count = 32,
    color = "#00ff88",
    size = 0.05,
    followSpeed = 0.2,
}: Props) => {
    const pointsRef = useRef<THREE.Points>(null);

    // initialize trail
    const trail = useRef<TrailPoint[]>(
        new Array(count).fill(0).map(() => ({
            position: new THREE.Vector3(),
        }))
    );

    // preallocate buffer
    const positions = useMemo(() => new Float32Array(count * 3), [count]);

    useFrame(({ mouse, viewport }) => {
        if (!pointsRef.current) return;

        // convert mouse to world space (simple plane projection)
        const target = new THREE.Vector3(
            (mouse.x * viewport.width) / 2,
            (mouse.y * viewport.height) / 2,
            0
        );

        // first point follows mouse directly (with slight smoothing)
        trail.current[0].position.lerp(target, 0.4);

        // rest follow previous point (this creates the trail)
        for (let i = 1; i < trail.current.length; i++) {
            const prev = trail.current[i - 1].position;
            const curr = trail.current[i].position;

            curr.lerp(prev, followSpeed);
        }

        // write to buffer
        for (let i = 0; i < trail.current.length; i++) {
            const p = trail.current[i].position;
            positions[i * 3 + 0] = p.x;
            positions[i * 3 + 1] = p.y;
            positions[i * 3 + 2] = p.z;
        }

        const geometry = pointsRef.current.geometry as THREE.BufferGeometry;
        geometry.setAttribute("position", new THREE.BufferAttribute(positions, 3));
        geometry.attributes.position.needsUpdate = true;
    });

    return (
        <points ref={pointsRef}>
            <bufferGeometry />
            <pointsMaterial size={size} color={color} />
        </points>
    );
};