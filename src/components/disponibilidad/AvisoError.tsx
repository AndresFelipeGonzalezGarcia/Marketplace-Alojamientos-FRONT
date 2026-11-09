import { mensajeConReferencia, type ErrorApi } from '../../api/errores'
import { reservasAfectadas } from '../../api/periodos'
import { formatearFecha } from './validacionPeriodo'

interface AvisoErrorProps {
  error: ErrorApi
}

function AvisoError({ error }: AvisoErrorProps) {
  const reservas = reservasAfectadas(error)

  return (
    <div className="aviso-error" role="alert">
      <p className="aviso-error__mensaje">{mensajeConReferencia(error)}</p>
      {reservas.length > 0 && (
        <>
          <p className="aviso-error__subtitulo">Reservas afectadas:</p>
          <ul className="aviso-error__reservas">
            {reservas.map((reserva) => (
              <li key={reserva.id}>
                Del {formatearFecha(reserva.fechaLlegada)} al{' '}
                {formatearFecha(reserva.fechaSalida)} ·{' '}
                {reserva.numeroHuespedes} huésped
                {reserva.numeroHuespedes === 1 ? '' : 'es'} ·{' '}
                {reserva.estado.replaceAll('_', ' ').toLowerCase()}
              </li>
            ))}
          </ul>
        </>
      )}
    </div>
  )
}

export default AvisoError
