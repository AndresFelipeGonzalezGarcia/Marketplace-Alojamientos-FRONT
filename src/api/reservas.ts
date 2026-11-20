import { obtenerTokenSesion } from '../auth/sesion'
import { solicitarApi } from './cliente'
import type { Cotizacion, CotizacionRequest } from './cotizaciones'

// Reservas del huésped

export const ESTADOS_RESERVA = [
  'PENDIENTE_PAGO',
  'PENDIENTE_APROBACION',
  'CONFIRMADA',
  'EN_REVISION',
  'COMPLETADA',
  'CANCELADA',
  'PAGO_FALLIDO',
] as const

export type EstadoReserva = (typeof ESTADOS_RESERVA)[number]

export function esEstadoReserva(valor: unknown): valor is EstadoReserva {
  return ESTADOS_RESERVA.includes(valor as EstadoReserva)
}

// Resumen de reserva
export interface ReservaResumen {
  id: string
  fechaLlegada: string
  // Fecha de salida
  fechaSalida: string
  numeroHuespedes: number
  estado: EstadoReserva
  alojamientoId: string
  alojamientoTitulo: string
  alojamientoCiudad: string
  imagenPortada?: string | null
  total: number
}

// Listar reservas
export function listarMisReservas(estado?: EstadoReserva) {
  const consulta = estado ? `?estado=${encodeURIComponent(estado)}` : ''
  return solicitarApi<ReservaResumen[]>({
    ruta: `/api/huesped/reservas${consulta}`,
    metodo: 'GET',
    estadoExito: 200,
    token: obtenerTokenSesion(),
  })
}

// Orden de reservas
export function ordenarPorLlegada(reservas: ReservaResumen[]) {
  return [...reservas].sort((a, b) =>
    b.fechaLlegada.localeCompare(a.fechaLlegada),
  )
}

// Datos de la reserva
export type ReservaRequest = CotizacionRequest

export interface Reserva {
  id: string
  alojamientoId: string
  alojamientoTitulo: string
  alojamientoCiudad: string
  imagenPortada?: string | null
  huespedId?: string
  fechaLlegada: string
  // Fecha de salida
  fechaSalida: string
  numeroHuespedes: number
  estado: EstadoReserva
  // Desglose
  cotizacion?: Cotizacion
  creadaEn?: string
}

// Crear reserva
export function crearReserva(
  solicitud: ReservaRequest,
  claveIdempotencia: string,
) {
  return solicitarApi<Reserva>({
    ruta: '/api/huesped/reservas',
    metodo: 'POST',
    estadoExito: [201, 200],
    cuerpo: solicitud,
    cabeceras: { 'Idempotency-Key': claveIdempotencia },
    token: obtenerTokenSesion(),
  })
}

// Obtener reserva
export function obtenerReserva(id: string) {
  return solicitarApi<Reserva>({
    ruta: `/api/huesped/reservas/${encodeURIComponent(id)}`,
    metodo: 'GET',
    estadoExito: 200,
    token: obtenerTokenSesion(),
  })
}

// Pagar reserva

export type EstadoPago = 'PENDIENTE' | 'APROBADO' | 'FALLIDO' | 'PAGO_INCIERTO' | 'REEMBOLSADO'

// Escenario de pago simulado
export const ESCENARIOS_PAGO = ['APROBAR', 'RECHAZAR', 'DEMORAR', 'CAER'] as const
export type EscenarioPago = (typeof ESCENARIOS_PAGO)[number]

export interface ResultadoPago {
  pagoId: string
  reservaId: string
  estadoPago: EstadoPago
  estadoReserva: EstadoReserva
  total: number
  moneda?: string
  procesadoEn?: string
}

// Pago
export function pagarReserva(
  reservaId: string,
  claveIdempotencia: string,
  escenarioPrueba?: EscenarioPago,
) {
  return solicitarApi<ResultadoPago>({
    ruta: `/api/huesped/reservas/${encodeURIComponent(reservaId)}/pago`,
    metodo: 'POST',
    estadoExito: [200, 202],
    ...(escenarioPrueba ? { cuerpo: { escenarioPrueba } } : {}),
    cabeceras: { 'Idempotency-Key': claveIdempotencia },
    token: obtenerTokenSesion(),
  })
}
