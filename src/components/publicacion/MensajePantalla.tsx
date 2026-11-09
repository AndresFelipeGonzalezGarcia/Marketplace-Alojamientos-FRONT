import type { ReactNode } from 'react'
import './publicacion.css'

interface MensajePantallaProps {
  titulo: string
  mensaje: string
  children?: ReactNode
}

function MensajePantalla({ titulo, mensaje, children }: MensajePantallaProps) {
  return (
    <section className="publicacion-tarjeta publicacion-mensaje">
      <h1 className="publicacion-mensaje__titulo">{titulo}</h1>
      <p className="publicacion-mensaje__texto">{mensaje}</p>
      {children}
    </section>
  )
}

export default MensajePantalla
