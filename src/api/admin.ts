import { obtenerTokenSesion } from '../auth/sesion'
import { solicitarApi } from './cliente'
import type {
  EstadoPublicacion,
  Publicacion,
  TipoAlojamiento,
} from './publicaciones'

// Endpoints de moderación. En docs/contrato-api-marketplace.yaml están
// marcados como PROPUESTA: el backend aún no los implementa.
const RUTA_ADMIN = '/api/admin/publicaciones'

// Límites de RechazoRequest.motivo en el contrato.
export const MOTIVO_MINIMO = 10
export const MOTIVO_MAXIMO = 500

// PublicacionRevision del contrato: una fila de la bandeja.
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

// Sin `estado`, el backend devuelve las PENDIENTE_REVISION, la más antigua primero.
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

// La lista llega ordenada del backend; se reordena por si acaso, ya que
// atender por orden de llegada es la regla de la bandeja.
export function ordenarPorEnvio(publicaciones: PublicacionRevision[]) {
  return [...publicaciones].sort(
    (a, b) => Date.parse(a.fechaEnvio) - Date.parse(b.fechaEnvio),
  )
}
