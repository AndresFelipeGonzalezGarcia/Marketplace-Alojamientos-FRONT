import type { MotivoCierre, RolUsuario } from './sesion'

export const ETIQUETA_ROL: Record<RolUsuario, string> = {
  HUESPED: 'Huésped',
  ANFITRION: 'Anfitrión',
  ADMINISTRADOR: 'Administrador',
}

// Estado que RutaProtegida deja en la navegación hacia /login.
export interface EstadoRedireccionLogin {
  desde?: string
  motivo?: MotivoCierre
}

export function leerEstadoRedireccion(estado: unknown): EstadoRedireccionLogin {
  const posible = estado as EstadoRedireccionLogin | null
  return {
    desde:
      typeof posible?.desde === 'string' && posible.desde.startsWith('/')
        ? posible.desde
        : undefined,
    motivo:
      posible?.motivo === 'expirada' || posible?.motivo === 'manual'
        ? posible.motivo
        : undefined,
  }
}
