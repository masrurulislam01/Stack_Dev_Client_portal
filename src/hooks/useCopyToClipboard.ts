import {useCallback, useEffect, useRef, useState} from 'react';

export function useCopyToClipboard<K extends string = string>(resetDelayMs = 2000) {
  const [copiedKey, setCopiedKey] = useState<K | null>(null);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    return () => {
      if (timerRef.current) {
        clearTimeout(timerRef.current);
      }
    };
  }, []);

  const copy = useCallback(
    async (text: string, key = 'default' as K): Promise<boolean> => {
      try {
        await navigator.clipboard.writeText(text);
        setCopiedKey(key);
        if (timerRef.current) {
          clearTimeout(timerRef.current);
        }
        timerRef.current = setTimeout(() => {
          setCopiedKey(null);
          timerRef.current = null;
        }, resetDelayMs);
        return true;
      } catch {
        return false;
      }
    },
    [resetDelayMs],
  );

  return {copiedKey, copy};
}
