// passing suppressHydrationWarning to Moment fails type checking
declare module JSX {
  interface IntrinsicAttributes {
    suppressHydrationWarning?: boolean;
  }
}
