import { useState, useCallback, useRef } from 'react';

// Simple toast context inline
let _addToast = null;
export function registerToast(fn) { _addToast = fn; }
export function toast(msg, type = 'info') { _addToast?.(msg, type); }

export function useToast() {
  const [toasts, setToasts] = useState([]);
  const idRef = useRef(0);
  const add = useCallback((msg, type = 'info') => {
    const id = ++idRef.current;
    setToasts(t => [...t, { id, msg, type }]);
    setTimeout(() => setToasts(t => t.filter(x => x.id !== id)), 3500);
  }, []);
  registerToast(add);
  return toasts;
}
