import type { ReactNode } from 'react'

interface MensajeDetalleProps {
  titulo: string
  children: ReactNode
  alerta?: boolean
}

// Pantalla completa del detalle cuando no hay alojamiento que mostrar.
function MensajeDetalle({ titulo, children, alerta = false }: MensajeDetalleProps) {
  return (
    <section className="detalle-mensaje" role={alerta ? 'alert' : undefined}>
      <h1 className="detalle-mensaje__titulo">{titulo}</h1>
      {children}
    </section>
  )
}

export default MensajeDetalle
