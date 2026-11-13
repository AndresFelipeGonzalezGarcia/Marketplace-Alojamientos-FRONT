import type { ReactNode } from 'react'
import PanelMarca from './PanelMarca'
import './acceso.css'

interface PantallaAccesoProps {
  children: ReactNode
}

// Pantalla partida de login y registro: formulario a un lado, panel de
// marca al otro. En móvil el panel queda arriba como franja.
function PantallaAcceso({ children }: PantallaAccesoProps) {
  return (
    <main className="acceso">
      <div className="acceso__lado-formulario">{children}</div>
      <PanelMarca />
    </main>
  )
}

export default PantallaAcceso
