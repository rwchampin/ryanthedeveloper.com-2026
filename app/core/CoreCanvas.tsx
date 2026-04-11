'use client'
import { Canvas } from '@react-three/fiber'
import { CoreCamera } from './CoreCamera'
import { Debugger } from '../debug/Debugger';
export const CoreCanvas = ({ children }: { children: React.ReactNode }) => {
  return (
    <Canvas gl={{ antialias: false }} flat shadows style={{ height: '100vh', width: '100vw' }}>
      {children}
      <CoreCamera type="perspective" position={[0, 0, -1]} fov={35} near={0.1} far={1000} />
        <Debugger />

    </Canvas>
  )
}