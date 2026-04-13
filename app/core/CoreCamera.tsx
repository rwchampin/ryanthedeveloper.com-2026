/**
 * CoreCamera.tsx
 * @author Ryan The Developer
 * @description Ultimate r3f camera component that supports multiple camera types (perspective, orthographic, orthographic) with helper utilities for camera manipulation and positioning.
 */


import { useThree } from '@react-three/fiber'
import { useControls } from 'leva'
import { useEffect } from 'react'


export type CameraType = 'perspective' | 'orthographic'

interface CoreCameraProps {
    type?: CameraType
    position?: any
    fov?: number
    near?: number
    far?: number
    zoom?: number
    lookAt?: any
}

/**
 * Utility function to focus camera on a target
 */
export const useCameraFocus = (target: any | null, duration = 0.5) => {
    const { camera } = useThree()
    
    useEffect(() => {
        if (!target) return
        
        const startPos = camera.position.clone()
        const endPos = {
            x: target[0],
            y: target[1],
            z: target[2],
        }
        
        const startTime = Date.now()
        
        const animate = () => {
            const elapsed = (Date.now() - startTime) / 1000
            const progress = Math.min(elapsed / duration, 1)
            
            camera.position.x = startPos.x + (endPos.x - startPos.x) * progress
            camera.position.y = startPos.y + (endPos.y - startPos.y) * progress
            camera.position.z = startPos.z + (endPos.z - startPos.z) * progress
            
            if (progress < 1) {
                requestAnimationFrame(animate)
            }
        }
        
        animate()
    }, [target, duration, camera])
}

/**
 * Utility function to get optimal camera distance based on object size
 */
export const calculateCameraDistance = (
    objectSize: number,
    fov: number = 35
): number => {
    const vFOV = (fov * Math.PI) / 180
    return objectSize / (2 * Math.tan(vFOV / 2))
}

/**
 * Ultimate CoreCamera component with support for perspective and orthographic cameras
 */
export const CoreCamera = ({
    type = 'perspective',
    position = [0, 0, 8] as any,
    fov = 1,
    near = 0.1,
    far = 1000,
    zoom = 1,
    lookAt,
}: CoreCameraProps) => {
    const { camera } = useThree()

    const controls = useControls("Core Camera",{
        positionX: { value: position[0], min: -100, max: 100, step: 0.1 },
        positionY: { value: position[1], min: -100, max: 100, step: 0.1 },
        positionZ: { value: position[2], min: -100, max: 100, step: 0.1 },
        fov: { value: fov, min: 1, max: 180, step: 1 },
        near: { value: near, min: 0.1, max: 100, step: 0.1 },
        far: { value: far, min: 1, max: 10000, step: 1 },
        zoom: { value: zoom, min: 0.1, max: 10, step: 0.1 },
        lookAtX: { value: lookAt ? lookAt[0] : 0, min: -100, max: 100, step: 0.1 },
        lookAtY: { value: lookAt ? lookAt[1] : 0, min: -100, max: 100, step: 0.1 },
        lookAtZ: { value: lookAt ? lookAt[2] : 0, min: -100, max: 100, step: 0.1 },
    })

    // useEffect(() => {
    //     camera.position.set(controls.positionX, controls.positionY, controls.positionZ)
    // }, [controls.positionX, controls.positionY, controls.positionZ, camera])

    useEffect(() => {
        // camera.fov = controls.fov
        camera.near = controls.near
        camera.far = controls.far
        camera.zoom = controls.zoom
    }, [controls.fov, controls.near, controls.far, controls.zoom, camera])

    // useEffect(() => {
    //     if (lookAt) {
    //         camera.lookAt(controls.lookAtX, controls.lookAtY, controls.lookAtZ)
    //     }
    // }, [lookAt, camera])

    if (type === 'orthographic') {
        const width = window.innerWidth
        const height = window.innerHeight
        
        return (
            <orthographicCamera
                // makeDefault
                position={position}
                zoom={zoom}
                near={near}
                far={far}
                left={-width / 2}
                right={width / 2}
                top={height / 2}
                bottom={-height / 2}
            />
        )
    }

    return (
        <perspectiveCamera
            // makeDefault
            position={position}
            fov={fov}
            near={near}
            far={far}
            zoom={zoom}
        />
    )
}