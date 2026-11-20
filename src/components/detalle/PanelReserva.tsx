import type { AlojamientoDetalle } from '../../api/alojamientos'
import { formatearPrecio } from '../formato/formato'
import CotizacionEstadia from './CotizacionEstadia'

interface PanelReservaProps {
  alojamiento: AlojamientoDetalle
  onFechasOcupadas: () => void
}

// Lateral fijo al hacer scroll en pantallas anchas; en móvil va al final del
// contenido. El precio por noche es el de la publicación; el total, solo el
// que devuelve la cotización.
function PanelReserva({ alojamiento, onFechasOcupadas }: PanelReservaProps) {
  const { id, titulo, precioNoche, tarifaLimpieza = 0, modoReserva, capacidad } = alojamiento

  return (
    <aside className="panel-reserva" aria-label="Precio y reserva">
      <p className="panel-reserva__precio">
        <strong>{formatearPrecio(precioNoche)}</strong>
        <span> / noche</span>
      </p>
      <ul className="panel-reserva__datos">
        {tarifaLimpieza > 0 && (
          <li>Limpieza: {formatearPrecio(tarifaLimpieza)} por estadía</li>
        )}
        <li>
          {modoReserva === 'INMEDIATA'
            ? 'Reserva inmediata, sin esperar la aprobación del anfitrión.'
            : 'El anfitrión aprueba cada solicitud antes de confirmarla.'}
        </li>
      </ul>
      <CotizacionEstadia
        alojamientoId={id}
        alojamientoTitulo={titulo}
        capacidad={capacidad}
        modoReserva={modoReserva}
        onFechasOcupadas={onFechasOcupadas}
      />
    </aside>
  )
}

export default PanelReserva
