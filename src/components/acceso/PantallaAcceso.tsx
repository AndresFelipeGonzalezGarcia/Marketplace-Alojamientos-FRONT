import type { ReactNode } from 'react'
import PanelMarca from './PanelMarca'
import './acceso.css'

interface PantallaAccesoProps {
  children: ReactNode
}

// Pantalla de acceso
function PantallaAcceso({ children }: PantallaAccesoProps) {
  return (
    <main className="acceso">
      <div className="acceso__lado-formulario">{children}</div>
      <PanelMarca />
    </main>
  )
}

export default PantallaAcceso
