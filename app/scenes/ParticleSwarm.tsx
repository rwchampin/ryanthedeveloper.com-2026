// import * as THREE from 'three'
// import { useRef, useMemo, useEffect } from 'react'
// import { useFrame, createPortal, extend } from '@react-three/fiber'
// import { useFBO } from '@react-three/drei'


// // ======================
// // Simulation Material (runs off-screen)
// // ======================
// class SimulationMaterial extends THREE.ShaderMaterial {
//     constructor(size: number) {
//         const positions = new Float32Array(size * size * 4)

//         // Initialize points on a sphere
//         for (let i = 0; i < size * size; i++) {
//             const stride = i * 4
//             const theta = Math.random() * Math.PI * 2
//             const phi = Math.acos(2 * Math.random() - 1)
//             const r = 6 + Math.random() * 1.5

//             positions[stride] = r * Math.sin(phi) * Math.cos(theta)
//             positions[stride + 1] = r * Math.sin(phi) * Math.sin(theta)
//             positions[stride + 2] = r * Math.cos(phi)
//             positions[stride + 3] = 1.0
//         }

//         const dataTexture = new THREE.DataTexture(
//             positions,
//             size,
//             size,
//             THREE.RGBAFormat,
//             THREE.FloatType
//         )
//         dataTexture.needsUpdate = true

//         super({
//             uniforms: {
//                 uPositions: { value: dataTexture },
//                 uTime: { value: 0 },
//             },
//             vertexShader: `
//         varying vec2 vUv;
//         void main() {
//           vUv = uv;
//           gl_Position = vec4(position, 1.0);
//         }
//       `,
//             fragmentShader: `
//         precision highp float;
//         uniform sampler2D uPositions;
//         uniform float uTime;
//         varying vec2 vUv;

//         void main() {
//           vec4 pos = texture2D(uPositions, vUv);

//           // Gentle orbiting / swirling on the sphere
//           float angle = uTime * 0.4;
//           vec3 p = pos.xyz;

//           p.x += sin(angle + p.y * 0.8) * 0.012;
//           p.z += cos(angle + p.x * 0.8) * 0.012;

//           // Soft constraint back toward sphere
//           float len = length(p);
//           p = normalize(p) * mix(len, 7.0, 0.035);

//           gl_FragColor = vec4(p, 1.0);
//         }
//       `,
//         })
//     }
// }
// // Extend so we can use <simulationMaterial /> in JSX
// extend({ SimulationMaterial })

// const ParticleSwarm = () => {
//     const size = 32                    // 256×256 = 65,536 particles
//     const pointsRef = useRef<THREE.Points>(null!)
//     const simMaterialRef = useRef<any>(null!)

//     // Off-screen simulation scene + ortho camera
//     const simScene = useMemo(() => new THREE.Scene(), [])
//     const simCamera = useMemo(
//         () => new THREE.OrthographicCamera(-1, 1, 1, -1, 1 / Math.pow(2, 53), 100),
//         []
//     )

//     // Fullscreen quad for simulation
//     const simPositions = useMemo(
//         () => new Float32Array([-1, -1, 0, 1, -1, 0, 1, 1, 0, -1, -1, 0, 1, 1, 0, -1, 1, 0]),
//         []
//     )
//     const simUVs = useMemo(
//         () => new Float32Array([0, 0, 1, 0, 1, 1, 0, 0, 1, 1, 0, 1]),
//         []
//     )

//     // Render target (FBO)
//     const renderTarget = useFBO(size, size, {
//         minFilter: THREE.NearestFilter,
//         magFilter: THREE.NearestFilter,
//         format: THREE.RGBAFormat,
//         stencilBuffer: false,
//         type: THREE.FloatType,
//     })

//     // UV buffer for the visible points (tells each point which texel to read)
//     const particlesUV = useMemo(() => {
//         const length = size * size
//         const pos = new Float32Array(length * 3)
//         for (let i = 0; i < length; i++) {
//             const i3 = i * 3
//             pos[i3] = (i % size) / size
//             pos[i3 + 1] = Math.floor(i / size) / size
//             pos[i3 + 2] = 0
//         }
//         return pos
//     }, [size])

