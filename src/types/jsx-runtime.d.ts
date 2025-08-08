// TypeScript compatibility shim for libraries importing `JSX` from 'react/jsx-runtime'.
// This re-exports the global JSX namespace so type-only imports work without enabling skipLibCheck.

declare module 'react/jsx-runtime' {
  // Alias the global JSX namespace
  export import JSX = global.JSX;
}
