const memoryStore = new Map<string, string>();

declare global {
  interface Window {
    gymDesktop?: {
      getItem: (key: string) => string | null;
      setItem: (key: string, value: string) => void;
      migrate: (raw: string) => unknown;
      validate: (raw: string) => unknown;
      prompt: (message: string, value: string) => string | null;
    };
  }
}

export const persistence = {
  getItem(key: string): string | null {
    if (typeof window === 'undefined') return null;

    if (window.gymDesktop) {
      const saved = window.gymDesktop.getItem(key);
      if (saved !== null) return saved;
      try {
        const legacy = localStorage.getItem(key);
        if (legacy && key === 'gymtracker_windows_data_v1') {
          window.gymDesktop.migrate(legacy);
          return window.gymDesktop.getItem(key);
        }
        return legacy;
      } catch {
        return memoryStore.get(key) ?? null;
      }
    }

    try {
      const val = localStorage.getItem(key);
      return val !== null ? val : (memoryStore.get(key) ?? null);
    } catch {
      return memoryStore.get(key) ?? null;
    }
  },

  setItem(key: string, value: string): void {
    if (typeof window === 'undefined') return;

    if (window.gymDesktop) {
      window.gymDesktop.setItem(key, value);
      try {
        localStorage.setItem(key, value);
      } catch {
        /* Desktop authoritative */
      }
      return;
    }

    try {
      localStorage.setItem(key, value);
    } catch {
      memoryStore.set(key, value);
    }
  },
};

if (typeof window !== 'undefined' && window.gymDesktop) {
  window.prompt = (message = '', value = '') => window.gymDesktop!.prompt(message, value);
}
