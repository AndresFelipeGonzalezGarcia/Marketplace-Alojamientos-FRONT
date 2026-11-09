import type { Rol } from '../api/registro'

// Único punto de lectura de la sesión. Provisional hasta HU-02 (login).
const CLAVE_TOKEN = 'marketplace.token'

export function obtenerTokenSesion(): string | null {
  try {
    return localStorage.getItem(CLAVE_TOKEN)
  } catch {
    return null
  }
}

// Sin login todavía no se conoce el rol. HU-02 debe devolverlo aquí.
export function obtenerRolSesion(): Rol | null {
  return null
}
