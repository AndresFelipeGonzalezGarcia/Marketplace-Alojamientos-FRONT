import { useEffect, useState } from 'react'
import {
  listarPendientes,
  ordenarPorEnvio,
  type PublicacionRevision,
} from '../../api/admin'
import { mensajeConReferencia, type ErrorApi } from '../../api/errores'
import '../formulario/formulario.css'
import MensajePantalla from '../publicacion/MensajePantalla'
import { MENSAJE_BLOQUEO } from './errorRevision'
import FilaRevision from './FilaRevision'
import './admin.css'

// Lo que deja el detalle al volver tras aprobar o rechazar.
export interface ResultadoRevision {
  id: string
  titulo: string
  decision: 'aprobada' | 'rechazada'
}

// Estado de navegación con el que el detalle vuelve a la bandeja.
export interface EstadoBandeja {
  resultado?: ResultadoRevision
}

type Carga =
  | { fase: 'cargando' }
  | { fase: 'lista'; publicaciones: PublicacionRevision[] }
  | { fase: 'acceso_denegado' }
  | { fase: 'error'; error: ErrorApi }

interface BandejaRevisionProps {
  resultado?: ResultadoRevision
}

const TEXTO_RESULTADO: Record<ResultadoRevision['decision'], string> = {
  aprobada: 'ya está activa y visible para los huéspedes.',
  rechazada: 'volvió a borrador. El anfitrión verá tu motivo para corregirla.',
}

function BandejaRevision({ resultado }: BandejaRevisionProps) {
  const [carga, setCarga] = useState<Carga>({ fase: 'cargando' })
  const [intento, setIntento] = useState(0)

  useEffect(() => {
    let vigente = true
    listarPendientes().then((respuesta) => {
      if (!vigente) return
      if (respuesta.estado === 'ok') {
        // La recién decidida no debe reaparecer aunque el backend tarde
        // en reflejar el cambio.
        const publicaciones = ordenarPorEnvio(respuesta.datos).filter(
          (publicacion) => publicacion.id !== resultado?.id,
        )
        setCarga({ fase: 'lista', publicaciones })
      } else if (respuesta.error.codigo === 'ACCESO_DENEGADO') {
        setCarga({ fase: 'acceso_denegado' })
      } else {
        setCarga({ fase: 'error', error: respuesta.error })
      }
    })
    return () => {
      vigente = false
    }
  }, [intento, resultado?.id])

  function recargar() {
    setCarga({ fase: 'cargando' })
    setIntento((actual) => actual + 1)
  }

  const cabecera = (
    <div className="publicacion-cabecera bandeja-cabecera">
      <div>
        <h1 className="publicacion-cabecera__titulo">Publicaciones pendientes</h1>
        <p className="bandeja-cabecera__texto">
          Revisa las publicaciones que enviaron los anfitriones, de la más antigua
          a la más reciente.
        </p>
      </div>
      {carga.fase === 'lista' && carga.publicaciones.length > 0 && (
        <p className="bandeja-cabecera__conteo">
          {carga.publicaciones.length} por revisar
        </p>
      )}
    </div>
  )

  const aviso = resultado && (
    <p className="revision-resultado" role="status">
      <strong>«{resultado.titulo}»</strong> {TEXTO_RESULTADO[resultado.decision]}
    </p>
  )

  switch (carga.fase) {
    case 'cargando':
      return (
        <>
          {cabecera}
          {aviso}
          <p className="publicacion-cargando" role="status">
            Cargando publicaciones pendientes…
          </p>
        </>
      )
    case 'acceso_denegado':
      return (
        <MensajePantalla
          titulo={MENSAJE_BLOQUEO.acceso_denegado.titulo}
          mensaje={MENSAJE_BLOQUEO.acceso_denegado.mensaje}
        />
      )
    case 'error':
      return (
        <MensajePantalla
          titulo="No pudimos cargar las publicaciones pendientes"
          mensaje={mensajeConReferencia(carga.error)}
        >
          <button className="boton-secundario" type="button" onClick={recargar}>
            Reintentar
          </button>
        </MensajePantalla>
      )
    case 'lista':
      break
  }

  return (
    <>
      {cabecera}
      {aviso}
      {carga.publicaciones.length === 0 ? (
        <section className="publicacion-tarjeta bandeja-vacia">
          <h2 className="publicacion-tarjeta__titulo">
            No hay publicaciones por revisar
          </h2>
          <p className="bandeja-vacia__texto">
            Cuando un anfitrión envíe una publicación a revisión, aparecerá aquí.
          </p>
          <button className="boton-secundario" type="button" onClick={recargar}>
            Volver a consultar
          </button>
        </section>
      ) : (
        <ul className="bandeja-lista" aria-label="Publicaciones por revisar">
          {carga.publicaciones.map((publicacion) => (
            <FilaRevision key={publicacion.id} publicacion={publicacion} />
          ))}
        </ul>
      )}
    </>
  )
}

export default BandejaRevision