//     // Uniforms for visible points
//     const pointsUniforms = useMemo(
//         () => ({
//             uPositions: { value: null as THREE.Texture | null },
//         }),
//         []
//     )

//     // Simulation loop
//     useFrame((state) => {
//         const { gl, clock } = state

//         // === SIMULATION PASS ===
//         gl.setRenderTarget(renderTarget)
//         gl.clear()
//         gl.render(simScene, simCamera)
//         gl.setRenderTarget(null)

//         // Update visible points
//         // if (pointsRef.current) {
//         const uniforms = (pointsRef.current!.material as THREE.ShaderMaterial).uniforms
//             uniforms.uPositions.value = renderTarget.texture
//         // }

//         // Update simulation time
//         // if (simMaterialRef.current) {
//             simMaterialRef.current.uniforms.uTime.value = clock.getElapsedTime()
//         // }
//     })

//     return (
//         <>
//             {/* Off-screen simulation (via portal) */}
//             {createPortal(
//                 <mesh>
//                     {/* ts-ignore */}
//                     <simulationMaterial ref={simMaterialRef} args={[size]} />
//                     <bufferGeometry>
//                         <bufferAttribute
//                             attach="attributes-position"
//                             array={simPositions}
//                             itemSize={3}
//                             count={simPositions.length / 3}
//                         />
//                         <bufferAttribute
//                             attach="attributes-uv"
//                             array={simUVs}
//                             itemSize={2}
//                             count={simUVs.length / 2}
//                         />
//                     </bufferGeometry>
//                 </mesh>,
//                 simScene
//             )}

//             {/* Visible Points */}
//             <points ref={pointsRef}>
//                 <bufferGeometry>
//                     <bufferAttribute
//                         attach="attributes-position"
//                         array={particlesPosition}
//                         itemSize={3}
//                         count={particlesUV.length / 3}
//                     />
//                 </bufferGeometry>
//                 <shaderMaterial
//                     uniforms={pointsUniforms}
//                     vertexShader={`
//             uniform sampler2D uPositions;
//             void main() {
//               vec3 pos = texture2D(uPositions, position.xy).xyz;

//               vec4 mvPosition = modelViewMatrix * vec4(pos, 1.0);
//               gl_Position = projectionMatrix * mvPosition;
//               gl_PointSize = 3.5 * (300.0 / -mvPosition.z);
//             }
//           `}
//                     fragmentShader={`
//             void main() {
//               vec2 c = gl_PointCoord - vec2(0.5);
//               if (length(c) > 0.5) discard;
//               gl_FragColor = vec4(0.6, 0.85, 1.0, 0.95);
//             }
//           `}
//                     blending={THREE.AdditiveBlending}
//                     depthWrite={false}
//                     transparent={true}
//                 />
//             </points>
//         </>
//     )
// }

// export default ParticleSwarm;
// // import * as THREE from 'three'
// // import { useFrame, useThree} from '@react-three/fiber'
// // import { useMemo, useRef,
// //     useEffect
// //  } from 'react'

// // const WIDTH = 256
// // const HEIGHT = 256
// // const NUM_POINTS = WIDTH * HEIGHT
// // const RADIUS = 1.5
// // const ORBIT_SPEED = 8
// // const REPULSION_RADIUS = 4.5
// // const MOUSE_FORCE_STRENGTH = 12

// // function createInitialTextures() {
// //     const posData = new Float32Array(NUM_POINTS * 4)
// //     const velData = new Float32Array(NUM_POINTS * 4)
// //     const initPosData = new Float32Array(NUM_POINTS * 4)

// //     for (let i = 0; i < NUM_POINTS; i++) {
// //         const stride = i * 4

// //         const theta = Math.random() * Math.PI * 2
// //         const phi = Math.acos(2 * Math.random() - 1)
// //         const r = RADIUS + Math.random() * 2.5

// //         const x = r * Math.sin(phi) * Math.cos(theta)
// //         const y = r * Math.sin(phi) * Math.sin(theta)
// //         const z = r * Math.cos(phi)

// //         posData[stride] = x
// //         posData[stride + 1] = y
// //         posData[stride + 2] = z
// //         posData[stride + 3] = 1.0

// //         initPosData[stride] = x
// //         initPosData[stride + 1] = y
// //         initPosData[stride + 2] = z
// //         initPosData[stride + 3] = 1.0

