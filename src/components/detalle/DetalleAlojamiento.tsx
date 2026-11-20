import { useEffect, useState } from 'react'
import { Link } from 'react-router'
import {
  obtenerAlojamiento,
  type AlojamientoDetalle,
} from '../../api/alojamientos'
import type { ResultadoApi } from '../../api/cliente'
import { mensajeConReferencia } from '../../api/errores'
import EsqueletoDetalle from './EsqueletoDetalle'
import FichaAlojamiento from './FichaAlojamiento'
import GaleriaAlojamiento from './GaleriaAlojamiento'
import MensajeDetalle from './MensajeDetalle'
import PanelReserva from './PanelReserva'
import '../formulario/formulario.css'
import './detalle.css'

interface DetalleAlojamientoProps {
  id: string
  // Volver a la búsqueda
  rutaVolver: string
}

interface Respuesta {
  // Resultado del detalle
  solicitud: string
  resultado: ResultadoApi<AlojamientoDetalle>
}

function DetalleAlojamiento({ id, rutaVolver }: DetalleAlojamientoProps) {
  const [intento, setIntento] = useState(0)
  const [respuesta, setRespuesta] = useState<Respuesta | null>(null)
  const [versionCalendario, setVersionCalendario] = useState(0)
  const solicitud = `${id}#${intento}`

  useEffect(() => {
    let vigente = true
    obtenerAlojamiento(id).then((resultado) => {
      if (vigente) setRespuesta({ solicitud: `${id}#${intento}`, resultado })
    })
    return () => {
      vigente = false
    }
  }, [id, intento])

  const volver = (
    <Link className="detalle__volver" to={rutaVolver}>
      <span aria-hidden="true">←</span> Volver a los resultados
    </Link>
  )

  if (!respuesta || respuesta.solicitud !== solicitud) {
    return (
      <div className="detalle">
        {volver}
        <EsqueletoDetalle />
      </div>
    )
  }

  const { resultado } = respuesta

  if (resultado.estado === 'error') {
    if (resultado.error.codigo === 'ALOJAMIENTO_NO_ENCONTRADO') {
      return (
        <MensajeDetalle titulo="Este alojamiento no está disponible">
          <p className="detalle-mensaje__texto">
            Puede que el anfitrión lo haya retirado o que el enlace no sea
            correcto. Hay muchos más esperándote en la búsqueda.
          </p>
          <Link className="boton-enlace" to={rutaVolver}>
            Volver a la búsqueda
          </Link>
        </MensajeDetalle>
      )
    }
    return (
      <MensajeDetalle titulo="No pudimos cargar el alojamiento" alerta>
        <p className="detalle-mensaje__texto">
          {mensajeConReferencia(resultado.error)}
        </p>
        <div className="detalle-mensaje__acciones">
          <button
            className="boton-principal"
            type="button"
            onClick={() => setIntento((actual) => actual + 1)}
          >
            Reintentar
          </button>
          <Link className="boton-enlace boton-enlace--secundario" to={rutaVolver}>
            Volver a la búsqueda
          </Link>
        </div>
      </MensajeDetalle>
    )
  }

  const alojamiento = resultado.datos

  return (
    <article className="detalle">
      {volver}
      {/* Galería */}
      <GaleriaAlojamiento
        key={alojamiento.id}
        titulo={alojamiento.titulo}
        imagenes={alojamiento.imagenes ?? []}
      />
      <div className="detalle__cuerpo">
        <FichaAlojamiento alojamiento={alojamiento} versionCalendario={versionCalendario} />
        <PanelReserva
          alojamiento={alojamiento}
          onFechasOcupadas={() => setVersionCalendario((actual) => actual + 1)}
        />
      </div>
    </article>
  )
}

export default DetalleAlojamiento
