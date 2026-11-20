import { useEffect, useRef, useState } from 'react'
import { useNavigate } from 'react-router'
import type { ErrorApi } from '../../api/errores'
import { pagarReserva, type EscenarioPago, type ResultadoPago } from '../../api/reservas'
import { rutaReserva } from '../reservas/formatoReserva'
import { claveDePago, leerRegistroPago, marcarPagoIncierto } from './registroPago'

// Pago aprobado
export interface EstadoPagoAprobado {
  pagoAprobado: true
}

export type FasePago =
  | { fase: 'lista' }
  | { fase: 'procesando' }
  // Pago incierto
  | { fase: 'incierto'; resultado: ResultadoPago | null }
  // Pago rechazado
  | { fase: 'rechazado'; error: ErrorApi }
  // Servicio no disponible
  | { fase: 'no-disponible'; error: ErrorApi }
  // Conflicto
  | { fase: 'estado-invalido'; error: ErrorApi }
  // Error de red
  | { fase: 'error'; error: ErrorApi }

export function usePago(reservaId: string) {
  const navigate = useNavigate()
  // Estado inicial
  const [estado, setEstado] = useState<FasePago>(() =>
    leerRegistroPago(reservaId)?.incierto ? { fase: 'incierto', resultado: null } : { fase: 'lista' },
  )
  // Doble clic
  const enCurso = useRef(false)
  const montado = useRef(true)

  useEffect(() => {
    montado.current = true
    return () => {
      montado.current = false
    }
  }, [])

  const procesando = estado.fase === 'procesando'

  // Cierre de pestaña
  useEffect(() => {
    if (!procesando) return
    const avisar = (evento: BeforeUnloadEvent) => {
      evento.preventDefault()
    }
    window.addEventListener('beforeunload', avisar)
    return () => window.removeEventListener('beforeunload', avisar)
  }, [procesando])

  async function pagar(escenario?: EscenarioPago) {
    if (enCurso.current) return
    if (estado.fase !== 'lista' && estado.fase !== 'no-disponible' && estado.fase !== 'error') return
    enCurso.current = true
    setEstado({ fase: 'procesando' })

    const resultado = await pagarReserva(reservaId, claveDePago(reservaId), escenario)
    enCurso.current = false

    if (resultado.estado === 'ok') {
      // Resultado del pago
      if (resultado.datos?.estadoPago === 'APROBADO') {
        if (!montado.current) return
        const destino: EstadoPagoAprobado = { pagoAprobado: true }
        navigate(rutaReserva(reservaId), { state: destino, replace: true })
        return
      }
      marcarPagoIncierto(reservaId)
      if (montado.current) setEstado({ fase: 'incierto', resultado: resultado.datos ?? null })
      return
    }

    if (!montado.current) return
    const { error } = resultado
    switch (error.codigo) {
      case 'PAGO_RECHAZADO':
        setEstado({ fase: 'rechazado', error })
        break
      case 'SERVICIO_PAGOS_NO_DISPONIBLE':
        setEstado({ fase: 'no-disponible', error })
        break
      case 'ESTADO_RESERVA_INVALIDO':
        setEstado({ fase: 'estado-invalido', error })
        break
      default:
        setEstado({ fase: 'error', error })
    }
  }

  return { estado, pagar }
}
