import { useEffect, useRef, useState } from 'react'
import { useNavigate } from 'react-router'
import type { ErrorApi } from '../../api/errores'
import { crearReserva } from '../../api/reservas'
import { rutaReserva } from '../reservas/formatoReserva'
import type { Estadia } from './estadia'

// Reserva creada
export interface EstadoReservaCreada {
  recienCreada: true
}

export type EstadoEnvioReserva =
  | { fase: 'cerrada' }
  // Confirmación abierta
  | { fase: 'confirmando'; error: ErrorApi | null }
  | { fase: 'enviando' }

interface Clave {
  // Firma de la reserva
  firma: string
  valor: string
}

interface OpcionesReserva {
  alojamientoId: string
  estadia: Estadia | null
  huespedes: number
  // Fechas ocupadas
  onPeriodoNoDisponible: (estadia: Estadia) => void
}

// Errores sin reintento
const SIN_REINTENTO = new Set([
  'CAPACIDAD_EXCEDIDA',
  'FECHAS_INVALIDAS',
  'SOLICITUD_INVALIDA',
  'ALOJAMIENTO_NO_ENCONTRADO',
  'ACCESO_DENEGADO',
])

export function puedeReintentar(error: ErrorApi) {
  return !SIN_REINTENTO.has(error.codigo)
}

// Reserva
export function useReserva({
  alojamientoId,
  estadia,
  huespedes,
  onPeriodoNoDisponible,
}: OpcionesReserva) {
  const navigate = useNavigate()
  const [clave, setClave] = useState<Clave | null>(null)
  const [envio, setEnvio] = useState<{ firma: string; estado: EstadoEnvioReserva } | null>(null)
  // Doble clic
  const enviando = useRef(false)
  const montado = useRef(true)

  useEffect(() => {
    montado.current = true
    return () => {
      montado.current = false
    }
  }, [])

  const firma = estadia
    ? `${alojamientoId}|${estadia.llegada}|${estadia.salida}|${huespedes}`
    : null
  // Reserva cambiada
  const estado: EstadoEnvioReserva =
    envio && envio.firma === firma ? envio.estado : { fase: 'cerrada' }

  function abrir() {
    if (!firma) return
    if (clave?.firma !== firma) {
      setClave({ firma, valor: crypto.randomUUID() })
    }
    setEnvio({ firma, estado: { fase: 'confirmando', error: null } })
  }

  function cerrar() {
    if (enviando.current) return
    setEnvio(null)
  }

  async function confirmar() {
    if (!firma || !estadia || enviando.current) return
    // Clave de idempotencia
    if (clave?.firma !== firma) return
    enviando.current = true
    setEnvio({ firma, estado: { fase: 'enviando' } })

    const resultado = await crearReserva(
      {
        alojamientoId,
        fechaLlegada: estadia.llegada,
        fechaSalida: estadia.salida,
        numeroHuespedes: huespedes,
      },
      clave.valor,
    )
    enviando.current = false
    if (!montado.current) return

    if (resultado.estado === 'ok') {
      const destino: EstadoReservaCreada = { recienCreada: true }
      navigate(rutaReserva(resultado.datos.id), { state: destino })
      return
    }

    const { error } = resultado
    if (error.codigo === 'PERIODO_NO_DISPONIBLE') {
      setEnvio(null)
      onPeriodoNoDisponible(estadia)
      return
    }
    if (error.codigo === 'IDEMPOTENCIA_CONFLICTO') {
      // Conflicto de idempotencia
      setClave({ firma, valor: crypto.randomUUID() })
    }
    setEnvio({ firma, estado: { fase: 'confirmando', error } })
  }

  return { estado, abrir, cerrar, confirmar }
}