// //         const nx = x / r
// //         const nz = z / r
// //         const tx = nz * ORBIT_SPEED
// //         const tz = -nx * ORBIT_SPEED

// //         velData[stride] = tx + (Math.random() - 0.5) * 1.5
// //         velData[stride + 1] = (Math.random() - 0.5) * 1.5
// //         velData[stride + 2] = tz + (Math.random() - 0.5) * 1.5
// //         velData[stride + 3] = 0.0
// //     }

// //     const positionTexture = new THREE.DataTexture(posData, WIDTH, HEIGHT, THREE.RGBAFormat, THREE.FloatType)
// //     positionTexture.needsUpdate = true

// //     const velocityTexture = new THREE.DataTexture(velData, WIDTH, HEIGHT, THREE.RGBAFormat, THREE.FloatType)
// //     velocityTexture.needsUpdate = true

// //     const initialPositionTexture = new THREE.DataTexture(initPosData, WIDTH, HEIGHT, THREE.RGBAFormat, THREE.FloatType)
// //     initialPositionTexture.needsUpdate = true

// //     return { positionTexture, velocityTexture, initialPositionTexture }
// // }

// // export default function ParticleSwarm() {
// //     const { gl, camera, mouse: screenMouse } = useThree()

// //     const { initialPositionTexture, initialVelocityTexture } = useMemo(createInitialTextures, [])

// //     const [posRT1, posRT2] = useMemo(() => {
// //         const opts = {
// //             wrapS: THREE.ClampToEdgeWrapping,
// //             wrapT: THREE.ClampToEdgeWrapping,
// //             minFilter: THREE.NearestFilter,
// //             magFilter: THREE.NearestFilter,
// //             format: THREE.RGBAFormat,
// //             type: THREE.FloatType,
// //         }
// //         return [new THREE.WebGLRenderTarget(WIDTH, HEIGHT, opts), new THREE.WebGLRenderTarget(WIDTH, HEIGHT, opts)]
// //     }, [])

// //     const [velRT1, velRT2] = useMemo(() => {
// //         const opts = { ...posRT1.userData }
// //         return [new THREE.WebGLRenderTarget(WIDTH, HEIGHT, opts), new THREE.WebGLRenderTarget(WIDTH, HEIGHT, opts)]
// //     }, [posRT1])

// //     const currentPosRef = useRef(posRT1)
// //     const nextPosRef = useRef(posRT2)
// //     const currentVelRef = useRef(velRT1)
// //     const nextVelRef = useRef(velRT2)

// //     const simScene = useMemo(() => new THREE.Scene(), [])
// //     const simCamera = useMemo(() => new THREE.OrthographicCamera(-1, 1, 1, -1, 0, 1), [])
// //     const simMeshRef = useRef<THREE.Mesh>(null!)

// //     const simGeometry = useMemo(() => new THREE.PlaneGeometry(2, 2), [])

// //     // Velocity simulation material
// //     const velocityMaterial = useMemo(
// //         () =>
// //             new THREE.ShaderMaterial({
// //                 uniforms: {
// //                     uPosition: { value: null as THREE.Texture | null },
// //                     uVelocity: { value: null as THREE.Texture | null },
// //                     uInitialVelocity: { value: initialVelocityTexture },
// //                     uMouse: { value: new THREE.Vector3() },
// //                     uDelta: { value: 0.016 },
// //                 },
// //                 vertexShader: `
// //           varying vec2 vUv;
// //           void main() {
// //             vUv = uv;
// //             gl_Position = vec4(position, 1.0);
// //           }
// //         `,
// //                 fragmentShader: `
// //           precision highp float;
// //           uniform sampler2D uPosition;
// //           uniform sampler2D uVelocity;
// //           uniform sampler2D uInitialVelocity;
// //           uniform vec3 uMouse;
// //           uniform float uDelta;

// //           varying vec2 vUv;

// //           void main() {
// //             vec4 posData = texture2D(uPosition, vUv);
// //             vec4 velData = texture2D(uVelocity, vUv);
// //             vec3 p = posData.xyz;
// //             vec3 v = velData.xyz;
// //             float fade = posData.a;

