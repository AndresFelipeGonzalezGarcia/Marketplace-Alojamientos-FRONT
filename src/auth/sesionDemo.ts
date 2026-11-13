import type { RolUsuario, Sesion } from './sesion'

// Sesiones simuladas para ver las pantallas sin backend.
// Solo en desarrollo y solo si VITE_SESION_DEMO vale exactamente "true":
// en un build de producción `import.meta.env.DEV` es false y todo esto
// queda inactivo aunque la variable esté puesta.

const UNA_HORA_MS = 60 * 60 * 1000

const USUARIOS_DEMO: Record<RolUsuario, { nombre: string; correo: string }> = {
  ANFITRION: {
    nombre: 'Anfitrión de prueba',
    correo: 'anfitrion@demo.invalid',
  },
  HUESPED: { nombre: 'Huésped de prueba', correo: 'huesped@demo.invalid' },
  ADMINISTRADOR: {
    nombre: 'Administrador de prueba',
    correo: 'administrador@demo.invalid',
  },
}

export function modoDemoActivo(): boolean {
  return import.meta.env.DEV && import.meta.env.VITE_SESION_DEMO === 'true'
}

export function crearSesionDemo(rol: RolUsuario, ahora = Date.now()): Sesion {
  const usuario = USUARIOS_DEMO[rol]
  return {
    // No es un token del backend: cualquier petición real responderá 401.
    token: `sesion-demo-${rol.toLowerCase()}`,
    expiraEn: new Date(ahora + UNA_HORA_MS).toISOString(),
    usuario: { id: `demo-${rol.toLowerCase()}`, rol, ...usuario },
  }
}
