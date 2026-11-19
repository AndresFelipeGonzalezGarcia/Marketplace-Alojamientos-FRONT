import type { AlojamientoDetalle } from '../../api/alojamientos'
import { formatearDia, textoNoches } from '../busqueda/filtrosBusqueda'
import { formatearPrecio } from '../formato/formato'
import { useEstadia } from './estadia'
import MarcadorPendiente from './MarcadorPendiente'

interface PanelReservaProps {
  alojamiento: AlojamientoDetalle
}

// Lateral fijo en pantallas anchas. Hoy muestra el precio; la cotización y
// la reserva llegan en las historias siguientes.
function PanelReserva({ alojamiento }: PanelReservaProps) {
  const { precioNoche, tarifaLimpieza = 0, modoReserva } = alojamiento
  // Las mismas fechas que marca el calendario: la cotización las tomará de aquí.
  const { estadia } = useEstadia()

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
      <div className="panel-reserva__estadia">
        <p className="panel-reserva__estadia-titulo">Tu estadía</p>
        {estadia ? (
          <p>
            <strong>{textoNoches(estadia.noches)}</strong>: del{' '}
            {formatearDia(estadia.llegada)} al {formatearDia(estadia.salida)}
          </p>
        ) : (
          <p className="panel-reserva__estadia-vacia">
            Elige tus fechas en el calendario de disponibilidad.
          </p>
        )}
      </div>
      <MarcadorPendiente
        titulo="Cotización y reserva"
        mensaje="Con tus fechas verás aquí el total de la estadía con tarifas incluidas y podrás reservar."
      />
    </aside>
  )
}

export default PanelReserva
