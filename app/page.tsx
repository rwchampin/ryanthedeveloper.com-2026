'use client';
import { Leva } from "leva";
import { CoreCanvas } from "./core/CoreCanvas";
import { LandingScene } from "./scenes/LandingScene";
import { useDebugMode } from "./hooks/useDebugMode";

export default function Home() {
  const debugMode = useDebugMode();
  return (
    <>
    <CoreCanvas>
      <LandingScene />
    </CoreCanvas>
     <Leva
                        titleBar={{
                            title: 'Ryan The Developer',
                        }}
                        collapsed={true}
                        hidden={!debugMode}
                    />
                 
                    </>
  );
}
