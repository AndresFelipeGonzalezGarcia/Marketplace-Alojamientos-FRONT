import type { PoliticaCancelacion } from '../../api/catalogos'

// Textos del detalle público que dependen de los datos.

function textoPlazo(horas: number) {
  if (horas >= 48 && horas % 24 === 0) return `${horas / 24} días`
  return `${horas} ${horas === 1 ? 'hora' : 'horas'}`
}

// Condición de la política en una frase que se entiende sin conocerla.
export function condicionCancelacion(politica: PoliticaCancelacion) {
  const { horasAntesLlegada: horas, porcentajeDevolucion: porcentaje } =
    politica
  if (horas === undefined || porcentaje === undefined) return null
  const plazo = `Si cancelas con al menos ${textoPlazo(horas)} de anticipación a la llegada`
  if (porcentaje <= 0) return `${plazo}, no hay devolución.`
  if (porcentaje >= 100) return `${plazo}, te devolvemos todo lo pagado.`
  return `${plazo}, te devolvemos el ${porcentaje} % de lo pagado.`
}

// Las reglas llegan como un solo texto; cada línea es una regla.
export function separarReglas(reglas: string | undefined) {
  return (reglas ?? '')
    .split('\n')
    .map((regla) => regla.trim())
    .filter(Boolean)
}
