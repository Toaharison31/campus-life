import { useCallback, useEffect, useRef, useState } from "react";
import { readData, writeData } from "../services/storage";

export function useLocalStorage(key, collection) {
  const [stored, setStored] = useState(() => readData(key, collection));
  const storedRef = useRef(stored);

  useEffect(() => {
    if (storedRef.current.persist) {
      writeData(key, storedRef.current.value);
    }
  }, [key, stored]);

  const setValue = useCallback(
    (update) => {
      const value =
        typeof update === "function" ? update(storedRef.current.value) : update;
      const next = { value, persist: false };
      storedRef.current = next;
      setStored(next);
      return writeData(key, value);
    },
    [key],
  );

  return [stored.value, setValue];
}
