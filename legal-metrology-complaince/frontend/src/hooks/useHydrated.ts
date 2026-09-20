import { useEffect, useState } from "react";
import { useAuth } from "../authStore";

export function useHydrated() {
  const [hydrated, setHydrated] = useState(useAuth.persist.hasHydrated());
  useEffect(() => {
    const unsub = useAuth.persist.onFinishHydration(() => setHydrated(true));
    setHydrated(useAuth.persist.hasHydrated());
    return unsub;
  }, []);
  return hydrated;
}
