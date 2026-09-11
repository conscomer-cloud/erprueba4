import { useState, useEffect, useCallback } from 'react';

/**
 * useLocalStorage Hook
 * Type-safe hook for persisting and retrieving state from localStorage.
 * Supports functional updates and cross-tab synchronization.
 */
export function useLocalStorage<T>(key: string, initialValue: T): [T, (value: T | ((val: T) => T)) => void] {
  // Read initial value from localStorage or fallback
  const readValue = useCallback((): T => {
    if (typeof window === 'undefined') {
      return initialValue;
    }

    try {
      const item = window.localStorage.getItem(key);
      return item ? (JSON.parse(item) as T) : initialValue;
    } catch (error) {
      console.warn(`[useLocalStorage] Error reading key "${key}":`, error);
      return initialValue;
    }
  }, [key, initialValue]);

  const [storedValue, setStoredValue] = useState<T>(readValue);

  // Return a wrapped version of useState's setter function that persists to localStorage
  const setValue = useCallback(
    (value: T | ((val: T) => T)) => {
      if (typeof window === 'undefined') {
        console.warn(`[useLocalStorage] Tried setting localStorage key "${key}" even though window is not defined`);
        return;
      }

      try {
        setStoredValue((currentValue) => {
          const valueToStore = value instanceof Function ? value(currentValue) : value;
          window.localStorage.setItem(key, JSON.stringify(valueToStore));
          
          // Dispatch custom event to notify other hook instances in the same window
          window.dispatchEvent(
            new CustomEvent('local-storage-change', {
              detail: { key, value: valueToStore },
            })
          );

          return valueToStore;
        });
      } catch (error) {
        console.warn(`[useLocalStorage] Error setting key "${key}":`, error);
      }
    },
    [key]
  );

  // Listen for storage events across tabs or local custom events
  useEffect(() => {
    const handleStorageChange = (e: StorageEvent | CustomEvent) => {
      if ('key' in e && e.key !== key) return;
      if ('detail' in e && (e as CustomEvent).detail?.key !== key) return;
      setStoredValue(readValue());
    };

    window.addEventListener('storage', handleStorageChange as EventListener);
    window.addEventListener('local-storage-change', handleStorageChange as EventListener);

    return () => {
      window.removeEventListener('storage', handleStorageChange as EventListener);
      window.removeEventListener('local-storage-change', handleStorageChange as EventListener);
    };
  }, [key, readValue]);

  return [storedValue, setValue];
}
