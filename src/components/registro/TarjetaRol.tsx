import type { Rol } from '../../api/registro'
import Icono from '../acceso/Icono'

interface TarjetaRolProps {
  id: string
  rol: Rol
  titulo: string
  descripcion: string
  seleccionada: boolean
  onSeleccionar: (rol: Rol) => void
}

function TarjetaRol({
  id,
  rol,
  titulo,
  descripcion,
  seleccionada,
  onSeleccionar,
}: TarjetaRolProps) {
  return (
    <label
      className={`tarjeta-rol${seleccionada ? ' tarjeta-rol--seleccionada' : ''}`}
    >
      <input
        id={id}
        className="tarjeta-rol__radio"
        type="radio"
        name="rol"
        value={rol}
        checked={seleccionada}
        onChange={() => onSeleccionar(rol)}
      />
      <span className="tarjeta-rol__circulo">
        <Icono nombre="verificacion" className="tarjeta-rol__verificacion" />
      </span>
      <span>
        <span className="tarjeta-rol__titulo">{titulo}</span>
        <span className="tarjeta-rol__descripcion">{descripcion}</span>
      </span>
    </label>
  )
}

export default TarjetaRol
