/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_API_URL?: string
  // Solo para desarrollo: habilita las sesiones simuladas del login.
  readonly VITE_SESION_DEMO?: string
}

interface ImportMeta {
  readonly env: ImportMetaEnv
}
