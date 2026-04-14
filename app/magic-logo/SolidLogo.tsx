import { use, useRef } from "react";
import { useLogo } from "../hooks/useLogo";
import { useFitToViewport } from "../hooks/useFitToViewport";

export const SolidLogo = () => {
    const ref:any = useRef(null);
    const scene = useLogo();
    useFitToViewport(ref, { padding: 0.8, top: 50 });
    if (!scene) return null;
    return (
            <primitive object={scene} receiveShadow castShadow ref={ref} rotation={[0,0,.25]} />
    );
}