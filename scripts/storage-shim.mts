/**
 * A stand-in for `localStorage`, for the one test script that drives the store.
 *
 * `mock/store.ts` is persisted, and `createJSONStorage(() => localStorage)`
 * resolves its backing store once, at import. In node there is none, so zustand
 * decides the storage is unavailable and warns on every `set` — nineteen lines
 * of noise burying the result the script exists to print.
 *
 * Its own module because import order is the whole point: a shim assigned after
 * `import { useStore }` runs too late, no matter where in the file it sits.
 * Nothing ever reads the blob back; this exists to be written to and ignored.
 */
const memory = new Map<string, string>();

(globalThis as unknown as { localStorage: unknown }).localStorage = {
  getItem: (key: string) => memory.get(key) ?? null,
  setItem: (key: string, value: string) => void memory.set(key, value),
  removeItem: (key: string) => void memory.delete(key),
  clear: () => memory.clear(),
  key: () => null,
  get length() {
    return memory.size;
  },
};
