import { use3dFile } from "./use3dFile"

export const useLogo = () => {
    const scene = use3dFile('/3d/official-logo.glb');
    return scene;
}