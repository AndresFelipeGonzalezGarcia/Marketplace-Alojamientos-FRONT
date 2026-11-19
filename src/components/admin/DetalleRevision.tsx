import { useEffect, useState } from 'react'
import { Link, useNavigate } from 'react-router'
import { obtenerPublicacionRevision, type PublicacionRevision } from '../../api/admin'
import { mensajeConReferencia, type ErrorApi } from '../../api/errores'
import type { Publicacion } from '../../api/publicaciones'
import '../formulario/formulario.css'
import InsigniaEstado from '../publicacion/InsigniaEstado'
import MensajePantalla from '../publicacion/MensajePantalla'
import { useCatalogos } from '../publicacion/useCatalogos'
import type { EstadoBandeja } from './BandejaRevision'
import { bloqueoDe, MENSAJE_BLOQUEO, type BloqueoRevision } from './errorRevision'
import FichaPublicacion from './FichaPublicacion'
import { formatearFechaHora } from './formatoRevision'
import PanelDecision, { type Decision } from './PanelDecision'
import './admin.css'

type Carga =
  | { fase: 'cargando' }
  | { fase: 'lista'; publicacion: Publicacion }
  | { fase: 'acceso_denegado' | 'no_encontrada' }
  | { fase: 'error'; error: ErrorApi }

interface DetalleRevisionProps {
  publicacionId: string
  // Viene de la bandeja; si se entra por URL directa no está.
  fila?: PublicacionRevision
}

const ENLACE_BANDEJA = '/admin'

function DetalleRevision({ publicacionId, fila }: DetalleRevisionProps) {
  const navigate = useNavigate()
  const { servicios, politicas } = useCatalogos()
  const [carga, setCarga] = useState<Carga>({ fase: 'cargando' })
  const [intento, setIntento] = useState(0)
  // Bloqueo surgido al decidir (409 o 404): la ficha sigue a la vista.
  const [bloqueo, setBloqueo] = useState<BloqueoRevision | null>(null)

  useEffect(() => {
    let vigente = true
    obtenerPublicacionRevision(publicacionId).then((respuesta) => {
      if (!vigente) return
      if (respuesta.estado === 'ok') {
        setCarga({ fase: 'lista', publicacion: respuesta.datos })
        return
      }
      const motivo = bloqueoDe(respuesta.error)
      if (motivo === 'acceso_denegado' || motivo === 'no_encontrada') {
        setCarga({ fase: motivo })
      } else {
        setCarga({ fase: 'error', error: respuesta.error })
      }
    })
    return () => {
      vigente = false
    }
  }, [publicacionId, intento])

  function alDecidir(decision: Decision, publicacion: Publicacion) {
    const estado: EstadoBandeja = {
      resultado: { id: publicacionId, titulo: publicacion.titulo, decision },
    }
    navigate(ENLACE_BANDEJA, { state: estado })
  }

  const volver = (
    <Link className="publicacion-migas revision-volver" to={ENLACE_BANDEJA}>
      ← Volver a la bandeja
    </Link>
  )

  switch (carga.fase) {
    case 'cargando':
      return (
        <>
          {volver}
          <p className="publicacion-cargando" role="status">
            Cargando publicación…
          </p>
        </>
      )
    case 'acceso_denegado':
      return (
        <MensajePantalla
          titulo={MENSAJE_BLOQUEO.acceso_denegado.titulo}
          mensaje={MENSAJE_BLOQUEO.acceso_denegado.mensaje}
        >
          <Link className="boton-enlace" to="/">
            Volver al inicio
          </Link>
        </MensajePantalla>
      )
    case 'no_encontrada':
      return (
        <MensajePantalla
          titulo="Publicación no encontrada"
          mensaje="La publicación que buscas no existe o fue eliminada."
        >
          <Link className="boton-enlace" to={ENLACE_BANDEJA}>
            Volver a la bandeja
          </Link>
        </MensajePantalla>
      )
    case 'error':
      return (
        <MensajePantalla
          titulo="No pudimos cargar la publicación"
          mensaje={mensajeConReferencia(carga.error)}
        >
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
        </MensajePantalla>
      )
    case 'lista':
      break
  }

  // Un 403 al decidir equivale a no tener acceso a la pantalla.
  if (bloqueo === 'acceso_denegado') {
    return (
      <MensajePantalla
        titulo={MENSAJE_BLOQUEO.acceso_denegado.titulo}
        mensaje={MENSAJE_BLOQUEO.acceso_denegado.mensaje}
      >
        <Link className="boton-enlace" to="/">
          Volver al inicio
        </Link>
      </MensajePantalla>
    )
  }

  const { publicacion } = carga
  const pendiente = publicacion.estado === 'PENDIENTE_REVISION'

  let lateral
  if (bloqueo) {
    lateral = (
      <aside className="publicacion-tarjeta panel-decision panel-decision--bloqueo" role="alert">
        <h2 className="publicacion-tarjeta__titulo">{MENSAJE_BLOQUEO[bloqueo].titulo}</h2>
        <p className="panel-decision__texto">{MENSAJE_BLOQUEO[bloqueo].mensaje}</p>
        <Link className="boton-enlace" to={ENLACE_BANDEJA}>
          Recargar la bandeja
        </Link>
      </aside>
    )
  } else if (pendiente) {
    lateral = (
      <PanelDecision
        publicacionId={publicacionId}
        titulo={publicacion.titulo}
        onDecidida={alDecidir}
        onBloqueo={setBloqueo}
      />
    )
  } else {
    lateral = (
      <aside className="publicacion-tarjeta panel-decision">
        <h2 className="publicacion-tarjeta__titulo">Ya no está pendiente</h2>
        <p className="panel-decision__texto">
          Esta publicación ya fue revisada, así que no hay nada que decidir.
        </p>
        {publicacion.motivoEstado && (
          <p className="panel-decision__texto">
            <strong>Motivo registrado:</strong> {publicacion.motivoEstado}
          </p>
        )}
        <Link className="boton-enlace boton-enlace--secundario" to={ENLACE_BANDEJA}>
          Volver a la bandeja
        </Link>
      </aside>
    )
  }

  return (
    <>
      {volver}
      <div className="publicacion-cabecera revision-cabecera">
        <h1 className="publicacion-cabecera__titulo">{publicacion.titulo}</h1>
        <InsigniaEstado estado={publicacion.estado} />
      </div>
      {fila && (
        <p className="revision-meta">
          Enviada por <strong>{fila.anfitrionNombre}</strong> el{' '}
          <time dateTime={fila.fechaEnvio}>{formatearFechaHora(fila.fechaEnvio)}</time>
        </p>
      )}
      <div className="publicacion-layout revision-layout">
        <FichaPublicacion
          publicacion={publicacion}
          servicios={servicios}
          politicas={politicas}
        />
        {lateral}
      </div>
    </>
  )
}

export default DetalleRevision
