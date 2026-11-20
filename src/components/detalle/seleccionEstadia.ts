import { MAXIMO_DIAS_CALENDARIO } from '../../api/alojamientos'
import { sumarDias } from './fechasCalendario'

// Selección de la estadía

// Disponibilidad
export type Disponibilidad = (fecha: string) => boolean | undefined

export function puedeLlegar(fecha: string, hoy: string, disponible: Disponibilidad) {
  return fecha >= hoy && disponible(fecha) === true
}

// Última salida
export function salidaMaxima(llegada: string, disponible: Disponibilidad) {
  let dia = llegada
  for (let n = 0; n < MAXIMO_DIAS_CALENDARIO && disponible(dia) === true; n++) {
    dia = sumarDias(dia, 1)
  }
  return dia
}

export function puedeSalir(fecha: string, llegada: string, disponible: Disponibilidad) {
  return fecha > llegada && fecha <= salidaMaxima(llegada, disponible)
}

// Noches libres
export function nochesLibres(
  llegada: string,
  salida: string,
  disponible: Disponibilidad,
): boolean | undefined {
  let desconocida = false
  for (let dia = llegada; dia < salida; dia = sumarDias(dia, 1)) {
    const libre = disponible(dia)
    if (libre === false) return false
    if (libre === undefined) desconocida = true
  }
  return desconocida ? undefined : true
}
