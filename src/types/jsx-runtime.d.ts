// JSX namespace shim for libraries importing `JSX` from 'react/jsx-runtime'
// Provides a minimal namespace so consumers can reference JSX.Element, etc.
import type * as React from 'react';

declare module 'react/jsx-runtime' {
  export namespace JSX {
    // The element returned by JSX expressions
    type Element = React.ReactElement<any, any>;
    // Class components
    interface ElementClass extends React.Component<any> { render(): any }
    // Allow props via `props`
    interface ElementAttributesProperty { props: {}; }
    // Children prop name
    interface ElementChildrenAttribute { children: {}; }
    // Support React reserved attributes like `key`
    interface IntrinsicAttributes { key?: React.Key }
    // Intrinsic elements (allow any HTML/SVG tag)
    interface IntrinsicElements { [elemName: string]: any }
  }
}
