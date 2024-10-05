import { useEffect, useState } from "react";

let now = new Date();
const listeners: Set<() => void> = new Set();

export function useNow() {
  const [nowState, setNowState] = useState(now);
  useEffect(() => {
    const listener = () => {
      setNowState(now);
    };
    listeners.add(listener);
    return () => {
      listeners.delete(listener);
    };
  }, []);
  return nowState;
}

export function tick() {
  now = new Date();
  listeners.forEach((listener) => listener());
}
