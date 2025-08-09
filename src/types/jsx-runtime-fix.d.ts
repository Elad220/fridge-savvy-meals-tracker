// Re-export JSX namespace from react to satisfy libraries expecting it in react/jsx-runtime
import type { JSX as ReactJSX } from 'react'

declare module 'react/jsx-runtime' {
  export { JSX } from 'react'
}
