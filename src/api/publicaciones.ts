import { obtenerTokenSesion } from '../auth/sesion'
import { solicitarApi, type ResultadoApi } from './cliente'

const RUTA_PUBLICACIONES = '/api/anfitrion/publicaciones'

export type TipoAlojamiento = 'APARTAMENTO' | 'CASA' | 'HABITACION' | 'CABANA'

export const TIPOS_ALOJAMIENTO: { valor: TipoAlojamiento; etiqueta: string }[] = [
  { valor: 'APARTAMENTO', etiqueta: 'Apartamento' },
  { valor: 'CASA', etiqueta: 'Casa' },
  { valor: 'HABITACION', etiqueta: 'Habitación' },
  { valor: 'CABANA', etiqueta: 'Cabaña' },
]

export type ModoReserva = 'INMEDIATA' | 'CON_APROBACION'

export interface ServicioAdicional {
  nombre: string
  costo: number
}

export interface DatosPublicacion {
  politicaCancelacionId: string
  titulo: string
  descripcion: string
  ciudad: string
  ubicacionTextual: string
  tipo: TipoAlojamiento
  capacidad: number
  precioNoche: number
  tarifaLimpieza?: number
  reglas: string
  modoReserva: ModoReserva
  serviciosIds: string[]
  serviciosAdicionales: ServicioAdicional[]
  imagenes: string[]
}

export interface Publicacion extends DatosPublicacion {
  id: string
  estado: string
}

export interface PublicacionResumen {
  id: string
  titulo: string
  ciudad: string
  estado: string
  capacidad: number
  precioNoche: number
}

export type ResultadoPublicacion = ResultadoApi<Publicacion>

function rutaPublicacion(id: string) {
  return `${RUTA_PUBLICACIONES}/${encodeURIComponent(id)}`
}

export function listarPublicaciones() {
  return solicitarApi<PublicacionResumen[]>({
    ruta: RUTA_PUBLICACIONES,
    metodo: 'GET',
    estadoExito: 200,
    token: obtenerTokenSesion(),
  })
}

export function enviarPublicacion(id: string) {
  return solicitarApi<Publicacion>({
    ruta: `${rutaPublicacion(id)}/enviar`,
    metodo: 'POST',
    estadoExito: 200,
    token: obtenerTokenSesion(),
  })
}

export function crearPublicacion(datos: DatosPublicacion) {
  return solicitarApi<Publicacion>({
    ruta: RUTA_PUBLICACIONES,
    metodo: 'POST',
    estadoExito: 201,
    cuerpo: datos,
    token: obtenerTokenSesion(),
  })
}

export function obtenerPublicacion(id: string) {
  return solicitarApi<Publicacion>({
    ruta: rutaPublicacion(id),
    metodo: 'GET',
    estadoExito: 200,
    token: obtenerTokenSesion(),
  })
}

export function actualizarPublicacion(id: string, datos: DatosPublicacion) {
  return solicitarApi<Publicacion>({
    ruta: rutaPublicacion(id),
    metodo: 'PUT',
    estadoExito: 200,
    cuerpo: datos,
    token: obtenerTokenSesion(),
  })
}
