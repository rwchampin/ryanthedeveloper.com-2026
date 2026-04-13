import { useEffect, useState } from 'react';

export function useDebugMode(): boolean {
  const [isDebugMode, setIsDebugMode] = useState(false);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const updateDebugMode = () => {
        setIsDebugMode(window.location.hash === '#debug');
      };

      updateDebugMode();
      window.addEventListener('hashchange', updateDebugMode);

      return () => {
        window.removeEventListener('hashchange', updateDebugMode);
      };
    }
  }, []);

  return isDebugMode;
}
