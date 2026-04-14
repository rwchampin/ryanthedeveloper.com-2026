'use client';

import * as THREE from 'three';
import { useMemo, useRef } from 'react';
import { useFrame, useThree } from '@react-three/fiber';

const SIZE = 256;

export function MagicLogo() {
    const meshRef = useRef<THREE.Mesh>(null);

    const { gl, camera } = useThree();

    /**
     * 🧠 RENDER TARGETS (MUTABLE - FIXED)
     */
    const rtA = useRef(
        new THREE.WebGLRenderTarget(SIZE, SIZE, {
            format: THREE.RGFormat,
            type: THREE.FloatType,
        })
    );

    const rtB = useRef(rtA.current.clone());

    /**
     * 🔁 SIMULATION PLANE (REUSED — NOT CREATED IN LOOP)
     */
    const simScene = useMemo(() => new THREE.Scene(), []);
    const simCamera = useMemo(() => new THREE.OrthographicCamera(-1, 1, 1, -1, 0, 1), []);

    const simPlane = useMemo(() => {
        const mat = new THREE.ShaderMaterial({
            uniforms: {
                uTexture: { value: null },
                uMouse: { value: new THREE.Vector2(0.5, 0.5) },
                uForce: { value: 0 },
                uTime: { value: 0 },
            },
            vertexShader: `
                varying vec2 vUv;
                void main() {
                    vUv = uv;
                    gl_Position = vec4(position, 1.0);
                }
            `,
            fragmentShader: `
                precision highp float;

                uniform sampler2D uTexture;
                uniform vec2 uMouse;
                uniform float uForce;
                uniform float uTime;

                varying vec2 vUv;

                void main() {

                    vec4 data = texture2D(uTexture, vUv);

                    float height = data.r;
                    float velocity = data.g;

                    float dist = distance(vUv, uMouse);

                    float impact = exp(-dist * 30.0) * uForce;

                    // IMPULSE (NOT RADIAL BULGE)
                    velocity += impact * 0.03;

                    // spring back to flat
                    velocity += -height * 0.02;

                    // damping
                    velocity *= 0.92;

                    height += velocity;

                    gl_FragColor = vec4(height, velocity, 0.0, 1.0);
                }
            `,
        });

        const plane = new THREE.Mesh(new THREE.PlaneGeometry(2, 2), mat);
        simScene.add(plane);

        return plane;
    }, [simScene]);

    /**
     * 🌑 RENDER MATERIAL (DISPLAY SAND)
     */
    const renderMaterial = useMemo(() => {
        return new THREE.ShaderMaterial({
            uniforms: {
                uHeightMap: { value: null },
            },
            vertexShader: `
                uniform sampler2D uHeightMap;
                varying vec2 vUv;

                void main() {
                    vUv = uv;

                    vec3 pos = position;

                    float h = texture2D(uHeightMap, uv).r;

                    pos.y += h * 1.5;

                    gl_Position = projectionMatrix * modelViewMatrix * vec4(pos, 1.0);
                }
            `,
            fragmentShader: `
                precision highp float;

                varying vec2 vUv;

                void main() {

                    float base = 0.03;

                    // subtle gradient sand depth
                    vec3 color = vec3(base);

                    gl_FragColor = vec4(color, 1.0);
                }
            `,
        });
    }, []);

    /**
     * 🧲 MOUSE STATE
     */
    const mouse = useRef(new THREE.Vector2(0.5, 0.5));
    const force = useRef(0);

    /**
     * 🔁 FRAME LOOP
     */
    useFrame((state) => {
        const t = state.clock.elapsedTime;

        /**
         * 🌐 mouse → UV
         */
        mouse.current.x = (state.pointer.x + 1) * 0.5;
        mouse.current.y = (state.pointer.y + 1) * 0.5;

        force.current = THREE.MathUtils.lerp(force.current, 1, 0.1);
        force.current *= 0.92;

        /**
         * 🧠 SIM UPDATE
         */
        const mat = simPlane.material as THREE.ShaderMaterial;

        mat.uniforms.uTexture.value = rtA.current.texture;
        mat.uniforms.uMouse.value = mouse.current;
        mat.uniforms.uForce.value = force.current;
        mat.uniforms.uTime.value = t;

        gl.setRenderTarget(rtB.current);
        gl.render(simScene, simCamera);
        gl.setRenderTarget(null);

        /**
         * 🔁 SWAP (FIXED - MUTABLE REFS)
         */
        const temp = rtA.current;
        rtA.current = rtB.current;
        rtB.current = temp;

        /**
         * 🌑 APPLY TO RENDER
         */
        renderMaterial.uniforms.uHeightMap.value = rtA.current.texture;
    });

    return (
        <mesh ref={meshRef} rotation-x={-Math.PI / 2}>
            <planeGeometry args={[10, 10, 256, 256]} />
            <primitive object={renderMaterial} attach="material" />
        </mesh>
    );
}