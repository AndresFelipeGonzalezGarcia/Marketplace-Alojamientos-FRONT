// Validar tarifa

const PORCENTAJE = new Intl.NumberFormat('es-CO', { maximumFractionDigits: 1 })

export function formatearPorcentaje(valor: number) {
  return `${PORCENTAJE.format(valor)} %`
}

export function aTextoPorcentaje(valor: number) {
  return String(valor).replace('.', ',')
}

export type LecturaPorcentaje =
  { valido: true; valor: number } | { valido: false; error: string }

export function leerPorcentaje(texto: string): LecturaPorcentaje {
  const limpio = texto.trim().replace(',', '.')
  if (!limpio) return { valido: false, error: 'Escribe el porcentaje.' }
  if (/^-\d/.test(limpio)) {
    return { valido: false, error: 'El porcentaje debe estar entre 0 y 100.' }
  }
  if (!/^\d+(\.\d+)?$/.test(limpio)) {
    return { valido: false, error: 'Escribe solo números, por ejemplo 8,5.' }
  }
  if (!/^\d+(\.\d)?$/.test(limpio)) {
    return { valido: false, error: 'Usa máximo un decimal, por ejemplo 8,5.' }
  }
  const valor = Number(limpio)
  if (valor > 100) {
    return { valido: false, error: 'El porcentaje debe estar entre 0 y 100.' }
  }
  return { valido: true, valor }
}
