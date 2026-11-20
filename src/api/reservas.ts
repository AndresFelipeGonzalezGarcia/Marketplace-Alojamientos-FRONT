import { obtenerTokenSesion } from '../auth/sesion'
import { solicitarApi } from './cliente'

// GET /api/huesped/reservas. PROPUESTA en el contrato, rol HUESPED.

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
