import { contarNoches, textoNoches } from '../busqueda/filtrosBusqueda'
import { textoCapacidad } from '../formato/formato'

// Fechas
const FECHA = new Intl.DateTimeFormat('es-CO', {
  day: 'numeric',
  month: 'short',
  year: 'numeric',
  timeZone: 'UTC',
})

export function formatearFecha(fecha: string) {
  const instante = new Date(`${fecha}T00:00:00Z`)
  return Number.isNaN(instante.getTime()) ? fecha : FECHA.format(instante)
}

// Noches y huéspedes
export function textoEstadia(llegada: string, salida: string, huespedes: number) {
  const noches = contarNoches(llegada, salida)
  const partes = [textoCapacidad(huespedes)]
  if (noches !== null) partes.unshift(textoNoches(noches))
  return partes.join(' · ')
}

export function rutaReserva(id: string) {
  return `/reservas/${encodeURIComponent(id)}`
}
