import { obtenerTokenSesion } from '../auth/sesion'
import { solicitarApi } from './cliente'

// POST /api/huesped/cotizaciones. PROPUESTA en el contrato, rol HUESPED.
// No reserva ni bloquea nada. El desglose lo calcula el backend: el frontend
// solo lo muestra, para que el total que se ve sea el que se cobra.

export interface CotizacionRequest {
  alojamientoId: string
  fechaLlegada: string
  // Exclusiva: es el día de salida, esa noche no se cuenta.
  fechaSalida: string
  numeroHuespedes: number
}

export interface Cotizacion {
  noches: number
  precioNoche: number
  subtotal: number
  tarifaLimpieza: number
  tarifaServicio: number
  // Por ejemplo 8.5 (no 0.085).
  porcentajeTarifaServicio: number
  total: number
  moneda?: string
}

export function cotizarEstadia(solicitud: CotizacionRequest) {
  return solicitarApi<Cotizacion>({
    ruta: '/api/huesped/cotizaciones',
    metodo: 'POST',
    estadoExito: 200,
    cuerpo: solicitud,
    token: obtenerTokenSesion(),
  })
}
