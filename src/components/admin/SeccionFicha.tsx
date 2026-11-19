import type { ReactNode } from 'react'

interface SeccionFichaProps {
  id: string
  titulo: string
  children: ReactNode
}

function SeccionFicha({ id, titulo, children }: SeccionFichaProps) {
  return (
    <section className="publicacion-tarjeta ficha-seccion" aria-labelledby={id}>
      <h2 id={id} className="publicacion-tarjeta__titulo">
        {titulo}
      </h2>
      {children}
    </section>
  )
}

export default SeccionFicha
