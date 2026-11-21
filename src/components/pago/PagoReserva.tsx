import { useEffect, useState } from 'react'
import { Link } from 'react-router'
import { modoDemoActivo } from '../../auth/sesionDemo'
import type { ResultadoApi } from '../../api/cliente'
import { errorDeConexion, mensajeConReferencia } from '../../api/errores'
import {
  obtenerReserva,
  type EscenarioPago,
  type EstadoReserva,
  type Reserva,
} from '../../api/reservas'
import { contarNoches, textoNoches } from '../busqueda/filtrosBusqueda'
import DesgloseCotizacion from '../detalle/DesgloseCotizacion'
import { formatearImporte, textoCapacidad } from '../formato/formato'
import { PRESENTACION_RESERVA } from '../reservas/estadoReserva'
import { formatearFecha, rutaReserva } from '../reservas/formatoReserva'
import InsigniaReserva from '../reservas/InsigniaReserva'
import DesenlacePago from './DesenlacePago'
import ProcesandoPago from './ProcesandoPago'
import SelectorEscenario from './SelectorEscenario'
import { usePago } from './usePago'
import '../formulario/formulario.css'
import '../publicacion/publicacion.css'
import '../detalle/detalle.css'
import '../reservas/reservas.css'
import './pago.css'

interface PagoReservaProps {
  reservaId: string
}

interface Respuesta {
  solicitud: string
  resultado: ResultadoApi<Reserva>
}

// Pago de la reserva
function PagoReserva({ reservaId }: PagoReservaProps) {
  const [intento, setIntento] = useState(0)
  const [respuesta, setRespuesta] = useState<Respuesta | null>(null)
  const solicitud = `${reservaId}#${intento}`

  useEffect(() => {
    let vigente = true
    const solicitudActual = `${reservaId}#${intento}`
    obtenerReserva(reservaId)
      .then((resultado) => {
        if (vigente) setRespuesta({ solicitud: solicitudActual, resultado })
      })
      .catch(() => {
        if (vigente)
          setRespuesta({
            solicitud: solicitudActual,
            resultado: { estado: 'error', error: errorDeConexion() },
          })
      })
    return () => {
      vigente = false
    }
  }, [reservaId, intento])

  const cabecera = (
    <>
      <Link className="detalle__volver" to={rutaReserva(reservaId)}>
        <span aria-hidden="true">←</span> Volver a la reserva
      </Link>
      <h1 className="pago__titulo">Pagar la reserva</h1>
    </>
  )

  if (!respuesta || respuesta.solicitud !== solicitud) {
    return (
      <div className="pago">
        {cabecera}
        <p className="publicacion-cargando" role="status">
          Cargando la reserva…
        </p>
      </div>
    )
  }

  const { resultado } = respuesta
  if (resultado.estado === 'error') {
    const noEncontrada =
      resultado.error.codigo === 'RESERVA_NO_ENCONTRADA' || resultado.error.codigo === 'ACCESO_DENEGADO'
    return (
      <div className="pago">
        {cabecera}
        <section className="publicacion-tarjeta reservas-mensaje" role={noEncontrada ? undefined : 'alert'}>
          <h2 className="publicacion-tarjeta__titulo">
            {noEncontrada ? 'No encontramos esta reserva' : 'No pudimos cargar la reserva'}
          </h2>
          <p className="reservas-mensaje__texto">
            {noEncontrada
              ? 'Puede que el enlace no sea correcto o que la reserva sea de otra cuenta.'
              : mensajeConReferencia(resultado.error)}
          </p>
          <div className="reservas-mensaje__acciones">
            {noEncontrada ? (
              <Link className="boton-enlace" to="/reservas">
                Ver mis reservas
              </Link>
            ) : (
              <button className="boton-principal" type="button" onClick={() => setIntento((n) => n + 1)}>
                Reintentar
              </button>
            )}
          </div>
        </section>
      </div>
    )
  }

  return (
    <div className="pago">
      {cabecera}
      {/* Pago */}
      <PantallaPago key={resultado.datos.id} reserva={resultado.datos} />
    </div>
  )
}

interface PantallaPagoProps {
  reserva: Reserva
}

