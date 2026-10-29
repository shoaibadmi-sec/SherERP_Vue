import { useEffect, useState } from 'react';

/** Keep Save visible unless the on-screen keyboard or a short viewport needs the room. */
export function useActionBarDocking() {
  const [docked, setDocked] = useState(true);
  useEffect(() => {
    const update = () => {
      const visibleHeight = window.visualViewport?.height ?? window.innerHeight;
      const keyboardOpen = window.innerHeight - visibleHeight > 120;
      setDocked(!(keyboardOpen || visibleHeight < 480));
    };
    update();
    window.visualViewport?.addEventListener('resize', update);
    window.addEventListener('resize', update);
    return () => {
      window.visualViewport?.removeEventListener('resize', update);
      window.removeEventListener('resize', update);
    };
  }, []);
  return docked;
}
