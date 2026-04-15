'use client';
import { useMemo, useRef, useEffect } from 'react';
import { useSphereSurfacePositions } from './useSphereSurfacePositions';
import * as THREE from 'three';
import { useFrame, createPortal, useThree } from '@react-three/fiber';
import { useFBO } from '@react-three/drei';


type OrbitData = {
    axis: THREE.Vector3;
    radius: number;
    speed: number;
    phase: number;
};

export function createGlobalOrbitData(count: number, baseRadius: number): OrbitData[] {
    const data: OrbitData[] = [];

    for (let i = 0; i < count; i++) {
        data.push({
            axis: new THREE.Vector3(
                Math.random() * 2 - 1,
                Math.random() * 2 - 1,
                Math.random() * 2 - 1
            ).normalize(),

            // spread particles across sphere radius
            radius: baseRadius * (0.8 + Math.random() * 0.4),

            speed: 0.5 + Math.random() * 2,
            phase: Math.random() * Math.PI * 2,
        });
    }

    return data;
}

export function updateGlobalOrbitPositions(
    orbitData: OrbitData[],
    positions: Float32Array,
    time: number
) {
    const base = new THREE.Vector3(1, 0, 0); // starting direction
    const quat = new THREE.Quaternion();

    for (let i = 0; i < orbitData.length; i++) {
        const d = orbitData[i];

        quat.setFromAxisAngle(d.axis, time * d.speed + d.phase);

        const pos = base
            .clone()
            .applyQuaternion(quat)
            .multiplyScalar(d.radius);

        const i3 = i * 3;
        positions[i3 + 0] = pos.x;
        positions[i3 + 1] = pos.y;
        positions[i3 + 2] = pos.z;
    }
}


