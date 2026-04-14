"use client"

import { useRef, useMemo, useEffect, useCallback } from "react"
import { useFrame, useThree } from "@react-three/fiber"
import * as THREE from "three"

const PARTICLE_COUNT = 150000

const vertexShader = `
  attribute vec3 aTarget;
  attribute float aSize;
  attribute float aBrightness;
  attribute float aSpeed;
  attribute vec3 aOffset;
  attribute float aLife;
  
  uniform float uTime;
  
  varying float vBrightness;
  varying float vLife;
  varying vec3 vPosition;
  
  vec3 mod289(vec3 x) { return x - floor(x * (1.0 / 289.0)) * 289.0; }
  vec4 mod289(vec4 x) { return x - floor(x * (1.0 / 289.0)) * 289.0; }
  vec4 permute(vec4 x) { return mod289(((x*34.0)+1.0)*x); }
  vec4 taylorInvSqrt(vec4 r) { return 1.79284291400159 - 0.85373472095314 * r; }
  
  float snoise(vec3 v) {
    const vec2 C = vec2(1.0/6.0, 1.0/3.0);
    const vec4 D = vec4(0.0, 0.5, 1.0, 2.0);
    vec3 i = floor(v + dot(v, C.yyy));
    vec3 x0 = v - i + dot(i, C.xxx);
    vec3 g = step(x0.yzx, x0.xyz);
    vec3 l = 1.0 - g;
    vec3 i1 = min(g.xyz, l.zxy);
    vec3 i2 = max(g.xyz, l.zxy);
    vec3 x1 = x0 - i1 + C.xxx;
    vec3 x2 = x0 - i2 + C.yyy;
    vec3 x3 = x0 - D.yyy;
    i = mod289(i);
    vec4 p = permute(permute(permute(
      i.z + vec4(0.0, i1.z, i2.z, 1.0))
      + i.y + vec4(0.0, i1.y, i2.y, 1.0))
      + i.x + vec4(0.0, i1.x, i2.x, 1.0));
    float n_ = 0.142857142857;
    vec3 ns = n_ * D.wyz - D.xzx;
    vec4 j = p - 49.0 * floor(p * ns.z * ns.z);
    vec4 x_ = floor(j * ns.z);
    vec4 y_ = floor(j - 7.0 * x_);
    vec4 x = x_ *ns.x + ns.yyyy;
    vec4 y = y_ *ns.x + ns.yyyy;
    vec4 h = 1.0 - abs(x) - abs(y);
    vec4 b0 = vec4(x.xy, y.xy);
    vec4 b1 = vec4(x.zw, y.zw);
    vec4 s0 = floor(b0)*2.0 + 1.0;
    vec4 s1 = floor(b1)*2.0 + 1.0;
    vec4 sh = -step(h, vec4(0.0));
    vec4 a0 = b0.xzyw + s0.xzyw*sh.xxyy;
    vec4 a1 = b1.xzyw + s1.xzyw*sh.zzww;
    vec3 p0 = vec3(a0.xy, h.x);
    vec3 p1 = vec3(a0.zw, h.y);
    vec3 p2 = vec3(a1.xy, h.z);
    vec3 p3 = vec3(a1.zw, h.w);
    vec4 norm = taylorInvSqrt(vec4(dot(p0,p0), dot(p1,p1), dot(p2,p2), dot(p3,p3)));
    p0 *= norm.x;
    p1 *= norm.y;
    p2 *= norm.z;
    p3 *= norm.w;
    vec4 m = max(0.6 - vec4(dot(x0,x0), dot(x1,x1), dot(x2,x2), dot(x3,x3)), 0.0);
    m = m * m;
    return 42.0 * dot(m*m, vec4(dot(p0,x0), dot(p1,x1), dot(p2,x2), dot(p3,x3)));
  }
  
  void main() {
    vec3 target = aTarget;
    
    // Ripple effect from center
    float rippleTime = uTime * 0.6;
    float rippleDist = length(target.xz);
    float ripplePhase = rippleDist * 4.0 - rippleTime;
    float rippleAmp = sin(ripplePhase) * exp(-rippleDist * 0.25) * 0.15;
    rippleAmp += sin(ripplePhase * 0.7 - 1.0) * exp(-rippleDist * 0.3) * 0.08;
    rippleAmp += sin(ripplePhase * 1.3 + 0.5) * exp(-rippleDist * 0.35) * 0.05;
    
    // Base position with ripple
    vec3 pos = target;
    pos.y += rippleAmp;
    
    // Add physics offset (fades based on life)
    float fadeMultiplier = aLife;
    pos += aOffset * fadeMultiplier;
    
    // Subtle ambient noise
    float noiseVal = snoise(vec3(target.xz * 0.5, uTime * 0.1 + aSpeed * 10.0));
    pos.y += noiseVal * 0.01;
    
    vPosition = pos;
    vBrightness = aBrightness;
    vLife = aLife;
    
    vec4 mvPosition = modelViewMatrix * vec4(pos, 1.0);
    
    float sizeAtten = 300.0 / -mvPosition.z;
    gl_PointSize = aSize * sizeAtten;
    gl_PointSize = clamp(gl_PointSize, 0.5, 6.0);
    
    gl_Position = projectionMatrix * mvPosition;
  }
`

