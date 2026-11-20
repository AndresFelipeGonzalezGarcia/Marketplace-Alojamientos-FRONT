import { useLocation, useSearchParams } from 'react-router'
import {
  contarNoches,
  esFechaValida,
  MAXIMO_HUESPEDES,
} from '../busqueda/filtrosBusqueda'
import { hoyEnBogota } from '../disponibilidad/validacionPeriodo'

// Estadía

export interface Estadia {
  llegada: string
  // Fecha de salida
  salida: string
  noches: number
}

// Estado de navegación
interface EstadoNavegacion {
  desde?: string
  fechasDescartadas?: { llegada: string; salida: string }
}

// Leer fechas
export function leerEstadia(
  parametros: URLSearchParams,
  hoy = hoyEnBogota(),
): Estadia | null {
  const llegada = parametros.get('llegada') ?? ''
  const salida = parametros.get('salida') ?? ''
  if (!esFechaValida(llegada) || !esFechaValida(salida) || llegada < hoy) {
    return null
  }
  const noches = contarNoches(llegada, salida)
  return noches === null ? null : { llegada, salida, noches }
}

// Leer huéspedes
export function leerHuespedes(parametros: URLSearchParams): number | null {
  const valor = parametros.get('huespedes') ?? ''
  if (!/^\d+$/.test(valor)) return null
  const numero = Number(valor)
  return numero >= 1 && numero <= MAXIMO_HUESPEDES ? numero : null
}

function leerDescartadas(estado: unknown) {
  const descartadas = (estado as EstadoNavegacion | null)?.fechasDescartadas
  return descartadas &&
    esFechaValida(descartadas.llegada) &&
    esFechaValida(descartadas.salida)
    ? descartadas
    : null
}

export function useEstadia() {
  const [parametros, setParametros] = useSearchParams()
  const location = useLocation()
  const estadia = leerEstadia(parametros)

  // Cambiar fechas
  function navegar(siguientes: URLSearchParams, estado: EstadoNavegacion) {
    setParametros(siguientes, { replace: true, state: estado })
  }

  const anterior = (location.state as EstadoNavegacion | null) ?? {}

  function escribir(
    nueva: { llegada: string; salida: string } | null,
    descartadas?: { llegada: string; salida: string },
  ) {
    const siguientes = new URLSearchParams(parametros)
    siguientes.delete('llegada')
    siguientes.delete('salida')
    if (nueva) {
      siguientes.set('llegada', nueva.llegada)
      siguientes.set('salida', nueva.salida)
    }
    const estado: EstadoNavegacion = { desde: anterior.desde }
    if (descartadas) estado.fechasDescartadas = descartadas
    navegar(siguientes, estado)
  }

  function elegirHuespedes(huespedes: number) {
    const siguientes = new URLSearchParams(parametros)
    siguientes.set('huespedes', String(huespedes))
    // Cambiar huéspedes
    navegar(siguientes, anterior)
  }

  return {
    estadia,
    // Huéspedes
    huespedes: leerHuespedes(parametros),
    elegirHuespedes,
    // Fechas no disponibles
    fechasDescartadas: leerDescartadas(location.state),
    elegir: (llegada: string, salida: string) => escribir({ llegada, salida }),
    limpiar: () => escribir(null),
    // Quitar estadía
    descartar: (actual: Estadia) =>
      escribir(null, { llegada: actual.llegada, salida: actual.salida }),
  }
}
