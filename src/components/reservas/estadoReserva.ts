import type { EstadoReserva } from '../../api/reservas'

// Estados de reserva
export type TonoReserva =
  | 'accion'
  | 'espera'
  | 'exito'
  | 'revision'
  | 'terminada'
  | 'cancelada'
  | 'error'

export type IconoEstado =
  | 'tarjeta'
  | 'reloj'
  | 'verificacion'
  | 'lupa'
  | 'bandera'
  | 'cruz'
  | 'alerta'

export interface PresentacionReserva {
  etiqueta: string
  // Descripción
  descripcion: string
  tono: TonoReserva
  icono: IconoEstado
}

export const PRESENTACION_RESERVA: Record<EstadoReserva, PresentacionReserva> = {
  PENDIENTE_PAGO: {
    etiqueta: 'Pendiente de pago',
    descripcion: 'Paga para confirmar tu reserva.',
    tono: 'accion',
    icono: 'tarjeta',
  },
  PENDIENTE_APROBACION: {
    etiqueta: 'Esperando al anfitrión',
    descripcion: 'El anfitrión debe aceptar tu solicitud.',
    tono: 'espera',
    icono: 'reloj',
  },
  CONFIRMADA: {
    etiqueta: 'Confirmada',
    descripcion: 'Todo listo para tu viaje.',
    tono: 'exito',
    icono: 'verificacion',
  },
  EN_REVISION: {
    etiqueta: 'En revisión',
    descripcion: 'Estamos revisando esta reserva.',
    tono: 'revision',
    icono: 'lupa',
  },
  COMPLETADA: {
    etiqueta: 'Completada',
    descripcion: 'Tu estadía ya terminó.',
    tono: 'terminada',
    icono: 'bandera',
  },
  CANCELADA: {
    etiqueta: 'Cancelada',
    descripcion: 'Esta reserva se canceló.',
    tono: 'cancelada',
    icono: 'cruz',
  },
  PAGO_FALLIDO: {
    etiqueta: 'Pago fallido',
    descripcion: 'El cobro no se aprobó y las fechas se liberaron.',
    tono: 'error',
    icono: 'alerta',
  },
}
