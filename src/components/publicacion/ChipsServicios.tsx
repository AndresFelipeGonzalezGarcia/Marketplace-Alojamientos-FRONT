import { SERVICIOS_DISPONIBLES } from '../../api/publicaciones'

interface ChipsServiciosProps {
  seleccionados: string[]
  onAlternar: (servicio: string) => void
}

function ChipsServicios({ seleccionados, onAlternar }: ChipsServiciosProps) {
  return (
    <div className="campo">
      <span id="publicacion-servicios-etiqueta" className="campo__etiqueta">
        Servicios incluidos
      </span>
      <div
        className="chips"
        role="group"
        aria-labelledby="publicacion-servicios-etiqueta"
      >
        {SERVICIOS_DISPONIBLES.map((servicio) => {
          const activo = seleccionados.includes(servicio)
          return (
            <button
              key={servicio}
              className={`chip${activo ? ' chip--activo' : ''}`}
              type="button"
              aria-pressed={activo}
              onClick={() => onAlternar(servicio)}
            >
              {servicio}
            </button>
          )
        })}
      </div>
    </div>
  )
}

export default ChipsServicios
