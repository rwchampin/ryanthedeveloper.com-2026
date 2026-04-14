'use client'
import { AccumulativeShadows, RandomizedLight, OrbitControls, Environment, useGLTF, useVideoTexture, SpotLight } from '@react-three/drei'
// import { EffectComposer, Bloom, HueSaturation, BrightnessContrast, TiltShift2, WaterEffect, ToneMapping } from '@react-three/postprocessing'
// import { MagicLogo } from '../magic-logo/MagicLogo';
import { useControls, folder } from 'leva';
// import { SandFloor } from '../sand/SandFloor';
import { SolidLogo } from '../magic-logo/SolidLogo';
// import ParticleSwarm from './ParticleSwarm';

export const LandingScene = () => {

    const ambientControls = useControls('Ambient Light', {
      show: true,
        intensity: { value: 0.5, min: 0, max: 1, step: 0.01 },
        color: '#ffffff',
    });

     const spotControls = useControls('Spot Light', {
      show: true,
      position: {
        value: { x: 0.5, y: 2.8, z: -1 },
        step: 0.1,
      },
       angle: { value: 0.53, min: 0, max: Math.PI / 2, step: 0.01 },
       penumbra: { value: 2, min: 0, max: 10, step: 0.1 },
        intensity: { value: 500, min: 0, max: 1000, step: 1 },
        color: '#ffffff',
    });

  return (
    <>
    <color attach="background" args={['#cac4c4']} />
      {/* <fog attach="fog" args={['#353535', 5, 20]} /> */}
      {/* <SandFloor /> */}

      {ambientControls.show &&
      <ambientLight 
        intensity={ambientControls.intensity}
        color={ambientControls.color}
      />
        }
       {
        spotControls.show &&
        <SpotLight
         intensity={spotControls.intensity}
          color={spotControls.color}
            position={[spotControls.position.x, spotControls.position.y, spotControls.position.z]}
            angle={spotControls.angle}
             penumbra={spotControls.penumbra} 
            castShadow />
        }
      <SolidLogo  />
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
      </mesh>*/}
      {/* <Environment preset="city" />  */}
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