import type { EstadoPublicacion } from '../../api/publicaciones'
import { presentacionDe } from './estadoPublicacion'

interface InsigniaEstadoProps {
  estado: EstadoPublicacion
}

function InsigniaEstado({ estado }: InsigniaEstadoProps) {
  const { etiqueta, tono } = presentacionDe(estado)
  return (
    <span className={`insignia-estado insignia-estado--${tono}`}>
      <span className="solo-lector">Estado: </span>
      {etiqueta}
    </span>
  )
}

export default InsigniaEstado
