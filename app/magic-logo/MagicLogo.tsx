import { useControls } from 'leva';
import {
    use3dFile
} from '../hooks/use3dFile';
import { MagicLetter } from './MagicLetter';
import { useThree } from '@react-three/fiber';
import { useEffect, useMemo, useRef } from 'react';
import * as THREE from 'three';

const LOGO_URL = '/3d/official-logo.glb';

export const MagicLogo = ({
    style="solid"
}) => {
    const group = useRef<THREE.Group>(null)
    const { camera, size } = useThree()
    // TODO: Update the use3dFile call to pass the key so the letters var 
    // is returned from the call without an entire new variable declaration
    const model = use3dFile(LOGO_URL);
    // const model = useMemo(() => logoNode.clone(), [logoNode])
    
    // const letters = logoNode?.children;

    const controls = useControls("Magic Logo", {
        positionX: { value: 0, min: -10, max: 10, step: 0.1 },
        positionY: { value: 0, min: -10, max: 10, step: 0.1 },
        positionZ: { value: 0, min: -10, max: 10, step: 0.1 },
        rotationX: { value: 0, min: -Math.PI, max: Math.PI, step: 0.01 },
        rotationY: { value: 0, min: -Math.PI, max: Math.PI, step: 0.01 },
        rotationZ: { value: .250, min: -Math.PI, max: Math.PI, step: 0.01 },
        scale: { value: 5.5, min: 0.1, max: 5, step: 0.1 },
    });

    useEffect(() => {
        if (!group.current) return

        const box = new THREE.Box3().setFromObject(model)
        const sizeVec = new THREE.Vector3()
        const center = new THREE.Vector3()

        box.getSize(sizeVec)
        box.getCenter(center)

        // Center the model
        model.position.x -= center.x
        model.position.y -= center.y
        model.position.z -= center.z

        // Fit to camera
        const fitCameraDistance = (camera as THREE.PerspectiveCamera).position.z

        const vFov = (camera as THREE.PerspectiveCamera).fov * Math.PI / 180
        const heightAtDist = 2 * Math.tan(vFov / 2) * fitCameraDistance
        const widthAtDist = heightAtDist * camera.aspect

        const scale = Math.min(
            widthAtDist / sizeVec.x,
            heightAtDist / sizeVec.y
        )

        group.current.scale.setScalar(scale * 0.9) // padding factor
    }, [camera, model, size])

    return (
        <group 
            ref={group}
            position={[controls.positionX, controls.positionY, controls.positionZ]}
            rotation={[controls.rotationX, controls.rotationY, controls.rotationZ]}
            // scale={controls.scale}
        >
            <primitive object={model} />
        </group>
    )
    return (
        <group 
            position={[controls.positionX, controls.positionY, controls.positionZ]}
            rotation={[controls.rotationX, controls.rotationY, controls.rotationZ]}
            scale={controls.scale}
        >
            {letters && letters.map((letter:any, index:number) => (
                <MagicLetter key={index} letter={letter} count={32} />
            ))}
        </group>
    );
}

