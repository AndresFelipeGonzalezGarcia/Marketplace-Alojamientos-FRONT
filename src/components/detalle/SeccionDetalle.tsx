import { useId, type ReactNode } from 'react'

interface SeccionDetalleProps {
  titulo: string
  children: ReactNode
}

// Bloque de información del detalle: título de sección y contenido, sin
// tarjeta; las secciones se separan con una línea.
function SeccionDetalle({ titulo, children }: SeccionDetalleProps) {
  const id = useId()
  return (
    <section className="detalle-seccion" aria-labelledby={id}>
      <h2 className="detalle-seccion__titulo" id={id}>
        {titulo}
      </h2>
      {children}
    </section>
  )
}

export default SeccionDetalle
