import { useEffect, useState } from 'react';

// Keeps fast-changing input (search typing) from firing an effect/request per
// keystroke: the returned value only settles after the source value has been
// stable for delayMs. The caller keeps full control of the raw value.
export function useDebouncedValue<T>(value: T, delayMs = 300): T {
  const [debounced, setDebounced] = useState<T>(value);

  useEffect(() => {
    const timeout = setTimeout(() => setDebounced(value), delayMs);
    return () => clearTimeout(timeout);
  }, [value, delayMs]);

  return debounced;
}
