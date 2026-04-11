import { useGLTF } from '@react-three/drei'
import { useMemo } from 'react'

/**
 * Hook to load and retrieve a 3D model node from a GLTF/GLB file.
 * @param url - The URL path to the 3D model file
 * @param key - The node key to retrieve from the model (default: 'Scene')
 * @returns The requested 3D model node, or undefined if not found
 */
export const use3dFile = (
    url: string,
    key: string = 'Scene'
) => {
    const { nodes } = useGLTF(url) as any & { nodes: Record<string, any> }

    return useMemo(() => {
        if (!nodes || !nodes[key]) {
            console.warn(`3D model node "${key}" not found in ${url}`)
            return undefined
        }
        return nodes[key]
    }, [nodes, key, url])
}

/**
 * Preload a 3D model file for faster loading.
 * @param url - The URL path to the 3D model file
 */
export const preload3dFile = (url: string) => {
    useGLTF.preload(url)
}

