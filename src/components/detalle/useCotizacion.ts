import { useEffect, useEffectEvent, useState } from 'react'
import type { ResultadoApi } from '../../api/cliente'
import { cotizarEstadia, type Cotizacion } from '../../api/cotizaciones'
import type { ErrorApi } from '../../api/errores'
import type { Estadia } from './estadia'

export type EstadoCotizacion =
  // Faltan fechas o no hay sesión de huésped: no se pide nada.
  | { fase: 'inactiva' }
  | { fase: 'cargando' }
  | { fase: 'lista'; cotizacion: Cotizacion }
  | { fase: 'error'; error: ErrorApi }

interface Respuesta {
  // Qué estadía (y qué intento) contestó: si no es la actual, se carga.
  solicitud: string
  resultado: ResultadoApi<Cotizacion>
}

interface OpcionesCotizacion {
  alojamientoId: string
  estadia: Estadia | null
  huespedes: number
  activa: boolean
  // Las fechas se ocuparon mientras se miraba (409 PERIODO_NO_DISPONIBLE).
  onPeriodoNoDisponible: (estadia: Estadia) => void
}

// Pide la cotización cada vez que cambian las fechas o los huéspedes. Una
// respuesta que llega tarde (de una elección anterior) se descarta.
export function useCotizacion({
  alojamientoId,
  estadia,
  huespedes,
  activa,
  onPeriodoNoDisponible,
}: OpcionesCotizacion) {
  const [intento, setIntento] = useState(0)
  const [respuesta, setRespuesta] = useState<Respuesta | null>(null)
  const llegada = estadia?.llegada ?? null
  const salida = estadia?.salida ?? null
  const noches = estadia?.noches ?? 0
  const solicitud =
    activa && llegada && salida
      ? `${alojamientoId}|${llegada}|${salida}|${huespedes}#${intento}`
      : null

  const avisarConflicto = useEffectEvent((ocupada: Estadia) => onPeriodoNoDisponible(ocupada))

  useEffect(() => {
    if (!activa || !llegada || !salida) return
    let vigente = true
    const clave = `${alojamientoId}|${llegada}|${salida}|${huespedes}#${intento}`
    cotizarEstadia({
      alojamientoId,
      fechaLlegada: llegada,
      fechaSalida: salida,
      numeroHuespedes: huespedes,
    }).then((resultado) => {
      if (!vigente) return
      setRespuesta({ solicitud: clave, resultado })
      if (resultado.estado === 'error' && resultado.error.codigo === 'PERIODO_NO_DISPONIBLE') {
        avisarConflicto({ llegada, salida, noches })
      }
    })
    return () => {
      vigente = false
    }
  }, [alojamientoId, llegada, salida, noches, huespedes, activa, intento])

  let estado: EstadoCotizacion
  if (!solicitud) estado = { fase: 'inactiva' }
  else if (!respuesta || respuesta.solicitud !== solicitud) estado = { fase: 'cargando' }
  else if (respuesta.resultado.estado === 'ok') {
    estado = { fase: 'lista', cotizacion: respuesta.resultado.datos }
  } else estado = { fase: 'error', error: respuesta.resultado.error }

  return { estado, reintentar: () => setIntento((actual) => actual + 1) }
}
