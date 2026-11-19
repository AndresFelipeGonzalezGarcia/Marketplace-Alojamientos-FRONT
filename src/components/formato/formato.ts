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

export function etiquetaTipo(tipo: TipoAlojamiento) {
  return (
    TIPOS_ALOJAMIENTO.find((opcion) => opcion.valor === tipo)?.etiqueta ?? tipo
  )
}

export function textoCapacidad(capacidad: number) {
  return `${capacidad} ${capacidad === 1 ? 'huésped' : 'huéspedes'}`
}
