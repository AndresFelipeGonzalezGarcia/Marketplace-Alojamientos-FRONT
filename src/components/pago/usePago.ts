import { useEffect, useRef, useState } from 'react'
import { useNavigate } from 'react-router'
import type { ErrorApi } from '../../api/errores'
import { pagarReserva, type EscenarioPago, type ResultadoPago } from '../../api/reservas'
import { rutaReserva } from '../reservas/formatoReserva'
import { claveDePago, leerRegistroPago, marcarPagoIncierto } from './registroPago'

// Lo que el detalle de la reserva lee del estado de navegación tras un pago
// aprobado, para mostrar la confirmación.
export interface EstadoPagoAprobado {
  pagoAprobado: true
}

export type FasePago =
  | { fase: 'lista' }
  | { fase: 'procesando' }
  // 202: lo resolverá la conciliación. Nunca se ofrece volver a cobrar.
  | { fase: 'incierto'; resultado: ResultadoPago | null }
  // 402: compensación hecha, reserva en PAGO_FALLIDO y fechas liberadas.
  | { fase: 'rechazado'; error: ErrorApi }
  // 503: circuit breaker abierto. Se puede reintentar más tarde.
  | { fase: 'no-disponible'; error: ErrorApi }
  // 409: la reserva no está en PENDIENTE_PAGO.
  | { fase: 'estado-invalido'; error: ErrorApi }
  // Red caída, 500…: no se sabe si el cobro llegó. Reintentar es seguro
  // porque va con la misma clave.
  | { fase: 'error'; error: ErrorApi }

export function usePago(reservaId: string) {
  const navigate = useNavigate()
  // Si ya hubo un 202 para esta reserva, se arranca en «incierto».
  const [estado, setEstado] = useState<FasePago>(() =>
    leerRegistroPago(reservaId)?.incierto ? { fase: 'incierto', resultado: null } : { fase: 'lista' },
  )
  // Frena un segundo clic antes de que React quite el botón.
  const enCurso = useRef(false)
  const montado = useRef(true)

  useEffect(() => {
    montado.current = true
    return () => {
      montado.current = false
    }
  }, [])

  const procesando = estado.fase === 'procesando'

  // Cerrar o recargar la pestaña a mitad del cobro: el navegador pide confirmar.
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
      // Solo APROBADO es un éxito. Cualquier otro 2xx (el 202, o algo que no
      // se esperaba) se trata como incierto: es lo único seguro, porque no
      // invita a cobrar otra vez.
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
