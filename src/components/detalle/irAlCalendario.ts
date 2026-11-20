// Ancla del calendario
export const ID_DISPONIBILIDAD = 'disponibilidad'

// Ir al calendario
export function irAlCalendario() {
  const seccion = document.getElementById(ID_DISPONIBILIDAD)
  seccion?.scrollIntoView?.({ behavior: 'smooth', block: 'start' })
  seccion?.querySelector<HTMLElement>('h2')?.focus()
}
