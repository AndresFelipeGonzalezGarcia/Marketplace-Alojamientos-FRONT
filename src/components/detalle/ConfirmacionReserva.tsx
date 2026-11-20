import { useEffect, useId, useRef } from 'react'
import type { ModoReserva } from '../../api/publicaciones'
import { mensajeConReferencia } from '../../api/errores'
import { formatearDia, textoNoches } from '../busqueda/filtrosBusqueda'
import { formatearImporte, textoCapacidad } from '../formato/formato'
import type { Estadia } from './estadia'
import { puedeReintentar, type EstadoEnvioReserva } from './useReserva'

interface ConfirmacionReservaProps {
  alojamientoTitulo: string
  capacidad: number
  modoReserva: ModoReserva
  estadia: Estadia
  huespedes: number
  total: number
  moneda?: string
  // Fase
  estado: Exclude<EstadoEnvioReserva, { fase: 'cerrada' }>
  onConfirmar: () => void
  onCerrar: () => void
}

// Confirmación de reserva
function ConfirmacionReserva({
  alojamientoTitulo,
  capacidad,
  modoReserva,
  estadia,
  huespedes,
  total,
  moneda,
  estado,
  onConfirmar,
  onCerrar,
}: ConfirmacionReservaProps) {
  const dialogo = useRef<HTMLDialogElement>(null)
  const idTitulo = useId()
  const enviando = estado.fase === 'enviando'
  const error = estado.fase === 'confirmando' ? estado.error : null
  const reintentable = !error || puedeReintentar(error)
  const inmediata = modoReserva === 'INMEDIATA'

  useEffect(() => {
    const elemento = dialogo.current
    if (!elemento) return
    // Diálogo en jsdom
    if (typeof elemento.showModal === 'function') elemento.showModal()
    else elemento.setAttribute('open', '')
    return () => {
      if (elemento.open) elemento.close?.()
    }
  }, [])

  let textoError = error ? mensajeConReferencia(error) : null
  if (error?.codigo === 'CAPACIDAD_EXCEDIDA') {
    textoError = `Este alojamiento admite hasta ${textoCapacidad(capacidad)}. Vuelve, quita huéspedes y confirma de nuevo.`
  }

  return (
    <dialog
      ref={dialogo}
      className="confirmacion-reserva"
      aria-labelledby={idTitulo}
      aria-busy={enviando || undefined}
      onCancel={(evento) => {
        // Tecla Esc
        evento.preventDefault()
        onCerrar()
      }}
    >
      <h2 className="confirmacion-reserva__titulo" id={idTitulo}>
        {inmediata ? 'Confirma tu reserva' : 'Confirma tu solicitud'}
      </h2>

      <dl className="confirmacion-reserva__resumen">
        <div>
          <dt>Alojamiento</dt>
          <dd>{alojamientoTitulo}</dd>
        </div>
        <div>
          <dt>Fechas</dt>
          <dd>
            Del {formatearDia(estadia.llegada)} al {formatearDia(estadia.salida)}
          </dd>
        </div>
        <div>
          <dt>Noches</dt>
          <dd>{textoNoches(estadia.noches)}</dd>
        </div>
        <div>
          <dt>Huéspedes</dt>
          <dd>{textoCapacidad(huespedes)}</dd>
        </div>
        <div className="confirmacion-reserva__total">
          <dt>Total</dt>
          <dd>{formatearImporte(total, moneda)}</dd>
        </div>
      </dl>

      <p className="confirmacion-reserva__modo">
        {inmediata
          ? 'Las fechas quedan apartadas para ti y pasas directo al pago. Aún no se te cobra nada.'
          : 'El anfitrión debe aceptar tu solicitud antes de que puedas pagar. Aún no se te cobra nada.'}
      </p>

      {textoError && (
        <div className="confirmacion-reserva__error" role="alert">
          <p className="confirmacion-reserva__error-titulo">
            {reintentable ? 'No pudimos crear la reserva' : 'No se puede crear esta reserva'}
          </p>
          <p>{textoError}</p>
        </div>
      )}

      <div className="confirmacion-reserva__acciones">
        <button className="boton-secundario" type="button" onClick={onCerrar} disabled={enviando}>
          {reintentable ? 'Volver' : 'Volver y cambiar'}
        </button>
        {reintentable && (
          <button
            className="boton-principal"
            type="button"
            onClick={onConfirmar}
            disabled={enviando}
            aria-busy={enviando || undefined}
          >
            {enviando ? (
              <>
                <span className="confirmacion-reserva__indicador" aria-hidden="true" />
                Reservando…
              </>
            ) : error ? (
              'Reintentar'
            ) : inmediata ? (
              'Confirmar y reservar'
            ) : (
              'Enviar solicitud'
            )}
          </button>
        )}
      </div>
    </dialog>
  )
}

export default ConfirmacionReserva