export const ParticleSwarm = ({
    radius = 0.5,
    count = 124,
}) => {
    const { mouse } = useThree();
    const meshRef = useRef<THREE.Mesh>(null);
    const debugRef = useRef<THREE.Mesh>(null);

    // 1. create FBO
    const fboA = useFBO(count, count);
    const fboB = useFBO(count, count);

    const current = useRef(fboA);
    const next = useRef(fboB);

    // 2. scene for simulation
    const simScene = useMemo(() => new THREE.Scene(), []);
    const simCamera = useMemo(() => new THREE.OrthographicCamera(-1, 1, 1, -1, 0, 1), []);

    const initialized = useRef(false);

    const geometry = useMemo(() => {
        const geo = new THREE.BufferGeometry();

        const positions = new Float32Array(count * count * 3);
        const uvs = new Float32Array(count * count * 2);

        let i = 0;

        for (let y = 0; y < count; y++) {
            for (let x = 0; x < count; x++) {

                const i2 = i * 2;

                uvs[i2 + 0] = x / (count - 1);
                uvs[i2 + 1] = y / (count - 1);

                i++;
            }
        }

        geo.setAttribute('position', new THREE.BufferAttribute(positions, 3));
        geo.setAttribute('uv', new THREE.BufferAttribute(uvs, 2));

        return geo;
    }, [count]);

    const particleMaterial = useMemo(() => {
        return new THREE.ShaderMaterial({
            uniforms: {
                uPositions: { value: null },
            },
            vertexShader: `
      uniform sampler2D uPositions;
      varying vec3 vColor;

      void main() {

        vec4 posData = texture2D(uPositions, uv);

        vec3 pos = posData.xyz;

        vec4 mvPosition = modelViewMatrix * vec4(pos, 1.0);
        gl_Position = projectionMatrix * mvPosition;

        gl_PointSize = 2.0;
      }
    `,
            fragmentShader: `
      void main() {
        gl_FragColor = vec4(1.0);
      }
    `,
        });
    }, []);
    // 4. simulation material (GPU logic goes here)
    const simMaterial = useMemo(() => {
        return new THREE.ShaderMaterial({
            uniforms: {
                uTime: { value: 0 },
                uPrevPositions: { value: null },
                uMouse: { value: new THREE.Vector2() },
                uMouseStrength: { value: 1.0 },
            },
            vertexShader: `
            varying vec2 vUv;

            void main() {
                vUv = uv;
                gl_Position = vec4(position, 1.0);
            }
      `,
            fragmentShader: `
            varying vec2 vUv;


uniform sampler2D uPrevPositions;
uniform vec2 uMouse;
uniform float uTime;
uniform float uMouseStrength;

float hash(vec2 p) {
  return fract(sin(dot(p, vec2(127.1,311.7))) * 43758.5453123);
}

void main() {

  vec4 prev = texture2D(uPrevPositions, vUv);

  vec3 pos = prev.xyz;
  float life = prev.w;

  // --- BASE NOISE MOTION ---
  vec2 id = vUv;

  vec3 noiseDir = normalize(vec3(
    hash(id * 1.0),
    hash(id * 2.0),
    hash(id * 3.0)
  ) * 2.0 - 1.0);

vec3 velocity = noiseDir * 0.003;

// inertia
pos += velocity;

// --- MOUSE BRUSH FORCE ---

vec2 mouse = uMouse;

// stronger field conversion
vec3 mousePos = vec3(mouse, 0.0);


// distance in XY plane
float d = length(pos.xy - mousePos.xy);

// smooth falloff brush
float force = smoothstep(0.6, 0.0, d);

// directional push
vec3 dir = normalize(pos - mousePos + 0.0001);

pos += dir * force * 0.05 * uMouseStrength;





// prevent NaNs when overlapping
dir = normalize(dir + 0.0001);

// apply force
pos += dir * force * 0.03 * uMouseStrength;

  // --- DECAY / TRAIL ---
  life *= 0.98;

  gl_FragColor = vec4(pos, life);
}
      `,
        });
    }, []);

    useEffect(() => {
        const scene = new THREE.Scene();
        const camera = new THREE.OrthographicCamera(-1, 1, 1, -1, 0, 1);

        const material = new THREE.ShaderMaterial({
            uniforms: {
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
      varying vec2 vUv;

      float hash(vec2 p){
        return fract(sin(dot(p, vec2(127.1,311.7))) * 43758.5453123);
      }

      void main() {

        vec2 id = vUv;

        float theta = hash(id * 10.0) * 6.2831;
        float phi = acos(hash(id * 20.0) * 2.0 - 1.0);

        vec3 pos = vec3(
          sin(phi) * cos(theta),
          sin(phi) * sin(theta),
          cos(phi)
        ) * 0.5;

        gl_FragColor = vec4(pos, 1.0);
      }
    `,
        });

        const mesh = new THREE.Mesh(new THREE.PlaneGeometry(2, 2), material);
        scene.add(mesh);

        const camera2 = camera;

        const gl = (window as any).__r3f?.gl;
        if (!gl) return;

        gl.setRenderTarget(fboA);
        gl.render(scene, camera2);
        gl.setRenderTarget(null);

        current.current = fboA;
    }, []);

    // 5. quad to run simulation
    const simQuad = useMemo(() => {
        return new THREE.Mesh(
            new THREE.PlaneGeometry(2, 2),
            simMaterial
        );
    }, [simMaterial]);

    // attach to scene
    useMemo(() => {
        simScene.add(simQuad);
    }, [simScene, simQuad]);

    // 6. render loop
    useFrame(({ gl, clock }) => {
        const time = clock.getElapsedTime();
        simMaterial.uniforms.uMouse.value.set(mouse.x, mouse.y);

        simMaterial.uniforms.uTime.value = time;

        // 👇 IMPORTANT: feed previous frame
        simMaterial.uniforms.uPrevPositions.value = current.current.texture;
        particleMaterial.uniforms.uPositions.value = current.current.texture;

        gl.setRenderTarget(next.current);
        gl.render(simScene, simCamera);
        gl.setRenderTarget(null);

        // 👇 swap buffers
        const temp = current.current;
        current.current = next.current;
        next.current = temp;
    });

    return <points geometry={geometry} material={particleMaterial} />

    // return (
    //     <mesh ref={debugRef}>
    //         <planeGeometry args={[2, 2]} />
    //         <meshBasicMaterial map={current.current.texture} />
    //     </mesh>
    // );
}