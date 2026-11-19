import { Link, useLocation } from 'react-router'
import type { EstadoVolverBusqueda } from '../components/busqueda/BusquedaAlojamientos'
import MensajePantalla from '../components/publicacion/MensajePantalla'

// Solo se acepta una cadena de consulta, nunca otra ruta.
function leerDesde(estado: unknown): string {
  const desde = (estado as EstadoVolverBusqueda | null)?.desde
  return typeof desde === 'string' && (desde === '' || desde.startsWith('?'))
    ? desde
    : ''
}

// Marcador de posición hasta la historia del detalle del alojamiento.
function AlojamientoDetallePage() {
  const location = useLocation()
  const volver = `/alojamientos${leerDesde(location.state)}`

  return (
    <main className="publicacion-pagina">
      <MensajePantalla
        titulo="Detalle del alojamiento"
        mensaje="Muy pronto verás aquí las fotos, la disponibilidad y el precio de tu estadía."
      >
        <p>
          <span className="etiqueta-proximamente">Próximamente</span>
        </p>
        <Link className="boton-enlace" to={volver}>
          Volver a los resultados
        </Link>
      </MensajePantalla>
    </main>
  )
}

export default AlojamientoDetallePage