const fragmentShader = `
  uniform float uTime;
  
  varying float vBrightness;
  varying float vLife;
  varying vec3 vPosition;
  
  float hash(vec2 p) {
    return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453);
  }
  
  void main() {
    vec2 center = gl_PointCoord - 0.5;
    float dist = length(center);
    if (dist > 0.5) discard;
    
    float alpha = smoothstep(0.5, 0.15, dist);
    
    // Colors
    vec3 baseColor = vec3(0.008, 0.012, 0.006);
    vec3 midColor = vec3(0.04, 0.05, 0.03);
    vec3 highlightColor = vec3(0.14, 0.17, 0.11);
    vec3 sparkleColor = vec3(0.6, 0.65, 0.5);
    
    // Ripple brightness
    float rippleDist = length(vPosition.xz);
    float ripplePhase = rippleDist * 4.0 - uTime * 0.6;
    float rippleVal = sin(ripplePhase);
    float onRidge = smoothstep(-0.2, 0.9, rippleVal) * exp(-rippleDist * 0.2);
    
    float totalBrightness = vBrightness * (0.2 + onRidge * 0.8);
    
    vec3 color = mix(baseColor, midColor, totalBrightness * 0.7);
    color = mix(color, highlightColor, totalBrightness * onRidge * 0.6);
    
    // Sparkles
    float sparkleRand = hash(vPosition.xz * 50.0 + floor(uTime * 4.0));
    float isSparkle = step(0.992, vBrightness * sparkleRand * (0.3 + onRidge * 0.7));
    color = mix(color, sparkleColor, isSparkle);
    
    float twinkle = sin(uTime * 8.0 + vBrightness * 100.0) * 0.5 + 0.5;
    float brightSparkle = step(0.998, vBrightness) * twinkle * onRidge;
    color += sparkleColor * brightSparkle * 0.5;
    
    // Fade during displacement
    float lifeFade = smoothstep(0.0, 0.3, vLife);
    alpha *= lifeFade;
    
    // Distance fade
    float depthFade = smoothstep(12.0, 4.0, length(vPosition));
    color *= depthFade;
    
    float vignette = smoothstep(7.0, 4.0, length(vPosition.xz));
    alpha *= vignette;
    
    gl_FragColor = vec4(color, alpha);
  }
`

