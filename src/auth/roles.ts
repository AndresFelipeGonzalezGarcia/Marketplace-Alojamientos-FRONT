import type { MotivoCierre, RolUsuario } from './sesion'

export const ETIQUETA_ROL: Record<RolUsuario, string> = {
  HUESPED: 'Huésped',
  ANFITRION: 'Anfitrión',
  ADMINISTRADOR: 'Administrador',
}

// Estado de navegación al login
export interface EstadoRedireccionLogin {
  desde?: string
  motivo?: MotivoCierre
  // Aviso de contraseña restablecida
  aviso?: 'contrasena-restablecida'
}

export function leerEstadoRedireccion(estado: unknown): EstadoRedireccionLogin {
  const posible = estado as EstadoRedireccionLogin | null
  return {
    aviso:
      posible?.aviso === 'contrasena-restablecida' ? posible.aviso : undefined,
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
