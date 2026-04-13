'use client'
import { Canvas } from '@react-three/fiber'
import { CoreCamera } from './CoreCamera'
import { Debugger } from '../debug/Debugger';
import MagicMouse from '../magic-mouse/MagicMouse';
export const CoreCanvas = ({ children }: { children: React.ReactNode }) => {
  return (
    <Canvas gl={{ antialias: false }}  shadows style={{ height: '100vh', width: '100vw' }}>
      {children}
      {/* <CoreCamera type="perspective" position={[0, 0, 0]}  near={0.1} far={1000} /> */}
      <MagicMouse />
      <Debugger />
    </Canvas>
  )
}