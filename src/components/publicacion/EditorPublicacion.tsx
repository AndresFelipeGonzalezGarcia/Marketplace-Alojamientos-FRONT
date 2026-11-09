import { useEffect, useState } from 'react'
import {
  obtenerPublicacion,
  type Publicacion,
  type ResultadoPublicacion,
} from '../../api/publicaciones'
import FormularioPublicacion from './FormularioPublicacion'
import MensajePantalla from './MensajePantalla'

type Carga =
  | { fase: 'cargando' }
  | { fase: 'lista'; publicacion: Publicacion | null }
  | { fase: 'acceso_denegado' }
  | { fase: 'no_encontrada' }
  | { fase: 'sesion_invalida' }
  | { fase: 'error' }

function traducirCarga(resultado: ResultadoPublicacion): Carga {
  if (resultado.estado === 'ok') {
    return { fase: 'lista', publicacion: resultado.datos }
  }
  switch (resultado.error.codigo) {
    case 'ACCESO_DENEGADO':
      return { fase: 'acceso_denegado' }
    case 'PUBLICACION_NO_ENCONTRADA':
    case 'RECURSO_NO_ENCONTRADO':
      return { fase: 'no_encontrada' }
    case 'NO_AUTENTICADO':
      return { fase: 'sesion_invalida' }
    default:
      return { fase: 'error' }
  }
}

interface EditorPublicacionProps {
  id?: string
  borradorRecienGuardado: boolean
  onCreada: (publicacion: Publicacion) => void
}

function EditorPublicacion({
  id,
  borradorRecienGuardado,
  onCreada,
}: EditorPublicacionProps) {
  const [carga, setCarga] = useState<Carga>(
    id ? { fase: 'cargando' } : { fase: 'lista', publicacion: null },
  )
  const [intento, setIntento] = useState(0)

  useEffect(() => {
    if (!id) {
      return
    }
    let vigente = true
    obtenerPublicacion(id).then((resultado) => {
      if (vigente) {
        setCarga(traducirCarga(resultado))
      }
    })
    return () => {
      vigente = false
    }
  }, [id, intento])

  switch (carga.fase) {
    case 'cargando':
      return (
        <p className="publicacion-cargando" role="status">
          Cargando publicación…
        </p>
      )
    case 'acceso_denegado':
      return (
        <MensajePantalla
          titulo="Acceso denegado"
          mensaje="No tienes permiso para editar esta publicación."
        />
      )
    case 'no_encontrada':
      return (
        <MensajePantalla
          titulo="Publicación no encontrada"
          mensaje="La publicación que buscas no existe o fue eliminada."
        />
      )
    case 'sesion_invalida':
      return (
        <MensajePantalla
          titulo="Tu sesión no es válida"
          mensaje="Inicia sesión de nuevo para continuar."
        />
      )
    case 'error':
      return (
        <MensajePantalla
          titulo="No pudimos cargar la publicación"
          mensaje="Inténtalo de nuevo en unos minutos."
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
      return (
        <FormularioPublicacion
          publicacion={carga.publicacion}
          borradorRecienGuardado={borradorRecienGuardado}
          onCreada={onCreada}
          onBloqueada={(motivo) => setCarga({ fase: motivo })}
        />
      )
  }
}

export default EditorPublicacion
