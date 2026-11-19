import { useLocation, useSearchParams } from 'react-router'
import { contarNoches, esFechaValida } from '../busqueda/filtrosBusqueda'
import { hoyEnBogota } from '../disponibilidad/validacionPeriodo'

// Estadía elegida en el detalle. La URL es la fuente de verdad, como en la
// búsqueda: `?llegada=&salida=` (salida exclusiva) llega desde los filtros,
// la escribe el calendario y la leerá la cotización con useEstadia(), sin
// pasar nada por props. Así también sobrevive a recargar o compartir.

export interface Estadia {
  llegada: string
  // Exclusiva: es el día en que se sale, esa noche no se cuenta.
  salida: string
  noches: number
}

// Lo que el detalle guarda en el estado de navegación: la búsqueda de la que
// se vino (para volver) y, si las fechas de esa búsqueda ya no estaban
// libres aquí, cuáles eran (para avisarlo).
interface EstadoNavegacion {
  desde?: string
  fechasDescartadas?: { llegada: string; salida: string }
}

// Solo vale un rango completo, con al menos una noche y que no empiece en
// el pasado; cualquier otra cosa (un enlace editado a mano) se ignora.
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

  // Reemplaza la entrada del historial: «atrás» no recorre cada clic del
  // calendario. Conserva el resto de la URL (huéspedes) y la búsqueda de la
  // que se vino.
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
    const anterior = (location.state as EstadoNavegacion | null) ?? {}
    const estado: EstadoNavegacion = { desde: anterior.desde }
    if (descartadas) estado.fechasDescartadas = descartadas
    setParametros(siguientes, { replace: true, state: estado })
  }

  return {
    estadia,
    // Las fechas con que se llegó y que ya no estaban libres, o null.
    fechasDescartadas: leerDescartadas(location.state),
    elegir: (llegada: string, salida: string) => escribir({ llegada, salida }),
    limpiar: () => escribir(null),
    // Quita una estadía que ya no está libre y recuerda cuál era.
    descartar: (actual: Estadia) =>
      escribir(null, { llegada: actual.llegada, salida: actual.salida }),
  }
}
