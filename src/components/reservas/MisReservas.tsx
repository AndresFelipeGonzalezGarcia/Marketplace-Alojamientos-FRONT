import { useEffect, useState } from 'react'
import { Link, useSearchParams } from 'react-router'
import {
  errorDeConexion,
  mensajeConReferencia,
  type ErrorApi,
} from '../../api/errores'
import {
  esEstadoReserva,
  listarMisReservas,
  ordenarPorLlegada,
  type EstadoReserva,
  type ReservaResumen,
} from '../../api/reservas'
import '../formulario/formulario.css'
import '../publicacion/publicacion.css'
import '../admin/admin.css'
import { PRESENTACION_RESERVA } from './estadoReserva'
import FiltroEstado from './FiltroEstado'
import TarjetaReserva from './TarjetaReserva'
import './reservas.css'

// Resultado del listado
type Carga =
  | { clave: string; fase: 'lista'; reservas: ReservaResumen[] }
  | { clave: string; fase: 'error'; error: ErrorApi }

function MisReservas() {
  const [parametros, setParametros] = useSearchParams()
  const crudo = parametros.get('estado')
  // Estado desconocido
  const estado: EstadoReserva | null = esEstadoReserva(crudo) ? crudo : null
  const [intento, setIntento] = useState(0)
  const clave = `${estado ?? 'TODAS'}#${intento}`
  const [carga, setCarga] = useState<Carga | null>(null)

  useEffect(() => {
    let vigente = true
    listarMisReservas(estado ?? undefined)
      .then((respuesta) => {
        if (!vigente) return
        setCarga(
          respuesta.estado === 'ok'
            ? { clave, fase: 'lista', reservas: ordenarPorLlegada(respuesta.datos) }
            : { clave, fase: 'error', error: respuesta.error },
        )
      })
      .catch(() => {
        if (vigente) setCarga({ clave, fase: 'error', error: errorDeConexion() })
      })
    return () => {
      vigente = false
    }
  }, [clave, estado])

  function cambiarFiltro(nuevo: EstadoReserva | null) {
    setParametros(nuevo ? { estado: nuevo } : {}, { replace: true })
  }

  const actual = carga?.clave === clave ? carga : null

  return (
    <>
      <div className="publicacion-cabecera bandeja-cabecera">
        <div>
          <h1 className="publicacion-cabecera__titulo">Mis reservas</h1>
          <p className="bandeja-cabecera__texto">
            De la llegada más reciente a la más antigua.
          </p>
        </div>
        {actual?.fase === 'lista' && actual.reservas.length > 0 && (
          <p className="bandeja-cabecera__conteo">
            {actual.reservas.length}{' '}
            {actual.reservas.length === 1 ? 'reserva' : 'reservas'}
          </p>
        )}
      </div>

      <FiltroEstado seleccionado={estado} onCambiar={cambiarFiltro} />

      {actual === null ? (
        <Cargando />
      ) : actual.fase === 'error' ? (
        <section className="publicacion-tarjeta reservas-mensaje" role="alert">
          <h2 className="publicacion-tarjeta__titulo">
            No pudimos cargar tus reservas
          </h2>
          <p className="reservas-mensaje__texto">
            {mensajeConReferencia(actual.error)}
          </p>
          <button
            className="boton-secundario"
            type="button"
            onClick={() => setIntento((n) => n + 1)}
          >
            Reintentar
          </button>
        </section>
      ) : actual.reservas.length === 0 ? (
        <Vacio estado={estado} onVerTodas={() => cambiarFiltro(null)} />
      ) : (
        <ul className="bandeja-lista" aria-label="Tus reservas">
          {actual.reservas.map((reserva) => (
            <TarjetaReserva key={reserva.id} reserva={reserva} />
          ))}
        </ul>
      )}
    </>
  )
}

function Cargando() {
  return (
    <>
      <p className="publicacion-cargando" role="status">
        Cargando tus reservas…
      </p>
      <ul className="bandeja-lista" aria-hidden="true">
        {[0, 1, 2].map((n) => (
          <li key={n} className="tarjeta-reserva tarjeta-reserva--esqueleto">
            <span className="esqueleto-reserva esqueleto-reserva--foto" />
            <span className="esqueleto-reserva__lineas">
              <span className="esqueleto-reserva" />
              <span className="esqueleto-reserva esqueleto-reserva--corta" />
            </span>
          </li>
        ))}
      </ul>
    </>
  )
}

interface VacioProps {
  estado: EstadoReserva | null
  onVerTodas: () => void
}

function Vacio({ estado, onVerTodas }: VacioProps) {
  return (
    <section className="publicacion-tarjeta reservas-mensaje">
      <h2 className="publicacion-tarjeta__titulo">
        {estado
          ? `No tienes reservas «${PRESENTACION_RESERVA[estado].etiqueta}»`
          : 'Aún no tienes reservas'}
      </h2>
      <p className="reservas-mensaje__texto">
        {estado
          ? 'Prueba con otro estado o busca un alojamiento para tu próximo viaje.'
          : 'Busca un alojamiento, elige tus fechas y haz tu primera reserva.'}
      </p>
      <div className="reservas-mensaje__acciones">
        <Link className="boton-enlace" to="/alojamientos">
          Buscar alojamientos
        </Link>
        {estado && (
          <button className="boton-secundario" type="button" onClick={onVerTodas}>
            Ver todas mis reservas
          </button>
        )}
      </div>
    </section>
  )
}

export default MisReservas
