/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_API_URL?: string
  // Sesión de prueba
  readonly VITE_SESION_DEMO?: string
}

interface ImportMeta {
  readonly env: ImportMetaEnv
}
