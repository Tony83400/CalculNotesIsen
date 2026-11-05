// A synchronous generation barrier prevents old requests and mounted screens from
// publishing data after logout, account change, or curriculum change.
let generation = 0;
const listeners = new Set<() => void>();
export const getDataGeneration = () => generation;
export const subscribeDataScope = (listener: () => void) => {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
};
export function invalidateDataScope() {
  generation++;
  listeners.forEach((f) => f());
}
export function assertCurrent(g: number, signal?: AbortSignal) {
  if (g !== generation || signal?.aborted)
    throw Object.assign(new Error("Requête annulée"), { name: "AbortError" });
}
