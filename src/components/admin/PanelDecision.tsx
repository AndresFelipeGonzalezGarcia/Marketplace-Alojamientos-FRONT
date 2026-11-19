import { useEffect, useRef, useState, type FormEvent } from 'react'
import {
  aprobarPublicacion,
  MOTIVO_MAXIMO,
  MOTIVO_MINIMO,
  rechazarPublicacion,
} from '../../api/admin'
import { mensajeConReferencia, type ErrorApi } from '../../api/errores'
import type { Publicacion } from '../../api/publicaciones'
import { bloqueoDe, type BloqueoRevision } from './errorRevision'
import { validarMotivo } from './formatoRevision'

export type Decision = 'aprobada' | 'rechazada'

interface PanelDecisionProps {
  publicacionId: string
  titulo: string
  onDecidida: (decision: Decision, publicacion: Publicacion) => void
  onBloqueo: (bloqueo: BloqueoRevision) => void
}

type Modo = 'inicio' | 'aprobar' | 'rechazar'

const ID_MOTIVO = 'revision-motivo'

// Panel lateral con las dos decisiones posibles sobre una publicación
// pendiente. Mientras se envía una, ambos botones quedan bloqueados.
function PanelDecision({
  publicacionId,
  titulo,
  onDecidida,
  onBloqueo,
}: PanelDecisionProps) {
  const [modo, setModo] = useState<Modo>('inicio')
  const [enviando, setEnviando] = useState(false)
  const [error, setError] = useState<ErrorApi | null>(null)
  const [motivo, setMotivo] = useState('')
  const [errorMotivo, setErrorMotivo] = useState<string | null>(null)
  const campoMotivo = useRef<HTMLTextAreaElement>(null)
  const botonConfirmar = useRef<HTMLButtonElement>(null)

  useEffect(() => {
    if (modo === 'rechazar') campoMotivo.current?.focus()
    if (modo === 'aprobar') botonConfirmar.current?.focus()
  }, [modo])

  function cambiarModo(nuevo: Modo) {
    setError(null)
    setErrorMotivo(null)
    setModo(nuevo)
  }

  async function decidir(decision: Decision) {
    if (enviando) return
    setError(null)
    setEnviando(true)
    const resultado =
      decision === 'aprobada'
        ? await aprobarPublicacion(publicacionId)
        : await rechazarPublicacion(publicacionId, motivo.trim())
    setEnviando(false)

    if (resultado.estado === 'ok') {
      onDecidida(decision, resultado.datos)
      return
    }

    const bloqueo = bloqueoDe(resultado.error)
    if (bloqueo) {
      onBloqueo(bloqueo)
    } else if (resultado.error.erroresPorCampo.motivo) {
      setErrorMotivo(resultado.error.erroresPorCampo.motivo)
      campoMotivo.current?.focus()
    } else {
      setError(resultado.error)
    }
  }

  function enviarRechazo(evento: FormEvent) {
    evento.preventDefault()
    const problema = validarMotivo(motivo)
    setErrorMotivo(problema)
    if (problema) {
      campoMotivo.current?.focus()
      return
    }
    void decidir('rechazada')
  }

  const largo = motivo.trim().length
  const avisoError = error && (
    <p className="panel-decision__error" role="alert">
      {mensajeConReferencia(error)}
    </p>
  )

  return (
    <aside
      className="publicacion-tarjeta panel-decision"
      aria-labelledby="panel-decision-titulo"
      aria-busy={enviando || undefined}
    >
      <h2 id="panel-decision-titulo" className="publicacion-tarjeta__titulo">
        Tu decisión
      </h2>

      {modo === 'inicio' && (
        <>
          <p className="panel-decision__texto">
            Revisa que las fotos, la descripción y las condiciones sean claras y
            correspondan al alojamiento.
          </p>
          <div className="panel-decision__acciones">
            <button
              className="boton-principal"
              type="button"
              onClick={() => cambiarModo('aprobar')}
            >
              Aprobar
            </button>
            <button
              className="boton-secundario boton-secundario--peligro"
              type="button"
              onClick={() => cambiarModo('rechazar')}
            >
              Rechazar
            </button>
          </div>
        </>
      )}

      {modo === 'aprobar' && (
        <div className="panel-decision__confirmacion">
          <p className="panel-decision__pregunta">
            ¿Aprobar «{titulo}»?
          </p>
          <p className="panel-decision__texto">
            Quedará activa y los huéspedes podrán encontrarla y reservarla.
          </p>
          {avisoError}
          <div className="panel-decision__acciones">
            <button
              ref={botonConfirmar}
              className="boton-principal"
              type="button"
              disabled={enviando}
              aria-busy={enviando || undefined}
              onClick={() => void decidir('aprobada')}
            >
              {enviando ? 'Aprobando…' : 'Sí, aprobar'}
            </button>
            <button
              className="boton-secundario"
              type="button"
              disabled={enviando}
              onClick={() => cambiarModo('inicio')}
            >
              Cancelar
            </button>
          </div>
        </div>
      )}

      {modo === 'rechazar' && (
        <form className="panel-decision__formulario" noValidate onSubmit={enviarRechazo}>
          <div className="campo">
            <label className="campo__etiqueta" htmlFor={ID_MOTIVO}>
              Motivo del rechazo
            </label>
            <p className="panel-decision__advertencia" id={`${ID_MOTIVO}-aviso`}>
              El anfitrión leerá este texto tal como lo escribas. Explica qué debe
              corregir, con claridad y respeto.
            </p>
            <textarea
              ref={campoMotivo}
              id={ID_MOTIVO}
              className="campo__control panel-decision__motivo"
              rows={6}
              value={motivo}
              disabled={enviando}
              aria-invalid={errorMotivo ? true : undefined}
              aria-describedby={`${ID_MOTIVO}-aviso ${ID_MOTIVO}-conteo${errorMotivo ? ` ${ID_MOTIVO}-error` : ''}`}
              onChange={(evento) => {
                setMotivo(evento.target.value)
                // El error se corrige mientras se escribe, sin esperar a enviar.
                if (errorMotivo) setErrorMotivo(validarMotivo(evento.target.value))
              }}
            />
            <p
              id={`${ID_MOTIVO}-conteo`}
              className={`campo__ayuda panel-decision__conteo${largo > MOTIVO_MAXIMO ? ' panel-decision__conteo--excedido' : ''}`}
            >
              {largo} de {MOTIVO_MAXIMO} caracteres (mínimo {MOTIVO_MINIMO})
            </p>
            {errorMotivo && (
              <p id={`${ID_MOTIVO}-error`} className="campo__error">
                {errorMotivo}
              </p>
            )}
          </div>
          {avisoError}
          <div className="panel-decision__acciones">
            <button
              className="boton-principal boton-principal--peligro"
              type="submit"
              disabled={enviando}
              aria-busy={enviando || undefined}
            >
              {enviando ? 'Rechazando…' : 'Rechazar publicación'}
            </button>
            <button
              className="boton-secundario"
              type="button"
              disabled={enviando}
              onClick={() => cambiarModo('inicio')}
            >
              Cancelar
            </button>
          </div>
        </form>
      )}
    </aside>
  )
}

export default PanelDecision
