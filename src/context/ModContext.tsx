import React, { createContext, useCallback, useContext, useEffect, useState } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';

export type Mod = 'bilirkisi' | 'avukat';
const STORAGE_KEY = 'app_mod';

interface ModCtx {
  mod: Mod | null;
  setMod: (m: Mod) => Promise<void>;
  modLoaded: boolean;
}

const ModContext = createContext<ModCtx>({ mod: null, setMod: async () => {}, modLoaded: false });

export function ModProvider({ children }: { children: React.ReactNode }) {
  const [mod, setModState] = useState<Mod | null>(null);
  const [modLoaded, setModLoaded] = useState(false);

  useEffect(() => {
    AsyncStorage.getItem(STORAGE_KEY).then(v => {
      if (v === 'bilirkisi' || v === 'avukat') setModState(v as Mod);
      setModLoaded(true);
    });
  }, []);

  const setMod = useCallback(async (m: Mod) => {
    await AsyncStorage.setItem(STORAGE_KEY, m);
    setModState(m);
  }, []);

  return (
    <ModContext.Provider value={{ mod, setMod, modLoaded }}>
      {children}
    </ModContext.Provider>
  );
}

export function useMod(): ModCtx {
  return useContext(ModContext);
}
