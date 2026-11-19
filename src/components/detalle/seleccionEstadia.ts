import { MAXIMO_DIAS_CALENDARIO } from '../../api/alojamientos'
import { sumarDias } from './fechasCalendario'

// Reglas de selección del calendario. La salida es exclusiva: del 10 al 14
// se ocupan las noches 10 a 13, así que el día 14 puede estar ocupado (por
// ejemplo, porque otra reserva llega ese día) y aun así ser la salida.

// true / false si se sabe, undefined si ese día no se ha cargado.
export type Disponibilidad = (fecha: string) => boolean | undefined

export function puedeLlegar(fecha: string, hoy: string, disponible: Disponibilidad) {
  return fecha >= hoy && disponible(fecha) === true
}

// Última salida posible desde `llegada`: el primer día que no está libre
// (o que no se conoce) después de una racha de noches libres.
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

// ¿Están libres todas las noches? undefined mientras falte cargar alguna.
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
