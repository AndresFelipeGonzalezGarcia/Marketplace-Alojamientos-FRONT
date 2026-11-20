// Fechas del calendario

const aTexto = (fecha: Date) => fecha.toISOString().slice(0, 10)
const aDate = (fecha: string) => new Date(`${fecha}T00:00:00Z`)

export function sumarDias(fecha: string, dias: number) {
  const d = aDate(fecha)
  d.setUTCDate(d.getUTCDate() + dias)
  return aTexto(d)
}

export const mesDe = (fecha: string) => fecha.slice(0, 7)

export function sumarMeses(mes: string, meses: number) {
  const [anio, numero] = mes.split('-').map(Number)
  return aTexto(new Date(Date.UTC(anio, numero - 1 + meses, 1))).slice(0, 7)
}

export const primerDia = (mes: string) => `${mes}-01`

export const ultimoDia = (mes: string) =>
  sumarDias(primerDia(sumarMeses(mes, 1)), -1)

// Días entre fechas
export function diasIncluidos(desde: string, hasta: string) {
  return Math.round((aDate(hasta).getTime() - aDate(desde).getTime()) / 86_400_000) + 1
}

// Día de la semana
export const diaDeLaSemana = (fecha: string) => (aDate(fecha).getUTCDay() + 6) % 7

// Semanas del mes
export function semanasDelMes(mes: string): (string | null)[][] {
  const semanas: (string | null)[][] = []
  let semana: (string | null)[] = Array(diaDeLaSemana(primerDia(mes))).fill(null)
  const fin = ultimoDia(mes)
  for (let dia = primerDia(mes); dia <= fin; dia = sumarDias(dia, 1)) {
    semana.push(dia)
    if (semana.length === 7) {
      semanas.push(semana)
      semana = []
    }
  }
  if (semana.length > 0) {
    semanas.push([...semana, ...Array(7 - semana.length).fill(null)])
  }
  return semanas
}

const NOMBRE_MES = new Intl.DateTimeFormat('es-CO', {
  month: 'long',
  year: 'numeric',
  timeZone: 'UTC',
})

const FECHA_COMPLETA = new Intl.DateTimeFormat('es-CO', {
  weekday: 'long',
  day: 'numeric',
  month: 'long',
  year: 'numeric',
  timeZone: 'UTC',
})

// Nombre del mes
export function nombreMes(mes: string) {
  const texto = NOMBRE_MES.format(aDate(primerDia(mes)))
  return texto.charAt(0).toUpperCase() + texto.slice(1)
}

// Fecha completa
export const fechaCompleta = (fecha: string) => FECHA_COMPLETA.format(aDate(fecha))
