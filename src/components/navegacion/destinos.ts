import { matchPath } from 'react-router'
import type { RolUsuario } from '../../auth/sesion'

export interface Destino {
  etiqueta: string
  ruta: string
  descripcion: string
  // Texto del botón en las tarjetas del inicio.
  accion: string
  // false mientras la pantalla real no exista: se muestra «Próximamente».
  disponible: boolean
  // Rutas en las que esta sección se marca como activa.
  activaEn: string[]
}

export const INICIO: Destino = {
  etiqueta: 'Inicio',
  ruta: '/',
  descripcion: 'Página principal del marketplace.',
  accion: 'Ir al inicio',
  disponible: true,
  activaEn: ['/'],
}

export const CREAR_CUENTA: Destino = {
  etiqueta: 'Crear cuenta',
  ruta: '/registro',
  descripcion:
    'Regístrate como huésped para reservar o como anfitrión para publicar tus alojamientos.',
  accion: 'Registrarme',
  disponible: true,
  activaEn: ['/registro'],
}

export const INICIAR_SESION: Destino = {
  etiqueta: 'Iniciar sesión',
  ruta: '/login',
  descripcion: '¿Ya tienes cuenta? Entra con tu correo y contraseña.',
  accion: 'Entrar',
  disponible: true,
  activaEn: ['/login'],
}

export const MIS_PUBLICACIONES: Destino = {
  etiqueta: 'Mis publicaciones',
  ruta: '/publicaciones',
  descripcion:
    'Consulta tus alojamientos, edítalos y gestiona su disponibilidad.',
  accion: 'Ver mis publicaciones',
  disponible: false,
  activaEn: [
    '/publicaciones',
    '/publicaciones/:id/editar',
    '/publicaciones/:id/disponibilidad',
  ],
}

export const NUEVA_PUBLICACION: Destino = {
  etiqueta: 'Nueva publicación',
  ruta: '/publicaciones/nueva',
  descripcion:
    'Crea un borrador con los datos, fotos y condiciones de tu alojamiento.',
  accion: 'Crear publicación',
  disponible: true,
  activaEn: ['/publicaciones/nueva'],
}

export const PUBLICACIONES_PENDIENTES: Destino = {
  etiqueta: 'Publicaciones pendientes',
  ruta: '/admin',
  descripcion: 'Revisa y aprueba las publicaciones enviadas por anfitriones.',
  accion: 'Revisar pendientes',
  disponible: false,
  activaEn: ['/admin/*'],
}

const SECCIONES_POR_ROL: Record<RolUsuario, Destino[]> = {
  HUESPED: [],
  ANFITRION: [MIS_PUBLICACIONES, NUEVA_PUBLICACION],
  ADMINISTRADOR: [PUBLICACIONES_PENDIENTES],
}

// Secciones del menú principal (además de Inicio) para un rol.
export function seccionesDelRol(rol: RolUsuario | null): Destino[] {
  return rol ? SECCIONES_POR_ROL[rol] : []
}

export function estaActivo(destino: Destino, ruta: string): boolean {
  return destino.activaEn.some(
    (patron) => matchPath({ path: patron, end: true }, ruta) !== null,
  )
}

// Pantalla principal de cada rol. Mientras esa pantalla no exista,
// el rol aterriza en el inicio, que ya muestra sus accesos.
const PRINCIPAL_POR_ROL: Record<RolUsuario, Destino> = {
  HUESPED: INICIO,
  ANFITRION: MIS_PUBLICACIONES,
  ADMINISTRADOR: PUBLICACIONES_PENDIENTES,
}

export function inicioDelRol(rol: RolUsuario): string {
  const principal = PRINCIPAL_POR_ROL[rol]
  return principal.disponible ? principal.ruta : INICIO.ruta
}
