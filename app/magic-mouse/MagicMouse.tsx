'use client';

import { useEffect, useRef } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { Sphere } from '@react-three/drei';
import * as THREE from 'three';
import { GlowingSphere } from './followers/GlowingSphere';
import { ParticleTrail } from './followers/ParticleTrail';
import { ParticleSwarm } from './followers/particle-swarm/ParticleSwarm';
import { useControls } from 'leva';

export default function MagicMouse() {
  const sphereRef = useRef<THREE.Mesh>(null);
  const mousePos = useRef({ x: 0, y: 0 });
  
  const swarmControls = useControls("Swarm", {
    radius: { value: 0.025, min: 0.01, max: 0.1, step: 0.005 },
    count: { value: 124, min: 10, max: 500, step: 1 },
  });

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      mousePos.current.x = e.clientX;
      mousePos.current.y = e.clientY;
    };

    window.addEventListener('mousemove', handleMouseMove);
    return () => window.removeEventListener('mousemove', handleMouseMove);
  }, []);

  useFrame(({ camera, viewport }) => {
    if (!sphereRef.current) return;

    const x = (mousePos.current.x / window.innerWidth) * 2 - 1;
    const y = -(mousePos.current.y / window.innerHeight) * 2 + 1;

    const targetX = x * (viewport.width / 2);
    const targetY = y * (viewport.height / 2);

    sphereRef.current.position.x += (targetX - sphereRef.current.position.x) * 0.1;
    sphereRef.current.position.y += (targetY - sphereRef.current.position.y) * 0.1;
  });

  return (
    <group
     ref={sphereRef}
        position-z={1}
     castShadow
     receiveShadow 
    >
        <GlowingSphere color="#f2f3f3" intensity={1.5} sphereSize={0.025} />
        <ParticleSwarm radius={swarmControls.radius} count={swarmControls.count} />
    </group>
  );
}

 
