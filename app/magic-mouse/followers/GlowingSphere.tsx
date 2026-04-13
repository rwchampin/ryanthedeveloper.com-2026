'use client';

import { useRef, useEffect } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';

interface GlowingSphereProps {
  position?: [number, number, number];
  intensity?: number;
  color?: string;
  sphereSize?: number;
}

export function GlowingSphere({
  position = [0, 0, 0],
  intensity = 2,
  color = '#00ff88',
  sphereSize = 0.5,
}: GlowingSphereProps) {
  const sphereRef = useRef<THREE.Mesh>(null);
  const lightRef = useRef<THREE.PointLight>(null);

  useFrame(() => {
    if (sphereRef.current) {
      sphereRef.current.rotation.x += 0.002;
      sphereRef.current.rotation.y += 0.003;
    }
  });

  return (
    <group position={position}>
      {/* Point light that illuminates other objects */}
      <pointLight
        ref={lightRef}
        intensity={intensity}
        distance={50}
        decay={2}
        color={color}
      />

      {/* Glowing sphere mesh */}
      <mesh ref={sphereRef}>
        <sphereGeometry args={[sphereSize, 64, 64]} />
        <meshStandardMaterial
          color={color}
          emissive={color}
          emissiveIntensity={2}
          toneMapped={false}
          wireframe={false}
        />
      </mesh>

      {/* Outer glow effect */}
      <mesh scale={[1.3, 1.3, 1.3]}>
        <sphereGeometry args={[sphereSize, 32, 32]} />
        <meshBasicMaterial
          color={color}
          transparent
          opacity={0.2}
          toneMapped={false}
        />
      </mesh>
    </group>
  );
}
