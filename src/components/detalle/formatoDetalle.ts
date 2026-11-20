import type { PoliticaCancelacion } from '../../api/catalogos'

// Textos del detalle

function textoPlazo(horas: number) {
  if (horas >= 48 && horas % 24 === 0) return `${horas / 24} días`
  return `${horas} ${horas === 1 ? 'hora' : 'horas'}`
}

// Política de cancelación
export function condicionCancelacion(politica: PoliticaCancelacion) {
  const { horasAntesLlegada: horas, porcentajeDevolucion: porcentaje } =
    politica
  if (horas === undefined || porcentaje === undefined) return null
  const plazo = `Si cancelas con al menos ${textoPlazo(horas)} de anticipación a la llegada`
  if (porcentaje <= 0) return `${plazo}, no hay devolución.`
  if (porcentaje >= 100) return `${plazo}, te devolvemos todo lo pagado.`
  return `${plazo}, te devolvemos el ${porcentaje} % de lo pagado.`
}

// Reglas
export function separarReglas(reglas: string | undefined) {
  return (reglas ?? '')
    .split('\n')
    .map((regla) => regla.trim())
    .filter(Boolean)
}
