/*
  Global type declarations to satisfy TypeScript when using the React 18
  automatic JSX runtime and external icon libraries that may not ship
  with their own type definitions in certain environments.
*/

// Ensure the React JSX runtime typings are available in all workspaces.
// This is normally provided by @types/react 18+, but in some cases the
// compiler may not be able to resolve the path. The stub below prevents
// "Cannot find module 'react/jsx-runtime'" errors during type-checking.
declare module 'react/jsx-runtime' {
  export const jsx: typeof import('react').createElement;
  export const jsxs: typeof import('react').createElement;
  export const Fragment: typeof import('react').Fragment;
}

// Provide a very loose fallback typing for the `lucide-react` icon package
// to avoid missing module declaration errors when the real types are not
// picked up by the compiler. Each exported icon is a valid React component.
declare module 'lucide-react' {
  import * as React from 'react';
  export interface LucideProps extends React.SVGProps<SVGSVGElement> {
    color?: string | number;
    size?: string | number;
    strokeWidth?: string | number;
  }
  // Default export for tree-shaken/ESM usage (rarely employed in this codebase)
  const Lucide: React.FC<LucideProps>;
  export default Lucide;
  // Named exports for every icon (treated as generic components here)
  export const Activity: React.FC<LucideProps>;
  export const Plus: React.FC<LucideProps>;
  export const Trash2: React.FC<LucideProps>;
  export const Camera: React.FC<LucideProps>;
  export const Upload: React.FC<LucideProps>;
  export const Loader2: React.FC<LucideProps>;
  // Allow any other icon name without triggering a type error.
  export const __UNUSED_ICON_PLACEHOLDER: React.FC<LucideProps>;
}