import {
    use3dFile
} from '../hooks/use3dFile';
import { MagicLetter } from './MagicLetter';

const LOGO_URL = '/3d/official-logo.glb';

export const MagicLogo = () => {
    // TODO: Update the use3dFile call to pass the key so the letters var 
    // is returned from the call without an entire new variable declaration
    const logoNode = use3dFile(LOGO_URL);
    const letters = logoNode?.children;

    return (
        <group position={[0, -0.25, 0]} rotation={[0, Math.PI / 4, 0]} scale={0.5}>
            {letters && letters.map((letter:any, index:number) => (
                <MagicLetter key={index} letter={letter} />
            ))}
        </group>
    );
}

