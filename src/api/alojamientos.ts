import type { PoliticaCancelacion, Servicio } from './catalogos'
import { solicitarApi } from './cliente'
import type {
  ModoReserva,
  ServicioAdicional,
  TipoAlojamiento,
} from './publicaciones'

// Búsqueda pública

export const TAMANO_PAGINA = 12

// Resumen de alojamiento
export interface AlojamientoResumen {
  id: string
  titulo: string
  ciudad: string
  tipo: TipoAlojamiento
  capacidad: number
  precioNoche: number
  imagenPortada?: string | null
  modoReserva: ModoReserva
}

// Página de alojamientos
export interface PaginaAlojamientos {
  contenido: AlojamientoResumen[]
  pagina: number
  tamano: number
  total: number
  totalPaginas: number
}

// Filtros de búsqueda
export interface ConsultaAlojamientos {
  ciudad?: string
  fechaLlegada?: string
  // Fecha de salida
  fechaSalida?: string
  huespedes?: number
  precioMin?: number
  precioMax?: number
  tipo?: TipoAlojamiento
  serviciosIds?: string[]
  pagina?: number
  tamano?: number
}

export function construirConsulta(consulta: ConsultaAlojamientos): string {
  const parametros = new URLSearchParams()
  for (const [clave, valor] of Object.entries(consulta)) {
    if (valor === undefined || valor === '') continue
    if (Array.isArray(valor)) {
      // Servicios separados por coma
      if (valor.length > 0) parametros.set(clave, valor.join(','))
    } else {
      parametros.set(clave, String(valor))
    }
  }
  const texto = parametros.toString()
  return texto ? `?${texto}` : ''
}

export function buscarAlojamientos(consulta: ConsultaAlojamientos) {
  return solicitarApi<PaginaAlojamientos>({
    ruta: `/api/alojamientos${construirConsulta(consulta)}`,
    metodo: 'GET',
    estadoExito: 200,
  })
}

// Catálogo público de servicios
export function listarServiciosPublicos() {
  return solicitarApi<Servicio[]>({
    ruta: '/api/servicios',
    metodo: 'GET',
    estadoExito: 200,
  })
}

// Detalle de alojamiento
export interface AlojamientoDetalle {
  id: string
  titulo: string
  descripcion: string
  ciudad: string
  ubicacionTextual: string
  tipo: TipoAlojamiento
  capacidad: number
  precioNoche: number
  tarifaLimpieza?: number
  reglas?: string
  modoReserva: ModoReserva
  anfitrionNombre: string
  servicios?: Servicio[]
  serviciosAdicionales?: ServicioAdicional[]
  politicaCancelacion?: PoliticaCancelacion
  imagenes?: string[]
}

// Obtener alojamiento
export function obtenerAlojamiento(id: string) {
  return solicitarApi<AlojamientoDetalle>({
    ruta: `/api/alojamientos/${encodeURIComponent(id)}`,
    metodo: 'GET',
    estadoExito: 200,
  })
}

// Día del calendario
export interface DiaCalendario {
  // Fecha
  fecha: string
  disponible: boolean
}

// Máximo de días por consulta
export const MAXIMO_DIAS_CALENDARIO = 365

// Calendario del alojamiento
export function obtenerCalendario(id: string, desde: string, hasta: string) {
  const consulta = new URLSearchParams({ desde, hasta })
  return solicitarApi<DiaCalendario[]>({
    ruta: `/api/alojamientos/${encodeURIComponent(id)}/calendario?${consulta}`,
    metodo: 'GET',
    estadoExito: 200,
  })
}
