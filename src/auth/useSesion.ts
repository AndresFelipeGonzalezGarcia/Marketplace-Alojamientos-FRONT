import { useSyncExternalStore } from 'react'
import { obtenerSesion, suscribirSesion, type Sesion } from './sesion'

// Sesión vigente o null. El componente se vuelve a pintar al entrar,
// al salir, al vencer el token o cuando otra pestaña cambia la sesión.
export function useSesion(): Sesion | null {
  return useSyncExternalStore(suscribirSesion, obtenerSesion, () => null)
}
