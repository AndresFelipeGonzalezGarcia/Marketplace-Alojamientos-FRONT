import { useEffect, useRef, type ReactNode } from 'react'
import { Link } from 'react-router'
import { mensajeConReferencia } from '../../api/errores'
import type { Reserva } from '../../api/reservas'
import { rutaReserva } from '../reservas/formatoReserva'
import type { FasePago } from './usePago'

type Desenlace = Exclude<FasePago, { fase: 'lista' } | { fase: 'procesando' }>

interface DesenlacePagoProps {
  reserva: Reserva
  estado: Desenlace
  // Solo en 503 y en errores sin respuesta: los únicos que admiten reintento.
  onReintentar: () => void
}

interface Contenido {
  titulo: string
  tono: 'espera' | 'error' | 'aviso'
  cuerpo: ReactNode
  acciones: ReactNode
}

function DesenlacePago({ reserva, estado, onReintentar }: DesenlacePagoProps) {
  const titulo = useRef<HTMLHeadingElement>(null)
  const detalle = rutaReserva(reserva.id)

  // Al llegar el desenlace, el foco va a su título para que se lea primero.
  useEffect(() => {
    titulo.current?.focus()
  }, [estado.fase])

  const verReserva = (
    <Link className="boton-enlace boton-enlace--secundario" to={detalle}>
      Ver mi reserva
    </Link>
  )

  let contenido: Contenido
  switch (estado.fase) {
    case 'incierto':
      contenido = {
        titulo: 'Estamos confirmando tu pago',
        tono: 'espera',
        cuerpo: (
          <>
            <p>
              El procesador de pagos no respondió a tiempo, así que todavía no sabemos si el cobro
              se hizo. Lo estamos verificando automáticamente y tu reserva se actualizará sola.
            </p>
            <p>
              <strong>No vuelvas a pagar.</strong> Consulta tu reserva más tarde para ver el
              resultado.
            </p>
          </>
        ),
        acciones: (
          <>
            <Link className="boton-enlace" to={detalle}>
              Ver mi reserva
            </Link>
            <Link className="boton-enlace boton-enlace--secundario" to="/reservas">
              Ir a mis reservas
            </Link>
          </>
        ),
      }
      break
    case 'rechazado': {
      const consulta = new URLSearchParams({
        llegada: reserva.fechaLlegada,
        salida: reserva.fechaSalida,
        huespedes: String(reserva.numeroHuespedes),
      })
      contenido = {
        titulo: 'El pago no se aprobó',
        tono: 'error',
        cuerpo: (
          <>
            <p>
              El cobro fue rechazado o expiró y no se completó. Tu reserva quedó como «Pago
              fallido».
            </p>
            <p>
              <strong>Estas fechas ya no están apartadas para ti:</strong> volvieron a quedar
              libres y cualquiera puede reservarlas. Si todavía quieres viajar, busca de nuevo y
              haz una reserva nueva.
            </p>
          </>
        ),
        acciones: (
          <>
            <Link
              className="boton-enlace"
              to={`/alojamientos/${encodeURIComponent(reserva.alojamientoId)}?${consulta}`}
            >
              Buscar de nuevo estas fechas
            </Link>
            <Link className="boton-enlace boton-enlace--secundario" to="/alojamientos">
              Ver otros alojamientos
            </Link>
          </>
        ),
      }
      break
    }
    case 'no-disponible':
      contenido = {
        titulo: 'El servicio de pagos no está disponible',
        tono: 'aviso',
        cuerpo: (
          <>
            <p>
              El procesador de pagos no está respondiendo y no se hizo ningún cobro. Tu reserva
              sigue pendiente de pago y las fechas siguen apartadas para ti.
            </p>
            <p>Espera unos minutos y vuelve a intentarlo.</p>
            {estado.error.correlationId && (
              <p className="desenlace-pago__referencia">
                Código de referencia: {estado.error.correlationId}
              </p>
            )}
          </>
        ),
        acciones: (
          <>
            <button className="boton-principal" type="button" onClick={onReintentar}>
              Reintentar el pago
            </button>
            {verReserva}
          </>
        ),
      }
      break
    case 'estado-invalido':
      contenido = {
        titulo: 'Esta reserva ya no está pendiente de pago',
        tono: 'aviso',
        cuerpo: (
          <p>
            Solo se pueden pagar las reservas pendientes de pago. Puede que ya esté pagada, que el
            anfitrión aún no la haya aceptado o que se haya cancelado. Revisa su estado actual.
          </p>
        ),
        acciones: (
          <Link className="boton-enlace" to={detalle}>
            Ver el estado de la reserva
          </Link>
        ),
      }
      break
    case 'error':
      contenido = {
        titulo: 'No recibimos la respuesta del pago',
        tono: 'aviso',
        cuerpo: (
          <>
            <p>{mensajeConReferencia(estado.error)}</p>
            <p>
              Puedes volver a intentarlo sin miedo: si el cobro ya se hizo, no se repetirá.
            </p>
          </>
        ),
        acciones: (
          <>
            <button className="boton-principal" type="button" onClick={onReintentar}>
              Reintentar el pago
            </button>
            {verReserva}
          </>
        ),
      }
      break
  }

  return (
    <section
      className={`desenlace-pago desenlace-pago--${contenido.tono}`}
      role={contenido.tono === 'espera' ? 'status' : 'alert'}
      aria-labelledby="desenlace-pago-titulo"
    >
      <h2 className="desenlace-pago__titulo" id="desenlace-pago-titulo" ref={titulo} tabIndex={-1}>
        {contenido.titulo}
      </h2>
      <div className="desenlace-pago__cuerpo">{contenido.cuerpo}</div>
      <div className="desenlace-pago__acciones">{contenido.acciones}</div>
    </section>
  )
}

export default DesenlacePago
