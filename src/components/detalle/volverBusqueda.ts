import type { EstadoVolverBusqueda } from '../busqueda/BusquedaAlojamientos'

// Volver a la búsqueda
export function rutaVolverBusqueda(estado: unknown): string {
  const desde = (estado as EstadoVolverBusqueda | null)?.desde
  const valido =
    typeof desde === 'string' && (desde === '' || desde.startsWith('?'))
  return `/alojamientos${valido ? desde : ''}`
}
