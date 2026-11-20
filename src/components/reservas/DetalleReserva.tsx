import { useEffect, useState } from 'react'
import { Link } from 'react-router'
import type { ResultadoApi } from '../../api/cliente'
import { mensajeConReferencia } from '../../api/errores'
import { obtenerReserva, type Reserva } from '../../api/reservas'
import FotoRevision from '../admin/FotoRevision'
import DesgloseCotizacion from '../detalle/DesgloseCotizacion'
import { contarNoches, textoNoches } from '../busqueda/filtrosBusqueda'
import { textoCapacidad } from '../formato/formato'
import EstadoReservaPanel, { type AvisoReserva } from './EstadoReservaPanel'
import { formatearFecha } from './formatoReserva'
import '../formulario/formulario.css'
import '../publicacion/publicacion.css'
import '../admin/admin.css'
import '../detalle/detalle.css'
import './reservas.css'

interface DetalleReservaProps {
  id: string
  aviso: AvisoReserva | null
}

interface Respuesta {
  // Resultado de la reserva
  solicitud: string
  resultado: ResultadoApi<Reserva>
}

const volver = (
  <Link className="detalle__volver" to="/reservas">
    <span aria-hidden="true">←</span> Mis reservas
  </Link>
)

function DetalleReserva({ id, aviso }: DetalleReservaProps) {
  const [intento, setIntento] = useState(0)
  const [respuesta, setRespuesta] = useState<Respuesta | null>(null)
  const solicitud = `${id}#${intento}`

  useEffect(() => {
    let vigente = true
    obtenerReserva(id).then((resultado) => {
      if (vigente) setRespuesta({ solicitud: `${id}#${intento}`, resultado })
    })
    return () => {
      vigente = false
    }
  }, [id, intento])

  if (!respuesta || respuesta.solicitud !== solicitud) {
    return (
      <div className="detalle-reserva">
        {volver}
        <p className="solo-lector" role="status">
          Cargando la reserva…
        </p>
        <div className="detalle-reserva__esqueleto" aria-hidden="true">
          <span className="esqueleto detalle-reserva__esqueleto-foto" />
          <span className="esqueleto esqueleto--linea esqueleto--titulo" />
          <span className="esqueleto esqueleto--linea esqueleto--corta" />
        </div>
      </div>
    )
  }

  const { resultado } = respuesta

  if (resultado.estado === 'error') {
    const { error } = resultado
    if (error.codigo === 'RESERVA_NO_ENCONTRADA' || error.codigo === 'ACCESO_DENEGADO') {
      return (
        <div className="detalle-reserva">
          {volver}
          <section className="publicacion-tarjeta reservas-mensaje">
            <h1 className="publicacion-tarjeta__titulo">No encontramos esta reserva</h1>
            <p className="reservas-mensaje__texto">
              Puede que el enlace no sea correcto o que la reserva sea de otra cuenta.
            </p>
            <div className="reservas-mensaje__acciones">
              <Link className="boton-enlace" to="/reservas">
                Ver mis reservas
              </Link>
            </div>
          </section>
        </div>
      )
    }
    return (
      <div className="detalle-reserva">
        {volver}
        <section className="publicacion-tarjeta reservas-mensaje" role="alert">
          <h1 className="publicacion-tarjeta__titulo">No pudimos cargar la reserva</h1>
          <p className="reservas-mensaje__texto">{mensajeConReferencia(error)}</p>
          <div className="reservas-mensaje__acciones">
            <button className="boton-principal" type="button" onClick={() => setIntento((n) => n + 1)}>
              Reintentar
            </button>
          </div>
        </section>
      </div>
    )
  }

  const reserva = resultado.datos
  const {
    alojamientoId,
    alojamientoTitulo,
    alojamientoCiudad,
    imagenPortada,
    fechaLlegada,
    fechaSalida,
    numeroHuespedes,
    cotizacion,
    creadaEn,
  } = reserva
  const noches = cotizacion?.noches ?? contarNoches(fechaLlegada, fechaSalida)

  return (
    <article className="detalle-reserva">
      {volver}
      <header className="detalle-reserva__cabecera">
        <FotoRevision
          key={imagenPortada ?? ''}
          url={imagenPortada}
          alt=""
          textoSinFoto="Sin foto"
          className="detalle-reserva__foto"
        />
        <div>
          <p className="detalle-reserva__antetitulo">Tu reserva</p>
          <h1 className="detalle-reserva__titulo">{alojamientoTitulo}</h1>
          {alojamientoCiudad && <p className="detalle-reserva__ciudad">{alojamientoCiudad}</p>}
          <Link className="detalle-reserva__enlace" to={`/alojamientos/${encodeURIComponent(alojamientoId)}`}>
            Ver el alojamiento
          </Link>
        </div>
      </header>

      <div className="detalle-reserva__cuerpo">
        <EstadoReservaPanel reserva={reserva} aviso={aviso} />

        <section className="publicacion-tarjeta" aria-labelledby="detalle-reserva-estadia">
          <h2 className="publicacion-tarjeta__titulo" id="detalle-reserva-estadia">
            Tu estadía
          </h2>
          <dl className="detalle-reserva__datos">
            <div>
              <dt>Llegada</dt>
              <dd>
                <time dateTime={fechaLlegada}>{formatearFecha(fechaLlegada)}</time>
              </dd>
            </div>
            <div>
              <dt>Salida</dt>
              <dd>
                <time dateTime={fechaSalida}>{formatearFecha(fechaSalida)}</time>
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
              <dd>{textoCapacidad(numeroHuespedes)}</dd>
            </div>
          </dl>
        </section>

        <section className="publicacion-tarjeta" aria-labelledby="detalle-reserva-desglose">
          <h2 className="publicacion-tarjeta__titulo" id="detalle-reserva-desglose">
            Desglose del precio
          </h2>
          {cotizacion ? (
            <DesgloseCotizacion cotizacion={cotizacion} />
          ) : (
            <p className="reservas-mensaje__texto">El desglose de esta reserva no está disponible.</p>
          )}
        </section>
      </div>

      <p className="detalle-reserva__referencia">
        Código de la reserva: <span className="detalle-reserva__codigo">{reserva.id}</span>
        {creadaEn && (
          <>
            {' · '}Creada el <time dateTime={creadaEn}>{formatearFecha(creadaEn.slice(0, 10))}</time>
          </>
        )}
      </p>
    </article>
  )
}

export default DetalleReserva
