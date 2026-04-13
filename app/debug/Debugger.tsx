'use client';
import { useEffect, useState } from 'react';
import { Leva, useControls } from 'leva';
import {
    OrbitControls,
    Html,
    PerformanceMonitor
} from '@react-three/drei';

export const Debugger = () => {
    const [debug, setDebug] = useState<boolean>(false);
    
    const controls = useControls("Orbit Controls", {
        OrbitControls: { value: true },
        autoRotate: { value: true },
        autoRotateSpeed: { value: 0.1, min: 0, max: 1, step: 0.01 },
        enableZoom: { value: true },
        minPolarAngle: { value: 0, min: 0, max: Math.PI, step: 0.01 },
        maxPolarAngle: { value: Math.PI / 2.5, min: 0, max: Math.PI, step: 0.01 },
    });

    useEffect(() => {
        const checkDebugHash = () => {
            const isDebugMode = window.location.hash === '#debug';
            setDebug(isDebugMode);
            if (isDebugMode) {
                console.log('Debug mode enabled');
            }
        };

        const handleKeyDown = (e: KeyboardEvent) => {
            // cmd + d (Mac)
            if (e.metaKey && e.key.toLowerCase() === 'd') {
                e.preventDefault();

                const isDebug = window.location.hash === '#debug';

                if (isDebug) {
                    window.location.hash = '';
                    setDebug(false);
                } else {
                    window.location.hash = '#debug';
                    setDebug(true);
                }
            }
        };

        // Initial check
        checkDebugHash();

        // Listeners
        window.addEventListener('hashchange', checkDebugHash);
        window.addEventListener('keydown', handleKeyDown);

        return () => {
            window.removeEventListener('hashchange', checkDebugHash);
            window.removeEventListener('keydown', handleKeyDown);
        };
    }, []);

    if (!debug) return null;

    return (
        <>
            <Html>
                <Leva
                    titleBar={{
                        title: 'Ryan The Developer',
                    }}
                />
            </Html>

            <axesHelper args={[500]} />

            <OrbitControls />
            <PerformanceMonitor />
        </>
    );
};