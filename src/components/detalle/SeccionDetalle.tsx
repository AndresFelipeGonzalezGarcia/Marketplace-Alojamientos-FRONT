import { useId, type ReactNode } from 'react'

interface SeccionDetalleProps {
  titulo: string
  children: ReactNode
  // Ancla
  id?: string
}

// Sección del detalle
function SeccionDetalle({ titulo, children, id: ancla }: SeccionDetalleProps) {
  const id = useId()
  return (
    <section className="detalle-seccion" id={ancla} aria-labelledby={id}>
      {/* Foco */}
      <h2 className="detalle-seccion__titulo" id={id} tabIndex={ancla ? -1 : undefined}>
        {titulo}
      </h2>
      {children}
    </section>
  )
}

export default SeccionDetalle
