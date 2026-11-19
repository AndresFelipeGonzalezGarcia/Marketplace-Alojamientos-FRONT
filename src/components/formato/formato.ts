import {
  TIPOS_ALOJAMIENTO,
  type TipoAlojamiento,
} from '../../api/publicaciones'

// Formatos compartidos por las pantallas que muestran alojamientos.

const PESOS = new Intl.NumberFormat('es-CO', {
  style: 'currency',
  currency: 'COP',
  minimumFractionDigits: 0,
  maximumFractionDigits: 2,
})

export function formatearPrecio(valor: number) {
  return PESOS.format(valor)
}

// Un importe tal como llega del backend, en su moneda (COP si no la indica).
export function formatearImporte(valor: number, moneda = 'COP') {
  if (moneda === 'COP') return PESOS.format(valor)
  try {
    return new Intl.NumberFormat('es-CO', {
      style: 'currency',
      currency: moneda,
      maximumFractionDigits: 2,
    }).format(valor)
  } catch {
    return `${valor} ${moneda}`
  }
}

const PORCENTAJE = new Intl.NumberFormat('es-CO', { maximumFractionDigits: 2 })

// 8.5 → «8,5 %»
export function formatearPorcentaje(valor: number) {
  return `${PORCENTAJE.format(valor)} %`
}

export function etiquetaTipo(tipo: TipoAlojamiento) {
  return (
    TIPOS_ALOJAMIENTO.find((opcion) => opcion.valor === tipo)?.etiqueta ?? tipo
  )
}

export function textoCapacidad(capacidad: number) {
  return `${capacidad} ${capacidad === 1 ? 'huésped' : 'huéspedes'}`
}
