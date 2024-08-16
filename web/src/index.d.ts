// passing suppressHydrationWarning to Moment fails type checking
declare namespace JSX {
  interface IntrinsicAttributes {
    suppressHydrationWarning?: boolean;
  }
}
