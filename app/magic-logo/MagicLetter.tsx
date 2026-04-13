    
import { useRef } from 'react';
import { useSurfaceSampler } from '../hooks/useSurfaceSampler';
import { Points, Point } from '@react-three/drei';
export const MagicLetter = ({ letter,count=500 }: { letter: any,count:number }) => {
    const ref = useRef<any>(letter);
    // sample the mesh to get the vertices and use them to create a point cloud
    const sampledPoints = useSurfaceSampler(ref.current, count);
    if (!sampledPoints) return null;
    const positions = new Float32Array(sampledPoints.flatMap(v => [v.x, v.y, v.z]));

    return (
        <group {...letter}>
            <points receiveShadow castShadow>
                <bufferGeometry>
                    {/* @ts-ignore */}
                    <bufferAttribute args={null} attach="attributes-position" count={sampledPoints.length} array={positions} itemSize={3} />
                </bufferGeometry>
                <pointsMaterial size={0.015} color="#00ff00" />
            </points>
        </group>
    );
    
}