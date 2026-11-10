import {useCallback, useState} from 'react';

export function useStoredState(key, initialValue) {
  const getInitialValue = () => typeof initialValue === 'function' ? initialValue() : initialValue;
  const [value, setValue] = useState(() => {
    try {
      return JSON.parse(localStorage.getItem(key)) ?? getInitialValue();
    } catch {
      return getInitialValue();
    }
  });

  const persist = useCallback(nextValue => {
    setValue(currentValue => {
      const resolvedValue = typeof nextValue === 'function' ? nextValue(currentValue) : nextValue;
      try {
        localStorage.setItem(key, JSON.stringify(resolvedValue));
      } catch {}
      return resolvedValue;
    });
  }, [key]);

  const reset = useCallback(() => {
    try {
      localStorage.removeItem(key);
    } catch {}
    setValue(getInitialValue());
  }, [key]);

  return [value, persist, reset];
}
