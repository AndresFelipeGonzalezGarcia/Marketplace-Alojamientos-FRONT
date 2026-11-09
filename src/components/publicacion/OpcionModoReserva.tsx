import type { ModoReserva } from '../../api/publicaciones'

interface OpcionModoReservaProps {
  id?: string
  modo: ModoReserva
  titulo: string
  descripcion: string
  seleccionada: boolean
  onSeleccionar: (modo: ModoReserva) => void
}

function OpcionModoReserva({
  id,
  modo,
  titulo,
  descripcion,
  seleccionada,
  onSeleccionar,
}: OpcionModoReservaProps) {
  return (
    <label
      className={`opcion-tarjeta${seleccionada ? ' opcion-tarjeta--seleccionada' : ''}`}
    >
      <input
        id={id}
        type="radio"
        name="modoReserva"
        value={modo}
        checked={seleccionada}
        onChange={() => onSeleccionar(modo)}
      />
      <span>
        <span className="opcion-tarjeta__titulo">{titulo}</span>
        <span className="opcion-tarjeta__descripcion">{descripcion}</span>
      </span>
    </label>
  )
}

export default OpcionModoReserva
