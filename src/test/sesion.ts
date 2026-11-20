import {
  guardarSesion,
  type RolUsuario,
  type Sesion,
  type UsuarioSesion,
} from '../auth/sesion'

const NOMBRES: Record<RolUsuario, string> = {
  HUESPED: 'Hugo Huésped',
  ANFITRION: 'Ana Anfitriona',
  ADMINISTRADOR: 'Adela Admin',
}

interface CambiosSesion {
  token?: string
  expiraEn?: string
  usuario?: Partial<UsuarioSesion>
}

// Sesión de prueba
export function crearSesionDePrueba(
  rol: RolUsuario = 'ANFITRION',
  cambios: CambiosSesion = {},
): Sesion {
  return {
    token: cambios.token ?? `token-${rol.toLowerCase()}`,
    expiraEn:
      cambios.expiraEn ?? new Date(Date.now() + 60 * 60 * 1000).toISOString(),
    usuario: {
      id: `id-${rol.toLowerCase()}`,
      nombre: NOMBRES[rol],
      correo: `${rol.toLowerCase()}@marketplace.test`,
      rol,
      ...cambios.usuario,
    },
  }
}

// Iniciar sesión de prueba
export function iniciarSesionDePrueba(
  rol: RolUsuario = 'ANFITRION',
  cambios: CambiosSesion = {},
): Sesion {
  const sesion = crearSesionDePrueba(rol, cambios)
  guardarSesion(sesion)
  return sesion
}