export function SandFBO() {
    const { camera, size } = useThree()

    const pointsRef = useRef<THREE.Points>(null)
    const materialRef = useRef<THREE.ShaderMaterial>(null)
    const raycaster = useRef(new THREE.Raycaster())

    // Mouse state
    const mousePos = useRef(new THREE.Vector3(0, -100, 0))
    const lastFrameMousePos = useRef(new THREE.Vector3(0, -100, 0))
    const mouseWorldPos = useRef(new THREE.Vector3(0, -100, 0))

    // Particle physics arrays (CPU-side)
    const particleOffsets = useRef<Float32Array | null>(null)
    const particleVelocities = useRef<Float32Array | null>(null)
    const particleLives = useRef<Float32Array | null>(null)
    const targetPositions = useRef<Float32Array | null>(null)

    // Create geometry
    const geometry = useMemo(() => {
        const geo = new THREE.BufferGeometry()

        const positions = new Float32Array(PARTICLE_COUNT * 3)
        const targets = new Float32Array(PARTICLE_COUNT * 3)
        const sizes = new Float32Array(PARTICLE_COUNT)
        const brightness = new Float32Array(PARTICLE_COUNT)
        const speeds = new Float32Array(PARTICLE_COUNT)
        const offsets = new Float32Array(PARTICLE_COUNT * 3)
        const lives = new Float32Array(PARTICLE_COUNT)

        for (let i = 0; i < PARTICLE_COUNT; i++) {
            const angle = Math.random() * Math.PI * 2
            const r = Math.pow(Math.random(), 0.6) * 6

            const x = Math.cos(angle) * r
            const z = Math.sin(angle) * r
            const y = 0

            positions[i * 3] = x
            positions[i * 3 + 1] = y
            positions[i * 3 + 2] = z

            targets[i * 3] = x
            targets[i * 3 + 1] = y
            targets[i * 3 + 2] = z

            sizes[i] = 1.0 + Math.pow(Math.random(), 2) * 3.0
            brightness[i] = Math.pow(Math.random(), 3)
            speeds[i] = Math.random()

            offsets[i * 3] = 0
            offsets[i * 3 + 1] = 0
            offsets[i * 3 + 2] = 0

            lives[i] = 1.0
        }

        geo.setAttribute('position', new THREE.BufferAttribute(positions, 3))
        geo.setAttribute('aTarget', new THREE.BufferAttribute(targets, 3))
        geo.setAttribute('aSize', new THREE.BufferAttribute(sizes, 1))
        geo.setAttribute('aBrightness', new THREE.BufferAttribute(brightness, 1))
        geo.setAttribute('aSpeed', new THREE.BufferAttribute(speeds, 1))
        geo.setAttribute('aOffset', new THREE.BufferAttribute(offsets, 3))
        geo.setAttribute('aLife', new THREE.BufferAttribute(lives, 1))

        // Store references
        particleOffsets.current = offsets
        particleVelocities.current = new Float32Array(PARTICLE_COUNT * 3)
        particleLives.current = lives
        targetPositions.current = targets

        return geo
    }, [])

    // Shader material
    const material = useMemo(() => {
        const mat = new THREE.ShaderMaterial({
            uniforms: {
                uTime: { value: 0 },
            },
            vertexShader,
            fragmentShader,
            transparent: true,
            depthWrite: false,
            blending: THREE.AdditiveBlending,
        })
        materialRef.current = mat
        return mat
    }, [])

    // Mouse tracking - just update screen coords, raycast in frame loop
    const handleMouseMove = useCallback((event: MouseEvent) => {
        const x = (event.clientX / size.width) * 2 - 1
        const y = -(event.clientY / size.height) * 2 + 1
        mousePos.current.set(x, y, 0)
    }, [size])

    const handleMouseLeave = useCallback(() => {
        mousePos.current.set(0, -100, 0)
        lastFrameMousePos.current.set(0, -100, 0)
        mouseWorldPos.current.set(0, -100, 0)
    }, [])

    useEffect(() => {
        window.addEventListener('mousemove', handleMouseMove)
        window.addEventListener('mouseleave', handleMouseLeave)
        return () => {
            window.removeEventListener('mousemove', handleMouseMove)
            window.removeEventListener('mouseleave', handleMouseLeave)
        }
    }, [handleMouseMove, handleMouseLeave])

    // Physics simulation
    useFrame((state, delta) => {
        if (!material || !particleOffsets.current || !particleVelocities.current || !particleLives.current || !targetPositions.current) return

        material.uniforms.uTime.value = state.clock.elapsedTime

        // Raycast mouse to world space
        if (mousePos.current.y > -50) {
            raycaster.current.setFromCamera(new THREE.Vector2(mousePos.current.x, mousePos.current.y), camera)
            const plane = new THREE.Plane(new THREE.Vector3(0, 1, 0), 0)
            const intersection = new THREE.Vector3()
            if (raycaster.current.ray.intersectPlane(plane, intersection)) {
                mouseWorldPos.current.copy(intersection)
            }
        }

        // Calculate mouse velocity from world positions between frames
        const mouseDelta = new THREE.Vector3().subVectors(mouseWorldPos.current, lastFrameMousePos.current)
        const mouseSpeed = mouseDelta.length() / Math.max(delta, 0.001)
        const mouseDir = mouseDelta.clone().normalize()

        const offsets = particleOffsets.current
        const velocities = particleVelocities.current
        const lives = particleLives.current
        const targets = targetPositions.current

        const mouseX = mouseWorldPos.current.x
        const mouseZ = mouseWorldPos.current.z
        const mouseVelX = mouseDir.x
        const mouseVelZ = mouseDir.z

        const MOUSE_RADIUS = 1.5
        const REPEL_STRENGTH = 80.0
        const FRICTION = 0.96
        const LIFE_DECAY = 0.3
        const MIN_MOUSE_SPEED = 0.2

        const isMouseMoving = mouseSpeed > MIN_MOUSE_SPEED && mouseWorldPos.current.y > -50



        // Update particles
        for (let i = 0; i < PARTICLE_COUNT; i++) {
            const i3 = i * 3

            const targetX = targets[i3]
            const targetZ = targets[i3 + 2]

            // Current offset
            let offsetX = offsets[i3]
            let offsetY = offsets[i3 + 1]
            let offsetZ = offsets[i3 + 2]

            // Current velocity
            let velX = velocities[i3]
            let velY = velocities[i3 + 1]
            let velZ = velocities[i3 + 2]

            // Life
            let life = lives[i]

            // Only apply force if mouse is moving
            if (isMouseMoving) {
                const currentX = targetX + offsetX
                const currentZ = targetZ + offsetZ

                const dx = currentX - mouseX
                const dz = currentZ - mouseZ
                const distSq = dx * dx + dz * dz
                const dist = Math.sqrt(distSq)

                if (dist < MOUSE_RADIUS && dist > 0.001) {
                    // Direction from mouse to particle
                    const dirX = dx / dist
                    const dirZ = dz / dist

                    // Strength based on distance (stronger when closer)
                    const strength = 1.0 - (dist / MOUSE_RADIUS)
                    const strengthCubed = strength * strength * strength

                    // Add velocity in the direction away from mouse
                    // Also add component in mouse direction for more natural push
                    const speedFactor = Math.min(mouseSpeed * 0.05, 2.0)
                    const pushFactor = REPEL_STRENGTH * strengthCubed * speedFactor

                    velX += (dirX * 0.8 + mouseVelX * 0.2) * pushFactor
                    velZ += (dirZ * 0.8 + mouseVelZ * 0.2) * pushFactor
                    velY += strengthCubed * pushFactor * 0.5 // Lift up

                    // Reset life when hit
                    if (life > 0.5) {
                        life = 1.0
                    }
                }
            }

            // Apply velocity to offset
            offsetX += velX * delta
            offsetY += velY * delta
            offsetZ += velZ * delta

            // Friction
            velX *= FRICTION
            velY *= FRICTION
            velZ *= FRICTION

            // Gravity (only if above ground)
            if (offsetY > 0) {
                velY -= 8.0 * delta
            }

            // Ground collision
            if (offsetY < 0) {
                offsetY = 0
                velY = 0
            }

            // Decay life when displaced
            const offsetMag = Math.sqrt(offsetX * offsetX + offsetY * offsetY + offsetZ * offsetZ)
            if (offsetMag > 0.01) {
                life -= LIFE_DECAY * delta
            }

            // Reset when life depleted
            if (life <= 0) {
                offsetX = 0
                offsetY = 0
                offsetZ = 0
                velX = 0
                velY = 0
                velZ = 0
                life = 1.0
            }

            // Store back
            offsets[i3] = offsetX
            offsets[i3 + 1] = offsetY
            offsets[i3 + 2] = offsetZ

            velocities[i3] = velX
            velocities[i3 + 1] = velY
            velocities[i3 + 2] = velZ

            lives[i] = life
        }

        // Update geometry attributes
        const offsetAttr = geometry.getAttribute('aOffset') as THREE.BufferAttribute
        const lifeAttr = geometry.getAttribute('aLife') as THREE.BufferAttribute
        offsetAttr.needsUpdate = true
        lifeAttr.needsUpdate = true

        // Store current world mouse pos for next frame velocity calc
        lastFrameMousePos.current.copy(mouseWorldPos.current)
    })

    return (
        <points ref={pointsRef} geometry={geometry} material={material} />
    )
}
