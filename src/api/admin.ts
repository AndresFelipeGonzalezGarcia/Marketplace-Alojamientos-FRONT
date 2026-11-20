import { obtenerTokenSesion } from '../auth/sesion'
import { solicitarApi } from './cliente'
import type {
  EstadoPublicacion,
  Publicacion,
  TipoAlojamiento,
} from './publicaciones'

// Endpoints de moderación
const RUTA_ADMIN = '/api/admin/publicaciones'

// Límites del motivo de rechazo
export const MOTIVO_MINIMO = 10
export const MOTIVO_MAXIMO = 500

// Fila de la bandeja
export interface PublicacionRevision {
  id: string
  titulo: string
  ciudad: string
  tipo: TipoAlojamiento
  capacidad: number
  precioNoche: number
  estado: EstadoPublicacion
  anfitrionId: string
  anfitrionNombre: string
  fechaEnvio: string
  imagenPortada?: string | null
}

function rutaPublicacion(id: string) {
  return `${RUTA_ADMIN}/${encodeURIComponent(id)}`
}

// Publicaciones pendientes
export function listarPendientes() {
  return solicitarApi<PublicacionRevision[]>({
    ruta: RUTA_ADMIN,
    metodo: 'GET',
    estadoExito: 200,
    token: obtenerTokenSesion(),
  })
}

export function obtenerPublicacionRevision(id: string) {
  return solicitarApi<Publicacion>({
    ruta: rutaPublicacion(id),
    metodo: 'GET',
    estadoExito: 200,
    token: obtenerTokenSesion(),
  })
}

export function aprobarPublicacion(id: string) {
  return solicitarApi<Publicacion>({
    ruta: `${rutaPublicacion(id)}/aprobar`,
    metodo: 'POST',
    estadoExito: 200,
    token: obtenerTokenSesion(),
  })
}

export function rechazarPublicacion(id: string, motivo: string) {
  return solicitarApi<Publicacion>({
    ruta: `${rutaPublicacion(id)}/rechazar`,
    metodo: 'POST',
    estadoExito: 200,
    cuerpo: { motivo },
    token: obtenerTokenSesion(),
  })
}

// Orden por fecha de envío
export function ordenarPorEnvio(publicaciones: PublicacionRevision[]) {
  return [...publicaciones].sort(
    (a, b) => Date.parse(a.fechaEnvio) - Date.parse(b.fechaEnvio),
  )
}