// //             vec3 centerForce = -p * 0.018;

// //             vec3 mouseForce = vec3(0.0);
// //             float dist = length(p - uMouse);
// //             if (dist < ${REPULSION_RADIUS.toFixed(1)} && dist > 0.001) {
// //               mouseForce = normalize(p - uMouse) * (${MOUSE_FORCE_STRENGTH.toFixed(1)} / (dist * dist + 0.2));
// //             }

// //             float damping = 0.965;
// //             if (dist < ${REPULSION_RADIUS.toFixed(1)}) {
// //               damping = 0.82;
// //               fade -= 1.4 * uDelta;
// //             } else if (fade < 1.0) {
// //               damping = 0.91;
// //               fade -= 0.5 * uDelta;
// //             }

// //             v *= damping;
// //             v += (centerForce + mouseForce) * uDelta * 18.0;

// //             if (length(v) > 28.0) v = normalize(v) * 28.0;

// //             if (fade <= 0.0) v = texture2D(uInitialVelocity, vUv).xyz;

// //             gl_FragColor = vec4(v, 0.0);
// //           }
// //         `,
// //             }),
// //         [initialVelocityTexture]
// //     )

// //     // Position simulation material
// //     const positionMaterial = useMemo(
// //         () =>
// //             new THREE.ShaderMaterial({
// //                 uniforms: {
// //                     uPosition: { value: null as THREE.Texture | null },
// //                     uVelocity: { value: null as THREE.Texture | null },
// //                     uInitialPosition: { value: initialPositionTexture },
// //                     uDelta: { value: 0.016 },
// //                 },
// //                 vertexShader: `
// //           varying vec2 vUv;
// //           void main() {
// //             vUv = uv;
// //             gl_Position = vec4(position, 1.0);
// //           }
// //         `,
// //                 fragmentShader: `
// //           precision highp float;
// //           uniform sampler2D uPosition;
// //           uniform sampler2D uVelocity;
// //           uniform sampler2D uInitialPosition;
// //           uniform float uDelta;

// //           varying vec2 vUv;

// //           void main() {
// //             vec4 posData = texture2D(uPosition, vUv);
// //             vec3 p = posData.xyz + texture2D(uVelocity, vUv).xyz * uDelta * 6.0;
// //             float fade = posData.a;

// //             if (fade <= 0.0) {
// //               p = texture2D(uInitialPosition, vUv).xyz;
// //               fade = 1.0;
// //             }

// //             gl_FragColor = vec4(p, fade);
// //           }
// //         `,
// //             }),
// //         [initialPositionTexture]
// //     )

// //     // Visible points
// //     const pointsRef = useRef<THREE.Points>(null!)
// //     const pointsGeometry = useMemo(() => {
// //         const geo = new THREE.BufferGeometry()
// //         const uvs = new Float32Array(NUM_POINTS * 2)
// //         for (let i = 0; i < NUM_POINTS; i++) {
// //             uvs[i * 2] = (i % WIDTH) / WIDTH
// //             uvs[i * 2 + 1] = Math.floor(i / WIDTH) / HEIGHT
// //         }
// //         geo.setAttribute('uv', new THREE.BufferAttribute(uvs, 2))
// //         return geo
// //     }, [])

// //     const pointsMaterial = useMemo(
// //         () =>
// //             new THREE.ShaderMaterial({
// //                 uniforms: {
// //                     positionTexture: { value: null as THREE.Texture | null },
// //                     pointSize: { value: 3.5 },
// //                 },
// //                 vertexShader: `
// //         //   attribute vec2 uv;
// //           uniform sampler2D positionTexture;
// //           uniform float pointSize;
// //           varying float vFade;

// //           void main() {
// //             vec4 pos = texture2D(positionTexture, uv);
// //             vFade = pos.a;

// //             vec4 mvPos = modelViewMatrix * vec4(pos.xyz, 1.0);
// //             gl_Position = projectionMatrix * mvPos;
// //             gl_PointSize = pointSize * (300.0 / -mvPos.z);   // increased base size
// //           }
// //         `,
// //                 fragmentShader: `
// //           varying float vFade;
// //           void main() {
// //             if (vFade < 0.02) discard;
// //             vec2 c = gl_PointCoord - 0.5;
// //             float d = length(c);
// //             if (d > 0.5) discard;
// //             gl_FragColor = vec4(0.6, 1.0, 0.95, vFade * (1.0 - d * 1.6));
// //           }
// //         `,
// //                 transparent: true,
// //                 depthTest: false,
// //                 depthWrite: false,
// //                 blending: THREE.AdditiveBlending,
// //             }),
// //         []
// //     )