function PantallaPago({ reserva }: PantallaPagoProps) {
  const { estado, pagar } = usePago(reserva.id)
  const demo = modoDemoActivo()
  const [escenario, setEscenario] = useState<EscenarioPago>('APROBAR')
  const disparar = () => pagar(demo ? escenario : undefined)
  const total = reserva.cotizacion?.total
  const moneda = reserva.cotizacion?.moneda

  // Resumen
  let estadoMostrado = reserva.estado
  if (estado.fase === 'rechazado') estadoMostrado = 'PAGO_FALLIDO'
  if (estado.fase === 'incierto' && estado.resultado) estadoMostrado = estado.resultado.estadoReserva
  // Pago incierto resuelto
  const inciertoResuelto =
    estado.fase === 'incierto' && estado.resultado === null && reserva.estado !== 'PENDIENTE_PAGO'

  let accion
  if (estado.fase === 'procesando') {
    accion = <ProcesandoPago />
  } else if (estado.fase !== 'lista' && !inciertoResuelto) {
    accion = <DesenlacePago reserva={reserva} estado={estado} onReintentar={disparar} />
  } else if (reserva.estado !== 'PENDIENTE_PAGO') {
    // Reserva no pagable
    accion = (
      <section className="desenlace-pago desenlace-pago--aviso" aria-labelledby="pago-no-disponible">
        <h2 className="desenlace-pago__titulo" id="pago-no-disponible">
          Esta reserva no está pendiente de pago
        </h2>
        <div className="desenlace-pago__cuerpo">
          <p>
            Está «{PRESENTACION_RESERVA[reserva.estado].etiqueta}»:{' '}
            {PRESENTACION_RESERVA[reserva.estado].descripcion} Solo se pueden pagar las reservas
            pendientes de pago.
          </p>
        </div>
        <div className="desenlace-pago__acciones">
          <Link className="boton-enlace" to={rutaReserva(reserva.id)}>
            Ver la reserva
          </Link>
        </div>
      </section>
    )
  } else {
    accion = (
      <section className="publicacion-tarjeta pago__accion" aria-labelledby="pago-accion-titulo">
        <h2 className="publicacion-tarjeta__titulo" id="pago-accion-titulo">
          Confirma el pago
        </h2>
        <p className="pago__nota">
          El cobro lo hace nuestro procesador de pagos seguro: aquí no se piden ni se guardan datos
          de tarjeta. Al aprobarse, tu reserva queda confirmada.
        </p>
        {demo && <SelectorEscenario valor={escenario} onCambiar={setEscenario} />}
        <button className="boton-principal pago__boton" type="button" onClick={disparar}>
          {total !== undefined ? `Pagar ${formatearImporte(total, moneda)}` : 'Pagar ahora'}
        </button>
      </section>
    )
  }

  return (
    <div className="pago__cuerpo">
      <ResumenPago reserva={reserva} estado={estadoMostrado} />
      <div className="pago__lateral">{accion}</div>
    </div>
  )
}

interface ResumenPagoProps {
  reserva: Reserva
  estado: EstadoReserva
}

function ResumenPago({ reserva, estado }: ResumenPagoProps) {
  const noches = reserva.cotizacion?.noches ?? contarNoches(reserva.fechaLlegada, reserva.fechaSalida)
  return (
    <section className="publicacion-tarjeta pago__resumen" aria-labelledby="pago-resumen-titulo">
      <div className="pago__resumen-cabecera">
        <h2 className="publicacion-tarjeta__titulo" id="pago-resumen-titulo">
          {reserva.alojamientoTitulo}
        </h2>
        <InsigniaReserva estado={estado} />
      </div>
      {reserva.alojamientoCiudad && <p className="pago__ciudad">{reserva.alojamientoCiudad}</p>}
      <dl className="detalle-reserva__datos pago__datos">
        <div>
          <dt>Llegada</dt>
          <dd>
            <time dateTime={reserva.fechaLlegada}>{formatearFecha(reserva.fechaLlegada)}</time>
          </dd>
        </div>
        <div>
          <dt>Salida</dt>
          <dd>
            <time dateTime={reserva.fechaSalida}>{formatearFecha(reserva.fechaSalida)}</time>
          </dd>
        </div>
        {noches !== null && (
          <div>
            <dt>Noches</dt>
            <dd>{textoNoches(noches)}</dd>
          </div>
        )}
        <div>
          <dt>Huéspedes</dt>
          <dd>{textoCapacidad(reserva.numeroHuespedes)}</dd>
        </div>
      </dl>
      {reserva.cotizacion ? (
        <DesgloseCotizacion cotizacion={reserva.cotizacion} />
      ) : (
        <p className="reservas-mensaje__texto">El desglose de esta reserva no está disponible.</p>
      )}
    </section>
  )
}

export default PagoReserva
