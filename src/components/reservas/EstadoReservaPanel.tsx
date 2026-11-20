import { useEffect, useId, useRef } from 'react'
import { Link } from 'react-router'
import type { Reserva } from '../../api/reservas'
import { PRESENTACION_RESERVA } from './estadoReserva'
import { rutaReserva } from './formatoReserva'
import InsigniaReserva from './InsigniaReserva'

interface EstadoReservaPanelProps {
  reserva: Reserva
  // Se llega aquí justo después de reservar: se celebra y se explica qué sigue.
  recienCreada: boolean
}

interface Mensaje {
  titulo: string
  texto: string
}

function mensajeDe(reserva: Reserva, recienCreada: boolean): Mensaje {
  const { etiqueta, descripcion } = PRESENTACION_RESERVA[reserva.estado]
  switch (reserva.estado) {
    case 'PENDIENTE_PAGO':
      return recienCreada
        ? {
            titulo: '¡Tu reserva está creada!',
            texto: 'Las fechas quedan apartadas para ti. Paga ahora para confirmarla.',
          }
        : { titulo: etiqueta, texto: 'Las fechas están apartadas para ti. Paga para confirmar la reserva.' }
    case 'PENDIENTE_APROBACION':
      return {
        titulo: recienCreada ? 'Solicitud enviada al anfitrión' : etiqueta,
        texto:
          'El anfitrión debe aceptar tu solicitud antes de que puedas pagar. Aún no se te cobra nada: cuando la acepte, podrás pagarla desde aquí.',
      }
    default:
      return { titulo: recienCreada ? 'Reserva creada' : etiqueta, texto: descripcion }
  }
}

// El estado, bien visible, con lo que el huésped puede hacer a continuación.
function EstadoReservaPanel({ reserva, recienCreada }: EstadoReservaPanelProps) {
  const titulo = useRef<HTMLHeadingElement>(null)
  const idTitulo = useId()
  const { tono } = PRESENTACION_RESERVA[reserva.estado]
  const { titulo: textoTitulo, texto } = mensajeDe(reserva, recienCreada)

  // Recién creada, el foco va al desenlace para que se lea primero.
  useEffect(() => {
    if (recienCreada) titulo.current?.focus()
  }, [recienCreada])

  return (
    <section
      className={`estado-reserva estado-reserva--${tono}`}
      aria-labelledby={idTitulo}
    >
      <InsigniaReserva estado={reserva.estado} />
      <h2
        className="estado-reserva__titulo"
        id={idTitulo}
        ref={titulo}
        tabIndex={-1}
      >
        {textoTitulo}
      </h2>
      <p className="estado-reserva__texto">{texto}</p>
      {reserva.estado === 'PENDIENTE_PAGO' && (
        <Link className="boton-enlace estado-reserva__accion" to={`${rutaReserva(reserva.id)}/pago`}>
          Pagar ahora
        </Link>
      )}
      {reserva.estado === 'PAGO_FALLIDO' && (
        <Link className="boton-enlace estado-reserva__accion" to="/alojamientos">
          Buscar alojamientos
        </Link>
      )}
    </section>
  )
}

export default EstadoReservaPanel
