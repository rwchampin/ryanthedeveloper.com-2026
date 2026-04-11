'use client';
import { useEffect, useState } from 'react';
import { Leva } from 'leva';
import { OrbitControls, Html } from '@react-three/drei';


export const Debugger = () => {
    const [debug, setDebug] = useState<boolean>(false);

    useEffect(() => {
        const checkDebugHash = () => {
            const isDebugMode = window.location.hash === '#debug';
            setDebug(isDebugMode);
            if (isDebugMode) {
                console.log('Debug mode enabled');
            }
        };

        // Check on initial load
        checkDebugHash();

        // Listen for hash changes
        window.addEventListener('hashchange', checkDebugHash);

        return () => {
            window.removeEventListener('hashchange', checkDebugHash);
        };
    }, []);

    if(!debug) return null;
    
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
         <OrbitControls autoRotate autoRotateSpeed={0.1} enableZoom={true} minPolarAngle={0} maxPolarAngle={Math.PI / 2.5} />
         </>
    );
}