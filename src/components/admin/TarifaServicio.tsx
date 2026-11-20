import { useEffect, useState, type FormEvent } from 'react'
import {
  actualizarTarifaServicio,
  obtenerTarifaServicio,
} from '../../api/configuracion'
import { mensajeConReferencia, type ErrorApi } from '../../api/errores'
import {
  aTextoPorcentaje,
  formatearPorcentaje,
  leerPorcentaje,
} from './validarTarifa'

type Carga =
  | { fase: 'cargando' }
  | { fase: 'lista'; vigente: number }
  | { fase: 'error'; error: ErrorApi }

const ID_CAMPO = 'tarifa-servicio-porcentaje'

// Tarifa de servicio
function TarifaServicio() {
  const [carga, setCarga] = useState<Carga>({ fase: 'cargando' })
  const [intento, setIntento] = useState(0)
  const [texto, setTexto] = useState('')
  const [errorCampo, setErrorCampo] = useState<string | null>(null)
  const [errorGuardar, setErrorGuardar] = useState<ErrorApi | null>(null)
  const [guardando, setGuardando] = useState(false)
  const [guardada, setGuardada] = useState<number | null>(null)

  useEffect(() => {
    let vigente = true
    obtenerTarifaServicio().then((respuesta) => {
      if (!vigente) return
      if (respuesta.estado === 'ok') {
        setCarga({ fase: 'lista', vigente: respuesta.datos.porcentaje })
        setTexto(aTextoPorcentaje(respuesta.datos.porcentaje))
      } else {
        setCarga({ fase: 'error', error: respuesta.error })
      }
    })
    return () => {
      vigente = false
    }
  }, [intento])

  async function guardar(evento: FormEvent) {
    evento.preventDefault()
    if (guardando || carga.fase !== 'lista') return
    setGuardada(null)
    setErrorGuardar(null)
    const lectura = leerPorcentaje(texto)
    if (!lectura.valido) {
      setErrorCampo(lectura.error)
      return
    }
    setErrorCampo(null)
    setGuardando(true)
    const respuesta = await actualizarTarifaServicio(lectura.valor)
    setGuardando(false)

    if (respuesta.estado === 'ok') {
      setCarga({ fase: 'lista', vigente: respuesta.datos.porcentaje })
      setTexto(aTextoPorcentaje(respuesta.datos.porcentaje))
      setGuardada(respuesta.datos.porcentaje)
    } else if (respuesta.error.erroresPorCampo.porcentaje) {
      setErrorCampo(respuesta.error.erroresPorCampo.porcentaje)
    } else {
      setErrorGuardar(respuesta.error)
    }
  }

  let contenido
  if (carga.fase === 'cargando') {
    contenido = (
      <p className="publicacion-cargando" role="status">
        Cargando la tarifa de servicio…
      </p>
    )
  } else if (carga.fase === 'error') {
    contenido = (
      <div className="tarifa__error" role="alert">
        <p>
          No pudimos cargar la tarifa de servicio.{' '}
          {mensajeConReferencia(carga.error)}
        </p>
        {carga.error.codigo !== 'ACCESO_DENEGADO' && (
          <button
            className="boton-secundario"
            type="button"
            onClick={() => {
              setCarga({ fase: 'cargando' })
              setIntento((actual) => actual + 1)
            }}
          >
            Reintentar
          </button>
        )}
      </div>
    )
  } else {
    contenido = (
      <form className="tarifa__formulario" noValidate onSubmit={guardar}>
        <p className="tarifa__vigente">
          Tarifa vigente: <strong>{formatearPorcentaje(carga.vigente)}</strong>
        </p>
        <div className="campo">
          <label className="campo__etiqueta" htmlFor={ID_CAMPO}>
            Porcentaje sobre el subtotal
          </label>
          <div className="tarifa__entrada">
            <input
              id={ID_CAMPO}
              className="campo__control"
              inputMode="decimal"
              value={texto}
              disabled={guardando}
              aria-invalid={errorCampo ? true : undefined}
              aria-describedby={`${ID_CAMPO}-ayuda${errorCampo ? ` ${ID_CAMPO}-error` : ''}`}
              onChange={(evento) => {
                setTexto(evento.target.value)
                setGuardada(null)
                if (errorCampo) {
                  const lectura = leerPorcentaje(evento.target.value)
                  setErrorCampo(lectura.valido ? null : lectura.error)
                }
              }}
            />
            <span className="tarifa__sufijo" aria-hidden="true">
              %
            </span>
          </div>
          <p id={`${ID_CAMPO}-ayuda`} className="campo__ayuda">
            De 0 a 100, con hasta un decimal.
          </p>
          {errorCampo && (
            <p id={`${ID_CAMPO}-error`} className="campo__error">
              {errorCampo}
            </p>
          )}
        </div>
        {errorGuardar && (
          <p className="panel-decision__error" role="alert">
            {mensajeConReferencia(errorGuardar)}
          </p>
        )}
        {guardada !== null && (
          <p className="tarifa__exito" role="status">
            Tarifa guardada: {formatearPorcentaje(guardada)}.
          </p>
        )}
        <button
          className="boton-principal tarifa__guardar"
          type="submit"
          disabled={guardando}
          aria-busy={guardando || undefined}
        >
          {guardando ? 'Guardando…' : 'Guardar tarifa'}
        </button>
      </form>
    )
  }

  return (
    <section
      className="publicacion-tarjeta tarifa"
      aria-labelledby="tarifa-servicio-titulo"
    >
      <h2 id="tarifa-servicio-titulo" className="publicacion-tarjeta__titulo">
        Tarifa de servicio
      </h2>
      <p className="tarifa__aviso">
        El cambio solo afecta a las cotizaciones y reservas nuevas. Las que ya
        se crearon conservan la tarifa con la que se calcularon.
      </p>
      {contenido}
    </section>
  )
}

export default TarifaServicio
