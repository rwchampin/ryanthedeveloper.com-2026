'use client';

import { useThree } from '@react-three/fiber';
import { useLayoutEffect } from 'react';
import * as THREE from 'three';

type Options = {
    padding?: number;
    top?: number; // pixels to exclude from top
};

export function useFitToViewport(
    ref: React.RefObject<THREE.Object3D>,
    { padding = 0.9, top = 0 }: Options = {}
) {
    const { camera, size } = useThree();

    useLayoutEffect(() => {
        if (!ref.current) return;

        const obj = ref.current;

        // reset transforms BEFORE measuring
        obj.scale.set(1, 1, 1);
        obj.position.set(0, 0, 0);

        obj.updateWorldMatrix(true, true);

        // bounding box
        const box = new THREE.Box3().setFromObject(obj);
        const sizeVec = new THREE.Vector3();
        const center = new THREE.Vector3();

        box.getSize(sizeVec);
        box.getCenter(center);

        // center object at origin
        obj.position.set(-center.x, -center.y, -center.z);

        // camera
        const cam = camera as THREE.PerspectiveCamera;
        const fov = THREE.MathUtils.degToRad(cam.fov);

        const distance = cam.position.length();

        // FULL visible height
        const fullHeight = 2 * Math.tan(fov / 2) * distance;

        // convert pixel "top" into world units
        const topWorld = (top / size.height) * fullHeight;

        // usable viewport
        const usableHeight = fullHeight - topWorld;
        const usableWidth = usableHeight * (size.width / (size.height - top));

        // scale
        const scaleX = usableWidth / sizeVec.x;
        const scaleY = usableHeight / sizeVec.y;

        const scale = Math.min(scaleX, scaleY) * padding;

        obj.scale.setScalar(scale);

        // 🎯 vertical offset so object is centered in remaining space
        const offsetY = -topWorld / 2;

        obj.position.y += offsetY;

    }, [camera, size.width, size.height, top]);
}