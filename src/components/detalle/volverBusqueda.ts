import type { EstadoVolverBusqueda } from '../busqueda/BusquedaAlojamientos'

// La búsqueda deja en el estado de navegación su cadena de consulta para que
// el detalle vuelva a los mismos filtros. Solo se acepta una cadena de
// consulta, nunca otra ruta: el estado puede venir de cualquier enlace.
export function rutaVolverBusqueda(estado: unknown): string {
  const desde = (estado as EstadoVolverBusqueda | null)?.desde
  const valido =
    typeof desde === 'string' && (desde === '' || desde.startsWith('?'))
  return `/alojamientos${valido ? desde : ''}`
}
