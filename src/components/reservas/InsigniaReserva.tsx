import type { EstadoReserva } from '../../api/reservas'
import { PRESENTACION_RESERVA } from './estadoReserva'
import IconoEstado from './IconoEstado'

interface InsigniaReservaProps {
  estado: EstadoReserva
}

function InsigniaReserva({ estado }: InsigniaReservaProps) {
  const { etiqueta, tono, icono } = PRESENTACION_RESERVA[estado]
  return (
    <span className={`insignia-reserva insignia-reserva--${tono}`}>
      <IconoEstado nombre={icono} />
      <span className="solo-lector">Estado: </span>
      {etiqueta}
    </span>
  )
}

export default InsigniaReserva
