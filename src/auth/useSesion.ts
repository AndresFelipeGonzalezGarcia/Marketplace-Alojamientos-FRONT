import { useSyncExternalStore } from 'react'
import { obtenerSesion, suscribirSesion, type Sesion } from './sesion'

// Sesión vigente
export function useSesion(): Sesion | null {
  return useSyncExternalStore(suscribirSesion, obtenerSesion, () => null)
}
