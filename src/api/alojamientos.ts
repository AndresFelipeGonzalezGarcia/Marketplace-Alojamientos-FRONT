import type { Servicio } from './catalogos'
import { solicitarApi } from './cliente'
import type { ModoReserva, TipoAlojamiento } from './publicaciones'

// Búsqueda pública. En docs/contrato-api-marketplace.yaml está marcada como
// PROPUESTA. No se envía el token: el endpoint es público y un token vencido
// no debe cerrar la sesión de quien solo está mirando.

export const TAMANO_PAGINA = 12

// AlojamientoResumen del contrato.
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

// PaginaAlojamientos del contrato. `pagina` empieza en 0.
export interface PaginaAlojamientos {
  contenido: AlojamientoResumen[]
  pagina: number
  tamano: number
  total: number
  totalPaginas: number
}

// Parámetros de GET /api/alojamientos, ya validados.
export interface ConsultaAlojamientos {
  ciudad?: string
  fechaLlegada?: string
  // Exclusiva: es el día de salida, esa noche no se cuenta.
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
      // style: form, explode: false → serviciosIds=a,b
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

// Catálogo público (GET /api/servicios), para nombrar el filtro de servicios.
export function listarServiciosPublicos() {
  return solicitarApi<Servicio[]>({
    ruta: '/api/servicios',
    metodo: 'GET',
    estadoExito: 200,
  })
}
