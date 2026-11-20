import { ESTADOS_RESERVA, type EstadoReserva } from '../../api/reservas'
import { PRESENTACION_RESERVA } from './estadoReserva'
import IconoEstado from './IconoEstado'

interface FiltroEstadoProps {
  // Estado
  seleccionado: EstadoReserva | null
  onCambiar: (estado: EstadoReserva | null) => void
}

// Filtro de estado
function FiltroEstado({ seleccionado, onCambiar }: FiltroEstadoProps) {
  return (
    <fieldset className="filtro-estado">
      <legend className="filtro-estado__titulo">Filtrar por estado</legend>
      <div className="filtro-estado__opciones">
        <label className="filtro-estado__opcion">
          <input
            type="radio"
            name="estado-reserva"
            checked={seleccionado === null}
            onChange={() => onCambiar(null)}
          />
          Todas
        </label>
        {ESTADOS_RESERVA.map((estado) => {
          const { etiqueta, icono } = PRESENTACION_RESERVA[estado]
          return (
            <label key={estado} className="filtro-estado__opcion">
              <input
                type="radio"
                name="estado-reserva"
                checked={seleccionado === estado}
                onChange={() => onCambiar(estado)}
              />
              <IconoEstado nombre={icono} />
              {etiqueta}
            </label>
          )
        })}
      </div>
    </fieldset>
  )
}

export default FiltroEstado
