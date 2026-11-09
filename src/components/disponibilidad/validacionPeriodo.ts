import type { DatosPeriodo } from '../../api/periodos'

export type ErroresPeriodo = Partial<Record<keyof DatosPeriodo, string>>

// El backend evalúa "pasado" en la zona America/Bogota.
export function hoyEnBogota(ahora = new Date()) {
  return new Intl.DateTimeFormat('en-CA', {
    timeZone: 'America/Bogota',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).format(ahora)
}

export function validarPeriodo(
  { fechaInicio, fechaFin }: DatosPeriodo,
  hoy = hoyEnBogota(),
): ErroresPeriodo {
  const errores: ErroresPeriodo = {}

  if (!fechaInicio) {
    errores.fechaInicio = 'La fecha de inicio es obligatoria.'
  } else if (fechaInicio < hoy) {
    errores.fechaInicio = 'El periodo no puede empezar en el pasado.'
  }

  if (!fechaFin) {
    errores.fechaFin = 'La fecha final es obligatoria.'
  } else if (fechaInicio && fechaFin < fechaInicio) {
    errores.fechaFin = 'La fecha final no puede ser anterior a la inicial.'
  }

  return errores
}

export function formatearFecha(fecha: string) {
  return new Intl.DateTimeFormat('es-CO', {
    dateStyle: 'long',
    timeZone: 'UTC',
  }).format(new Date(`${fecha}T00:00:00Z`))
}

export function ordenarPorInicio<T extends DatosPeriodo>(periodos: T[]) {
  return [...periodos].sort((a, b) =>
    a.fechaInicio.localeCompare(b.fechaInicio),
  )
}
