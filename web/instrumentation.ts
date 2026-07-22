// Next.js instrumentation.ts — runs before the server starts
// Polyfill localStorage for Node.js environments where it exists as an object
// but lacks getItem/setItem methods (Node.js 22+ issue)
export async function register() {
  if (typeof globalThis.localStorage !== 'undefined' && 
      typeof (globalThis.localStorage as any).getItem !== 'function') {
    // Replace the broken localStorage stub with a proper noop implementation
    (globalThis as any).localStorage = {
      getItem: (_key: string) => null,
      setItem: (_key: string, _value: string) => {},
      removeItem: (_key: string) => {},
      clear: () => {},
      key: (_index: number) => null,
      length: 0,
    };
  }
}
