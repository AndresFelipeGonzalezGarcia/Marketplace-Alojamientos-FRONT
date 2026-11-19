// Ancla de la sección de disponibilidad, a la que llevan los avisos de la
// cotización ("Cambiar fechas", "Elegir otras fechas").
export const ID_DISPONIBILIDAD = 'disponibilidad'

// Lleva al calendario sin tocar la URL: un enlace #ancla perdería el estado
// de navegación (la búsqueda a la que se vuelve).
export function irAlCalendario() {
  const seccion = document.getElementById(ID_DISPONIBILIDAD)
  seccion?.scrollIntoView?.({ behavior: 'smooth', block: 'start' })
  seccion?.querySelector<HTMLElement>('h2')?.focus()
}
