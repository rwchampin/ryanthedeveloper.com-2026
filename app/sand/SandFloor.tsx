"use client"

import { useRef, useMemo } from "react"
import { useFrame, extend, useThree } from "@react-three/fiber"
import { shaderMaterial } from "@react-three/drei"
import * as THREE from "three"

// Custom shader material for fine grain black sand with visible particles
const SandMaterial = shaderMaterial(
    {
        uTime: 0,
        uRippleCenter: new THREE.Vector2(0.5, 0.5),
        uResolution: new THREE.Vector2(1, 1),
    },
    // Vertex shader
    `
    varying vec2 vUv;
    varying vec3 vPosition;
    varying vec3 vNormal;
    varying vec3 vWorldPosition;
    varying float vRippleHeight;
    
    uniform float uTime;
    uniform vec2 uRippleCenter;
    
    float hash(vec2 p) {
      return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453);
    }
    
    float ripple(vec2 uv, vec2 center, float time) {
      float dist = distance(uv, center);
      float rippleFreq = 20.0;
      float rippleDecay = 1.8;
      float ripplePhase = dist * rippleFreq - time * 0.6;
      float rippleAmp = exp(-dist * rippleDecay) * 0.12;
      return sin(ripplePhase) * rippleAmp;
    }
    
    void main() {
      vUv = uv;
      vec3 pos = position;
      
      // Ripple displacement
      float rippleTime = uTime * 0.4;
      float rippleDisp = ripple(uv, uRippleCenter, rippleTime);
      rippleDisp += ripple(uv, uRippleCenter, rippleTime - 1.5) * 0.5;
      rippleDisp += ripple(uv, uRippleCenter, rippleTime - 3.0) * 0.25;
      
      pos.z += rippleDisp;
      vRippleHeight = rippleDisp;
      
      // Calculate normals for lighting
      float delta = 0.004;
      float hL = ripple(uv - vec2(delta, 0.0), uRippleCenter, rippleTime);
      float hR = ripple(uv + vec2(delta, 0.0), uRippleCenter, rippleTime);
      float hD = ripple(uv - vec2(0.0, delta), uRippleCenter, rippleTime);
      float hU = ripple(uv + vec2(0.0, delta), uRippleCenter, rippleTime);
      
      vNormal = normalize(vec3((hL - hR) / (2.0 * delta), (hD - hU) / (2.0 * delta), 1.0));
      vPosition = pos;
      vWorldPosition = (modelMatrix * vec4(pos, 1.0)).xyz;
      
      gl_Position = projectionMatrix * modelViewMatrix * vec4(pos, 1.0);
    }
  `,
    // Fragment shader - focus on visible grain particles
    `
    varying vec2 vUv;
    varying vec3 vPosition;
    varying vec3 vNormal;
    varying vec3 vWorldPosition;
    varying float vRippleHeight;
    
    uniform float uTime;
    uniform vec2 uRippleCenter;
    uniform vec2 uResolution;
    
    // High quality hash
    float hash(vec2 p) {
      vec3 p3 = fract(vec3(p.xyx) * 0.1031);
      p3 += dot(p3, p3.yzx + 33.33);
      return fract((p3.x + p3.y) * p3.z);
    }
    
    vec2 hash2(vec2 p) {
      return vec2(hash(p), hash(p + vec2(127.1, 311.7)));
    }
    
    // Create individual sand grains as bright points
    float sandGrains(vec2 uv, float scale, float threshold) {
      vec2 id = floor(uv * scale);
      vec2 f = fract(uv * scale);
      
      float grains = 0.0;
      
      for(int y = -1; y <= 1; y++) {
        for(int x = -1; x <= 1; x++) {
          vec2 neighbor = vec2(float(x), float(y));
          vec2 cellId = id + neighbor;
          
          // Random position within cell
          vec2 randPos = hash2(cellId);
          
          // Position of grain
          vec2 grainPos = neighbor + randPos - f;
          float dist = length(grainPos);
          
          // Random brightness for each grain
          float brightness = hash(cellId * 1.7);
          
          // Only render grains above threshold (controls density)
          if(brightness > threshold) {
            // Sharp circular grain with soft edge
            float grainSize = 0.08 + brightness * 0.12;
            float grain = smoothstep(grainSize, grainSize * 0.3, dist);
            grains += grain * (brightness - threshold) / (1.0 - threshold);
          }
        }
      }
      
      return grains;
    }
    
    // Sparkle effect - bright twinkling points
    float sparkles(vec2 uv, float time) {
      float sparkle = 0.0;
      
      // Multiple sparkle layers at different densities
      for(float i = 0.0; i < 3.0; i++) {
        float scale = 800.0 + i * 400.0;
        vec2 id = floor(uv * scale);
        vec2 f = fract(uv * scale);
        
        float rand = hash(id + i * 100.0);
        
        // Very sparse sparkles
        if(rand > 0.985) {
          vec2 sparklePos = hash2(id) * 0.6 + 0.2;
          float dist = length(f - sparklePos);
          
          // Animated twinkle
          float twinkleSpeed = 3.0 + rand * 10.0;
          float twinkle = sin(time * twinkleSpeed + rand * 6.283) * 0.5 + 0.5;
          twinkle = pow(twinkle, 6.0); // Sharp on/off
          
          // Point sparkle
          float sp = smoothstep(0.06, 0.0, dist) * twinkle;
          sparkle += sp * (0.5 + rand * 0.5);
        }
      }
      
      return sparkle;
    }
    
    void main() {
      vec2 uv = vUv;
      
      // Deep black base
      vec3 color = vec3(0.005);
      
      // Olive/green tint for sand highlights
      vec3 sandHighlight = vec3(0.18, 0.22, 0.14);
      vec3 sandMid = vec3(0.08, 0.10, 0.06);
      
      // Lighting setup
      vec3 lightDir = normalize(vec3(0.2, 0.6, 0.8));
      vec3 viewDir = normalize(cameraPosition - vWorldPosition);
      vec3 halfDir = normalize(lightDir + viewDir);
      
      // Diffuse and specular from ripple normals
      float diff = max(dot(vNormal, lightDir), 0.0);
      float spec = pow(max(dot(vNormal, halfDir), 0.0), 64.0);
      
      // Ripple phase for ridge highlighting
      float rippleTime = uTime * 0.4;
      float dist = distance(uv, uRippleCenter);
      float ripplePhase = dist * 20.0 - rippleTime * 0.6;
      float rippleWave = sin(ripplePhase) * 0.5 + 0.5;
      float rippleFade = exp(-dist * 1.5);
      float ridgeBrightness = rippleWave * rippleFade;
      
      // Multiple layers of sand grains at different scales for depth
      float grainLayer1 = sandGrains(uv, 600.0, 0.55);  // Dense fine grains
      float grainLayer2 = sandGrains(uv, 400.0, 0.65);  // Medium grains
      float grainLayer3 = sandGrains(uv, 250.0, 0.75);  // Larger scattered grains
      
      // Combine grain layers
      float totalGrains = grainLayer1 * 0.5 + grainLayer2 * 0.35 + grainLayer3 * 0.25;
      
      // Grains are more visible on ripple ridges (light catches them)
      float grainVisibility = 0.3 + ridgeBrightness * 0.7;
      grainVisibility *= (0.5 + diff * 0.5); // Also affected by main lighting
      
      // Apply grains to color
      color += sandMid * totalGrains * grainVisibility * 0.8;
      color += sandHighlight * totalGrains * spec * ridgeBrightness * 0.6;
      
      // Ripple ridge highlights
      color += sandHighlight * pow(ridgeBrightness, 1.5) * diff * 0.3;
      color += vec3(0.15, 0.18, 0.12) * spec * ridgeBrightness * 0.4;
      
      // Fresnel rim on ripples
      float fresnel = pow(1.0 - max(dot(viewDir, vNormal), 0.0), 4.0);
      color += sandHighlight * fresnel * ridgeBrightness * 0.2;
      
      // Sparkles
      float sparkle = sparkles(uv, uTime);
      color += vec3(0.95, 1.0, 0.9) * sparkle * 1.2;
      
      // Extra bright sparkles on ripple ridges
      float ridgeSparkle = sparkles(uv + vec2(0.001), uTime * 1.1);
      color += vec3(1.0, 1.0, 0.95) * ridgeSparkle * ridgeBrightness * 0.8;
      
      // Subtle overall grain texture (very fine noise)
      float microGrain = hash(floor(uv * 2000.0));
      color += sandMid * microGrain * 0.03 * grainVisibility;
      
      // Vignette - darker at edges
      float vignette = 1.0 - smoothstep(0.25, 0.7, distance(uv, vec2(0.5, 0.45)));
      color *= 0.5 + vignette * 0.5;
      
      // Edge fade
      float edgeFade = smoothstep(0.0, 0.15, uv.y) * smoothstep(1.0, 0.85, uv.y);
      edgeFade *= smoothstep(0.0, 0.1, uv.x) * smoothstep(1.0, 0.9, uv.x);
      color *= edgeFade;
      
      gl_FragColor = vec4(color, 1.0);
    }
  `
)

extend({ SandMaterial })

declare global {
    namespace JSX {
        interface IntrinsicElements {
            sandMaterial: React.DetailedHTMLProps<
                React.HTMLAttributes<HTMLElement> & {
                    uTime?: number
                    uRippleCenter?: THREE.Vector2
                    uResolution?: THREE.Vector2
                },
                HTMLElement
            >
        }
    }
}

export function SandFloor() {
    const materialRef = useRef<THREE.ShaderMaterial>(null)
    const { size } = useThree()

    const rippleCenter = useMemo(() => new THREE.Vector2(0.5, 0.5), [])
    const resolution = useMemo(() => new THREE.Vector2(size.width, size.height), [size])

    useFrame((state) => {
        if (materialRef.current) {
            materialRef.current.uniforms.uTime.value = state.clock.elapsedTime
            materialRef.current.uniforms.uResolution.value = resolution
        }
    })

    return (
        <mesh rotation={[-Math.PI / 2.3, 0, 0]} position={[0, -0.8, 0.5]}>
            <planeGeometry args={[14, 14, 512, 512]} />
            <sandMaterial
                ref={materialRef}
                uTime={0}
                uRippleCenter={rippleCenter}
                uResolution={resolution}
            />
        </mesh>
    )
}
