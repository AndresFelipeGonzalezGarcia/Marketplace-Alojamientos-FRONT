import { useId, type ReactNode } from 'react'

interface SeccionDetalleProps {
  titulo: string
  children: ReactNode
  // Ancla para llevar a la sección desde otro sitio de la pantalla.
  id?: string
}

// Bloque de información del detalle: título de sección y contenido, sin
// tarjeta; las secciones se separan con una línea.
function SeccionDetalle({ titulo, children, id: ancla }: SeccionDetalleProps) {
  const id = useId()
  return (
    <section className="detalle-seccion" id={ancla} aria-labelledby={id}>
      {/* Enfocable solo por código, para llevar el foco al llegar al ancla. */}
      <h2 className="detalle-seccion__titulo" id={id} tabIndex={ancla ? -1 : undefined}>
        {titulo}
      </h2>
      {children}
    </section>
  )
}

export default SeccionDetalle
