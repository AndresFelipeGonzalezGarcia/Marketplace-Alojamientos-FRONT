import type { AlojamientoDetalle } from '../../api/alojamientos'
import { formatearPrecio } from '../formato/formato'
import MarcadorPendiente from './MarcadorPendiente'

interface PanelReservaProps {
  alojamiento: AlojamientoDetalle
}

// Lateral fijo en pantallas anchas. Hoy muestra el precio; la cotización y
// la reserva llegan en las historias siguientes.
function PanelReserva({ alojamiento }: PanelReservaProps) {
  const { precioNoche, tarifaLimpieza = 0, modoReserva } = alojamiento

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
      <MarcadorPendiente
        titulo="Cotización y reserva"
        mensaje="Aquí elegirás tus fechas y huéspedes, verás el total de la estadía con tarifas incluidas y podrás reservar."
      />
    </aside>
  )
}

export default PanelReserva
