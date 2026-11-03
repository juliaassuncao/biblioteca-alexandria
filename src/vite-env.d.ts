/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_BONES_URL?: string;
  readonly VITE_CUSTODE_URL?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
