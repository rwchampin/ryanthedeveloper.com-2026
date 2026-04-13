import { useControls } from 'leva';
import { useDebugMode } from './useDebugMode';

export const useDebugControls = (
    name = "Debug Mode",
    debugValues:any = {}) => {
    const debugMode = useDebugMode();

    const controls = debugMode
        ? useControls(name, debugValues)
        : debugValues;

    return controls;
}