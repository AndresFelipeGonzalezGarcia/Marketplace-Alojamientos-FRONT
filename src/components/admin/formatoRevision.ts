import { MOTIVO_MAXIMO, MOTIVO_MINIMO } from '../../api/admin'
import {
  TIPOS_ALOJAMIENTO,
  type ModoReserva,
  type TipoAlojamiento,
} from '../../api/publicaciones'

const PESOS = new Intl.NumberFormat('es-CO', {
  style: 'currency',
  currency: 'COP',
  minimumFractionDigits: 0,
  maximumFractionDigits: 2,
})

// Las fechas de envío se muestran en la hora de Colombia, como el backend.
// «12 de nov de 2026, 10:00 a. m.»: sin ambigüedad entre día y mes.
const FECHA_HORA = new Intl.DateTimeFormat('es-CO', {
  day: 'numeric',
  month: 'short',
  year: 'numeric',
  hour: 'numeric',
  minute: '2-digit',
  timeZone: 'America/Bogota',
})

const RELATIVO = new Intl.RelativeTimeFormat('es-CO', { numeric: 'auto' })

export function formatearPrecio(valor: number) {
  return PESOS.format(valor)
}

export function formatearFechaHora(instante: string) {
  const fecha = new Date(instante)
  return Number.isNaN(fecha.getTime()) ? 'Fecha desconocida' : FECHA_HORA.format(fecha)
}

// «hace 3 días», «hace 2 horas»: ayuda a ver qué lleva más tiempo esperando.
export function formatearHaceCuanto(instante: string, ahora = Date.now()) {
  const diferencia = Date.parse(instante) - ahora
  if (Number.isNaN(diferencia)) return ''
  const minutos = Math.round(diferencia / 60_000)
  if (Math.abs(minutos) < 60) return RELATIVO.format(minutos, 'minute')
  const horas = Math.round(minutos / 60)
  if (Math.abs(horas) < 24) return RELATIVO.format(horas, 'hour')
  return RELATIVO.format(Math.round(horas / 24), 'day')
}

export function etiquetaTipo(tipo: TipoAlojamiento) {
  return TIPOS_ALOJAMIENTO.find((opcion) => opcion.valor === tipo)?.etiqueta ?? tipo
}

export function etiquetaModoReserva(modo: ModoReserva) {
  return modo === 'CON_APROBACION'
    ? 'Con aprobación del anfitrión'
    : 'Reserva inmediata'
}

export function textoCapacidad(capacidad: number) {
  return `${capacidad} ${capacidad === 1 ? 'huésped' : 'huéspedes'}`
}

// Se valida el texto sin espacios de los extremos, que es lo que se envía.
export function validarMotivo(motivo: string): string | null {
  const largo = motivo.trim().length
  if (largo === 0) return 'Escribe el motivo del rechazo.'
  if (largo < MOTIVO_MINIMO) {
    return `El motivo debe tener al menos ${MOTIVO_MINIMO} caracteres.`
  }
  if (largo > MOTIVO_MAXIMO) {
    return `El motivo no puede superar los ${MOTIVO_MAXIMO} caracteres.`
  }
  return null
}
