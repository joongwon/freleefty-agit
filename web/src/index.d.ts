// passing suppressHydrationWarning to Moment fails type checking
declare namespace JSX {
  interface IntrinsicAttributes {
    suppressHydrationWarning?: boolean;
  }
}

declare module "highlightjs-rescript" {
  import { Options } from "rehype-highlight";
  declare const highlightRescript: NonNullable<Options["languages"]>[string];
  export default highlightRescript;
}
