'use client'
import { AccumulativeShadows, RandomizedLight, OrbitControls, Environment, useGLTF, useVideoTexture } from '@react-three/drei'
import { EffectComposer, Bloom, HueSaturation, BrightnessContrast, TiltShift2, WaterEffect, ToneMapping } from '@react-three/postprocessing'
import { MagicLogo } from '../magic-logo/MagicLogo';
import { useControls } from 'leva';
// import ParticleSwarm from './ParticleSwarm';

export const LandingScene = () => {
    // const controls:any = useControls("Landing Scene", {
        
    //     "Lights": {
    //         Ambient: {
    //             show: true,
    //             intensity: 24,
    //             color: '#ffffff',
    //         },
    //     }
    // }
    // );

  return (
    <>
    {/* <color attach="background" args={['#353535']} /> */}
      {/* <fog attach="fog" args={['#353535', 5, 20]} /> */}
      {/* <ambientLight intensity={controls.Lights.Ambient.intensity} color={controls.Lights.Ambient.color} /> */}
        <MagicLogo />
        {/* <ParticleSwarm /> */}
      {/* <AccumulativeShadows receiveShadow temporal frames={100} opacity={0.8} alphaTest={0.9} scale={12} position={[0, -0.5, 0]}>
        <RandomizedLight radius={4} ambient={0.5} position={[5, 8, -10]} bias={0.001} />
      </AccumulativeShadows> */}
      {/* <mesh castShadow position={[-1.5, -0.245, 1]}>
        <sphereGeometry args={[0.25, 64, 64]} />
        <meshStandardMaterial color="#353535" />
      </mesh> */}
      {/* <mesh castShadow position={[1.5, -0.24, 1]} rotation={[0, Math.PI / 4, 0]}>
        <boxGeometry args={[0.5, 0.5, 0.5]} />
        <meshStandardMaterial color="#353535" />
      </mesh>
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.51, 0]} scale={100}>
        <planeGeometry />
        <meshLambertMaterial color="#353535" />
      </mesh>
      <Environment preset="city" /> */}
      {/* <Postpro /> */}
    </>
  );
}

// function Postpro() {
//   return (
//     <EffectComposer disableNormalPass>
//       <HueSaturation saturation={-1} />
//       <BrightnessContrast brightness={0} contrast={0.25} />
//       <WaterEffect factor={0.75} />
//       <TiltShift2 samples={6} blur={0.5} />
//       <Bloom mipmapBlur luminanceThreshold={0} intensity={30} />
//       <ToneMapping />
//     </EffectComposer>
//   )
// }