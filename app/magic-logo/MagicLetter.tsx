
import { useMemo, useRef } from 'react';
import { useSurfaceSampler } from '../hooks/useSurfaceSampler';
import * as THREE from 'three';
import { gsap } from 'gsap';

export const MagicLetter = ({ letter, count = 2 }: { letter: any, count: number }) => {
    const ref = useRef<any>(letter);
    // sample the mesh to get the vertices and use them to create a point cloud

        const sampledPoints = useMemo(() => useSurfaceSampler(ref.current, count*count), [ref.current, count]);
        if (!sampledPoints) return null;
        const positions = new Float32Array(sampledPoints.flatMap(v => [v.x, v.y, v.z]));

        return (
            <group {...letter}>
                <points receiveShadow castShadow>
                    <bufferGeometry>
                        <bufferAttribute
                            args={[positions, 3]}
                            attach="attributes-position"
                            count={positions.length / 3}
                            array={positions} itemSize={3}
                        />
                    </bufferGeometry>
                    <pointsMaterial size={0.0015} color="#f8f5f5" />
                </points>
            </group>
        );

    }
//     const twist = useRef({ value: 20 });
//     const originalPositions = useMemo(() => {
//         const pos = ref.current.geometry.attributes.position;
//         return pos.array.slice(); // flat copy
//     }, []);
//     const applyTwist = (t: number) => {
//         const pos = ref.current.geometry.attributes.position;

//         const box = new THREE.Box3().setFromArray(originalPositions);
//         const center = new THREE.Vector3();
//         box.getCenter(center);

//         const maxY = box.max.y;
//         const minY = box.min.y;
//         const height = maxY - minY;

//         for (let i = 0; i < originalPositions.length; i += 3) {
//             let x = originalPositions[i];
//             let y = originalPositions[i + 1];
//             let z = originalPositions[i + 2];

//             // normalize height (0 → 1)
//             const ny = (y - minY) / height;

//             // twist angle increases with height
//             const angle = ny * t * Math.PI * 2;

//             // translate to center
//             const cx = x - center.x;
//             const cz = z - center.z;

//             // true cylindrical rotation
//             const sin = Math.sin(angle);
//             const cos = Math.cos(angle);

//             const rx = cx * cos - cz * sin;
//             const rz = cx * sin + cz * cos;

//             pos.array[i] = rx + center.x;
//             pos.array[i + 1] = y;
//             pos.array[i + 2] = rz + center.z;
//         }

//         pos.needsUpdate = true;
//     };
//     const quaternion = new THREE.Quaternion();
//     const hover = () => {
//         gsap.killTweensOf(ref.current.scale);
//         gsap.killTweensOf(ref.current.rotation);

//         gsap.to(ref.current.scale, {
//             x: 1.15,
//             y: 1.15,
//             z: 1.15,
//             duration: 0.4,
//             ease: "elastic.out(1, 0.4)",
//         });

//         gsap.to(ref.current.rotation, {
//             y: 0.025,
//             duration: 0.6,
//             ease: "elastic.out(1, 0.5)",
//         });

//         // wiggle loop
//         gsap.to(ref.current.rotation, {
//             z: 0.038,
//             y: -0.025,
//             duration: 0.15,
//             yoyo: true,
//             repeat: -1,
//             ease: "sine.inOut",
//         });
//     };

//     const unhover = () => {
//         gsap.killTweensOf(ref.current.rotation);

//         gsap.to(ref.current.scale, {
//             x: 1,
//             y: 1,
//             z: 1,
//             duration: 0.5,
//             ease: "power3.out",
//         });

//         // gsap.to(ref.current.rotation, {
//         //     x: 0,
//         //     y: 0,
//         //     z: 0,
//         //     duration: 0.6,
//         //     ease: "power3.out",
//         // });
//     };
//     debugger
//     return (

//         <primitive
//             ref={ref}
//             object={letter}
//             onPointerOver={hover}
//             onPointerOut={unhover}
//             />
//     )

// }