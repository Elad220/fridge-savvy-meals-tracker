// Provide a JSX namespace in react/jsx-runtime for libraries expecting it
import type * as React from 'react'

declare module 'react/jsx-runtime' {
  // Declarations inside module augmentation are exported by default
  export namespace JSX {
    // Map to React 18 JSX types
    type Element = React.JSX.Element
    interface ElementChildrenAttribute extends React.JSX.ElementChildrenAttribute {}
    interface IntrinsicAttributes extends React.JSX.IntrinsicAttributes {}
    interface IntrinsicClassAttributes<T> extends React.JSX.IntrinsicClassAttributes<T> {}
    type LibraryManagedAttributes<C, P> = React.JSX.LibraryManagedAttributes<C, P>
    interface IntrinsicElements extends React.JSX.IntrinsicElements {}
  }
}
