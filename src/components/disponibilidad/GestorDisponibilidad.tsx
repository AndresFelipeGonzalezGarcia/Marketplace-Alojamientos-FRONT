import { useEffect, useState } from 'react'
import { Link } from 'react-router'
import type { ErrorApi } from '../../api/errores'
import {
  actualizarPeriodo,
  crearPeriodo,
  eliminarPeriodo,
  listarPeriodos,
  type DatosPeriodo,
  type Periodo,
} from '../../api/periodos'
import '../formulario/formulario.css'
import MensajePantalla from '../publicacion/MensajePantalla'
import AvisoError from './AvisoError'
import FilaPeriodo from './FilaPeriodo'
import FormularioPeriodo from './FormularioPeriodo'
import { ordenarPorInicio } from './validacionPeriodo'
import './disponibilidad.css'

type FaseBloqueo = 'acceso_denegado' | 'no_encontrada' | 'sesion_invalida'

type Carga =
  | { fase: 'cargando' }
  | { fase: 'lista'; periodos: Periodo[] }
  | { fase: FaseBloqueo }
  | { fase: 'error'; error: ErrorApi }

function faseDeBloqueo(error: ErrorApi): FaseBloqueo | null {
  switch (error.codigo) {
    case 'ACCESO_DENEGADO':
      return 'acceso_denegado'
    case 'PUBLICACION_NO_ENCONTRADA':
    case 'RECURSO_NO_ENCONTRADO':
      return 'no_encontrada'
    default:
      return null
  }
}

interface GestorDisponibilidadProps {
  publicacionId: string
}

function GestorDisponibilidad({ publicacionId }: GestorDisponibilidadProps) {
  const [carga, setCarga] = useState<Carga>({ fase: 'cargando' })
  const [intento, setIntento] = useState(0)
  const [editando, setEditando] = useState<Periodo | null>(null)
  const [versionFormulario, setVersionFormulario] = useState(0)
  const [confirmandoId, setConfirmandoId] = useState<string | null>(null)
  const [eliminando, setEliminando] = useState(false)
  const [errorLista, setErrorLista] = useState<ErrorApi | null>(null)
  const [aviso, setAviso] = useState('')

  useEffect(() => {
    let vigente = true
    listarPeriodos(publicacionId).then((resultado) => {
      if (!vigente) {
        return
      }
      if (resultado.estado === 'ok') {
        setCarga({
          fase: 'lista',
          periodos: ordenarPorInicio(resultado.datos),
        })
      } else if (resultado.error.codigo === 'NO_AUTENTICADO') {
        setCarga({ fase: 'sesion_invalida' })
      } else {
        const fase = faseDeBloqueo(resultado.error)
        setCarga(fase ? { fase } : { fase: 'error', error: resultado.error })
      }
    })
    return () => {
      vigente = false
    }
  }, [publicacionId, intento])

  function cambiarPeriodos(cambio: (periodos: Periodo[]) => Periodo[]) {
    setCarga((actual) =>
      actual.fase === 'lista'
        ? { fase: 'lista', periodos: ordenarPorInicio(cambio(actual.periodos)) }
        : actual,
    )
  }

  function bloquearSiCorresponde(error: ErrorApi) {
    const fase = faseDeBloqueo(error)
    if (fase) {
      setCarga({ fase })
    }
    return fase !== null
  }

  function guardarPeriodo(datos: DatosPeriodo) {
    setAviso('')
    setErrorLista(null)
    return editando
      ? actualizarPeriodo(publicacionId, editando.id, datos)
      : crearPeriodo(publicacionId, datos)
  }

  function alGuardar(periodo: Periodo) {
    cambiarPeriodos((periodos) => [
      ...periodos.filter((actual) => actual.id !== periodo.id),
      periodo,
    ])
    setAviso(editando ? 'Periodo actualizado' : 'Periodo creado')
    setEditando(null)
    setVersionFormulario((actual) => actual + 1)
  }

  async function eliminar(periodo: Periodo) {
    if (eliminando) {
      return
    }
    setAviso('')
    setErrorLista(null)
    setEliminando(true)
    const resultado = await eliminarPeriodo(publicacionId, periodo.id)
    setEliminando(false)
    setConfirmandoId(null)

    if (resultado.estado === 'ok') {
      cambiarPeriodos((periodos) =>
        periodos.filter((actual) => actual.id !== periodo.id),
      )
      setAviso('Periodo eliminado')
      if (editando?.id === periodo.id) {
        setEditando(null)
      }
    } else if (!bloquearSiCorresponde(resultado.error)) {
      setErrorLista(resultado.error)
    }
  }

  switch (carga.fase) {
    case 'cargando':
      return (
        <p className="publicacion-cargando" role="status">
          Cargando disponibilidad…
        </p>
      )
    case 'acceso_denegado':
      return (
        <MensajePantalla
          titulo="Acceso denegado"
          mensaje="No tienes permiso para gestionar esta publicación."
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
          titulo="No pudimos cargar la disponibilidad"
          mensaje={carga.error.mensaje}
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

  return (
    <>
      <Link
        className="publicacion-migas disponibilidad-volver"
        to={`/publicaciones/${encodeURIComponent(publicacionId)}/editar`}
      >
        ← Volver a la publicación
      </Link>
      <div className="publicacion-cabecera">
        <h1 className="publicacion-cabecera__titulo">Disponibilidad</h1>
      </div>

      {aviso && (
        <p className="disponibilidad-exito" role="status">
          {aviso}
        </p>
      )}

      <div className="publicacion-layout">
        <section
          className="publicacion-tarjeta"
          aria-labelledby="periodos-titulo"
        >
          <h2 id="periodos-titulo" className="publicacion-tarjeta__titulo">
            Periodos disponibles
          </h2>
          {errorLista && <AvisoError error={errorLista} />}
          {carga.periodos.length === 0 ? (
            <p className="disponibilidad-vacio">
              Aún no hay periodos disponibles. Agrega el primero.
            </p>
          ) : (
            <ul className="lista-periodos" aria-labelledby="periodos-titulo">
              {carga.periodos.map((periodo) => (
                <FilaPeriodo
                  key={periodo.id}
                  periodo={periodo}
                  confirmando={confirmandoId === periodo.id}
                  ocupado={eliminando}
                  onEditar={() => {
                    setAviso('')
                    setErrorLista(null)
                    setConfirmandoId(null)
                    setEditando(periodo)
                  }}
                  onPedirEliminar={() => {
                    setAviso('')
                    setErrorLista(null)
                    setConfirmandoId(periodo.id)
                  }}
                  onCancelarEliminar={() => setConfirmandoId(null)}
                  onEliminar={() => eliminar(periodo)}
                />
              ))}
            </ul>
          )}
        </section>

        <FormularioPeriodo
          key={`${editando?.id ?? 'nuevo'}-${versionFormulario}`}
          periodo={editando}
          onGuardar={guardarPeriodo}
          onGuardado={alGuardar}
          onBloqueado={bloquearSiCorresponde}
          onCancelar={() => setEditando(null)}
        />
      </div>
    </>
  )
}

export default GestorDisponibilidad
