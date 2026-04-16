import { useEffect } from "react";

/** Prevent background scroll while an overlay is open (best-effort; restores prior overflow). */
export function useBodyScrollLock(lock: boolean): void {
  useEffect(() => {
    if (!lock || typeof document === "undefined") {
      return;
    }
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = prev;
    };
  }, [lock]);
}
