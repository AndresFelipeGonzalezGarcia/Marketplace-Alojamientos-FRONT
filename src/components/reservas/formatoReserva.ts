import { contarNoches, textoNoches } from '../busqueda/filtrosBusqueda'
import { textoCapacidad } from '../formato/formato'

// Las fechas del contrato son días sin hora: se leen en UTC para que la zona
// horaria del navegador no las corra un día.
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

// «3 noches · 2 huéspedes». Sin noches si las fechas no cuadran.
export function textoEstadia(llegada: string, salida: string, huespedes: number) {
  const noches = contarNoches(llegada, salida)
  const partes = [textoCapacidad(huespedes)]
  if (noches !== null) partes.unshift(textoNoches(noches))
  return partes.join(' · ')
}

export function rutaReserva(id: string) {
  return `/reservas/${encodeURIComponent(id)}`
}
