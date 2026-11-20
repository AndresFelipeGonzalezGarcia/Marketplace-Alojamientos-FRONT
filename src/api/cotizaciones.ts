import { obtenerTokenSesion } from '../auth/sesion'
import { solicitarApi } from './cliente'

// Cotización

export interface CotizacionRequest {
  alojamientoId: string
  fechaLlegada: string
  // Fecha de salida
  fechaSalida: string
  numeroHuespedes: number
}

export interface Cotizacion {
  noches: number
  precioNoche: number
  subtotal: number
  tarifaLimpieza: number
  tarifaServicio: number
  // Porcentaje
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