// //     const mouse3D = useRef(new THREE.Vector3())

// //     // Initialize FBOs
// //     useEffect(() => {
// //         const initMat = new THREE.ShaderMaterial({
// //             uniforms: { uTex: { value: null as THREE.Texture | null } },
// //             vertexShader: `varying vec2 vUv; void main(){vUv=uv;gl_Position=vec4(position,1.0);}`,
// //             fragmentShader: `uniform sampler2D uTex; varying vec2 vUv; void main(){gl_FragColor=texture2D(uTex,vUv);}`,
// //         })

// //         const initMesh = new THREE.Mesh(simGeometry, initMat)
// //         simScene.add(initMesh)

// //         // Position
// //         initMat.uniforms.uTex.value = initialPositionTexture
// //         gl.setRenderTarget(posRT1)
// //         gl.render(simScene, simCamera)

// //         // Velocity
// //         initMat.uniforms.uTex.value = initialVelocityTexture
// //         gl.setRenderTarget(velRT1)
// //         gl.render(simScene, simCamera)

// //         gl.setRenderTarget(null)
// //         simScene.remove(initMesh)
// //         initMat.dispose()

// //         currentPosRef.current = posRT1
// //         currentVelRef.current = velRT1
// //     }, [gl, simScene, simCamera, simGeometry, initialPositionTexture, initialVelocityTexture])

// //     // Simulation + rendering loop
// //     useFrame((state, delta) => {
// //         const dt = Math.min(delta, 0.05)

// //         // Update mouse in world space (intersect Z=0 plane)
// //         const ray = new THREE.Ray()
// //         ray.origin.copy(camera.position)
// //         ray.direction
// //             .set(screenMouse.x, screenMouse.y, 0.5)
// //             .unproject(camera)
// //             .sub(camera.position)
// //             .normalize()

// //         const t = -camera.position.z / ray.direction.z
// //         if (t > 0) mouse3D.current.copy(ray.origin).addScaledVector(ray.direction, t)

// //         const simMesh = simMeshRef.current
// //         if (!simMesh) return

// //         // Velocity pass
// //         velocityMaterial.uniforms.uPosition.value = currentPosRef.current.texture
// //         velocityMaterial.uniforms.uVelocity.value = currentVelRef.current.texture
// //         velocityMaterial.uniforms.uMouse.value.copy(mouse3D.current)
// //         velocityMaterial.uniforms.uDelta.value = dt

// //         simMesh.material = velocityMaterial
// //         gl.setRenderTarget(nextVelRef.current)
// //         gl.render(simScene, simCamera)

// //         // Position pass
// //         positionMaterial.uniforms.uPosition.value = currentPosRef.current.texture
// //         positionMaterial.uniforms.uVelocity.value = nextVelRef.current.texture
// //         positionMaterial.uniforms.uDelta.value = dt

// //         simMesh.material = positionMaterial
// //         gl.setRenderTarget(nextPosRef.current)
// //         gl.render(simScene, simCamera)
// //         gl.setRenderTarget(null)

// //             // Ping-pong
// //             ;[currentPosRef.current, nextPosRef.current] = [nextPosRef.current, currentPosRef.current]
// //             ;[currentVelRef.current, nextVelRef.current] = [nextVelRef.current, currentVelRef.current]

// //         // Update visible points
// //         if (pointsRef.current && pointsMaterial.uniforms.positionTexture) {
// //             pointsMaterial.uniforms.positionTexture.value = currentPosRef.current.texture
// //         }
// //     })

// //     return (
// //         <>
// //             {/* Hidden simulation plane */}
// //             <mesh ref={simMeshRef} geometry={simGeometry} visible={true} />

// //             {/* Visible particles */}
// //             <points ref={pointsRef} geometry={pointsGeometry} material={pointsMaterial} />
// //         </>
// //     )
// // }