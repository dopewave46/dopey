/// <reference types="vite/client" />

interface ImportMetaEnv {
  /** Base URL of the DopeOrca OS API. Defaults to http://localhost:4000/api in dev. */
  readonly VITE_API_URL?: string;
  /** @deprecated pre-Prompt-11 name — kept as a fallback. */
  readonly VITE_API_BASE_URL?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}

declare module "*.module.css" {
  const classes: { readonly [key: string]: string };
  export default classes;
}
