import { obtenerTokenSesion } from '../auth/sesion'
import { solicitarApi } from './cliente'
import type { Cotizacion, CotizacionRequest } from './cotizaciones'

// /api/huesped/reservas. PROPUESTA en el contrato, rol HUESPED.

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

// ReservaResumen del contrato tal como llega en «mis reservas»: con los
// datos del alojamiento. No trae noches: se cuentan con las fechas.
export interface ReservaResumen {
  id: string
  fechaLlegada: string
  // Exclusiva: es el día de salida.
  fechaSalida: string
  numeroHuespedes: number
  estado: EstadoReserva
  alojamientoId: string
  alojamientoTitulo: string
  alojamientoCiudad: string
  imagenPortada?: string | null
  total: number
}

// Sin `estado`, todas las del huésped autenticado.
export function listarMisReservas(estado?: EstadoReserva) {
  const consulta = estado ? `?estado=${encodeURIComponent(estado)}` : ''
  return solicitarApi<ReservaResumen[]>({
    ruta: `/api/huesped/reservas${consulta}`,
    metodo: 'GET',
    estadoExito: 200,
    token: obtenerTokenSesion(),
  })
}

// El contrato ya pide este orden; se reordena por si acaso. Las fechas son
// yyyy-MM-dd, así que se comparan como texto.
export function ordenarPorLlegada(reservas: ReservaResumen[]) {
  return [...reservas].sort((a, b) =>
    b.fechaLlegada.localeCompare(a.fechaLlegada),
  )
}

// ReservaRequest del contrato: los mismos datos que la cotización. El precio
// lo recalcula el backend, no se manda.
export type ReservaRequest = CotizacionRequest

export interface Reserva {
  id: string
  alojamientoId: string
  alojamientoTitulo: string
  alojamientoCiudad: string
  imagenPortada?: string | null
  huespedId?: string
  fechaLlegada: string
  // Exclusiva: es el día de salida.
  fechaSalida: string
  numeroHuespedes: number
  estado: EstadoReserva
  // El desglose con que se creó la reserva, calculado por el backend.
  cotizacion?: Cotizacion
  creadaEn?: string
}

// POST /api/huesped/reservas. `claveIdempotencia` va en la cabecera
// Idempotency-Key y tiene que ser la misma en cada reintento de la misma
// reserva: con ella el backend devuelve la ya creada (200) en vez de crear
// otra (201). Las dos respuestas son un éxito.
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

// GET /api/huesped/reservas/{reservaId}. Solo las del huésped autenticado.
export function obtenerReserva(id: string) {
  return solicitarApi<Reserva>({
    ruta: `/api/huesped/reservas/${encodeURIComponent(id)}`,
    metodo: 'GET',
    estadoExito: 200,
    token: obtenerTokenSesion(),
  })
}
