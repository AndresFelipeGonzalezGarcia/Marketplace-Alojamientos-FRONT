import type { Ref } from 'react'
import type { EstadoPublicacion } from '../../api/publicaciones'
import Icono from '../acceso/Icono'
import { presentacionDe } from './estadoPublicacion'

interface AvisoEstadoProps {
  estado: EstadoPublicacion
  motivo?: string | null
  // true justo después de enviarla: se anuncia como confirmación.
  recienEnviada: boolean
  ref?: Ref<HTMLDivElement>
}

// Explica por qué la publicación está en solo lectura.
function AvisoEstado({ estado, motivo, recienEnviada, ref }: AvisoEstadoProps) {
  const { tono, descripcion } = presentacionDe(estado)
  return (
    <div
      ref={ref}
      className={`aviso-estado aviso-estado--${tono}`}
      tabIndex={-1}
      role={recienEnviada ? 'status' : undefined}
    >
      <Icono
        nombre={tono === 'error' ? 'alerta' : 'reloj'}
        className="aviso-estado__icono"
      />
      <div>
        {/* El nombre del estado ya está en la insignia del encabezado. */}
        {recienEnviada && (
          <p className="aviso-estado__titulo">Enviada a revisión</p>
        )}
        <p className="aviso-estado__texto">{descripcion}</p>
        {motivo && (
          <p className="aviso-estado__texto">
            <strong>Motivo:</strong> {motivo}
          </p>
        )}
      </div>
    </div>
  )
}

export default AvisoEstado
