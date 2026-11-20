import { useEffect, useRef, useState } from 'react'
import { useNavigate } from 'react-router'
import type { ErrorApi } from '../../api/errores'
import { crearReserva } from '../../api/reservas'
import { rutaReserva } from '../reservas/formatoReserva'
import type { Estadia } from './estadia'

// Lo que el detalle de la reserva lee del estado de navegación para saber que
// se acaba de crear y explicar qué sigue.
export interface EstadoReservaCreada {
  recienCreada: true
}

export type EstadoEnvioReserva =
  | { fase: 'cerrada' }
  // La confirmación está abierta; `error` es el del último intento, si falló.
  | { fase: 'confirmando'; error: ErrorApi | null }
  | { fase: 'enviando' }

interface Clave {
  // Qué reserva identifica: alojamiento, fechas y huéspedes.
  firma: string
  valor: string
}

interface OpcionesReserva {
  alojamientoId: string
  estadia: Estadia | null
  huespedes: number
  // 409 PERIODO_NO_DISPONIBLE: alguien reservó primero.
  onPeriodoNoDisponible: (estadia: Estadia) => void
}

// Códigos con los que repetir el envío tal cual no sirve de nada: hay que
// cambiar algo (fechas, huéspedes) o volver a confirmar.
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

// Confirmación y envío de la reserva.
//
// La clave de idempotencia se genera al abrir la confirmación y se guarda
// junto con la reserva que identifica. Mientras alojamiento, fechas y
// huéspedes no cambien, cada reintento (y cada vez que se cierra y se vuelve
// a abrir) usa la misma clave: si un intento anterior llegó a crear la
// reserva aunque la respuesta se perdiera, el backend devuelve esa misma en
// vez de crear otra. Solo una reserva distinta lleva una clave nueva.
export function useReserva({
  alojamientoId,
  estadia,
  huespedes,
  onPeriodoNoDisponible,
}: OpcionesReserva) {
  const navigate = useNavigate()
  const [clave, setClave] = useState<Clave | null>(null)
  const [envio, setEnvio] = useState<{ firma: string; estado: EstadoEnvioReserva } | null>(null)
  // Un segundo clic llega antes de que React vuelva a pintar el botón
  // deshabilitado: este ref lo frena en el acto.
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
  // Si la reserva cambió con la confirmación abierta (p. ej. «atrás» en el
  // navegador), esa confirmación ya no vale y se da por cerrada.
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
    // Abrir siempre deja una clave para la firma actual; por si acaso, no se
    // envía nunca sin ella.
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
      // El backend tiene esa clave asociada a otros datos, así que con ella
      // esta reserva no se va a crear nunca, y tampoco existe ya una creada
      // con estos datos: es seguro empezar con una clave nueva.
      setClave({ firma, valor: crypto.randomUUID() })
    }
    setEnvio({ firma, estado: { fase: 'confirmando', error } })
  }

  return { estado, abrir, cerrar, confirmar }
}
