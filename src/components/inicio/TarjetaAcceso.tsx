import { Link } from 'react-router'
import type { Destino } from '../navegacion/destinos'

interface TarjetaAccesoProps {
  destino: Destino
  destacada?: boolean
}

function TarjetaAcceso({ destino, destacada = false }: TarjetaAccesoProps) {
  return (
    <li className="tarjeta-acceso">
      <h2 className="tarjeta-acceso__titulo">{destino.etiqueta}</h2>
      <p className="tarjeta-acceso__texto">{destino.descripcion}</p>
      {destino.disponible ? (
        <Link
          className={
            destacada ? 'boton-enlace' : 'boton-enlace boton-enlace--secundario'
          }
          to={destino.ruta}
        >
          {destino.accion}
        </Link>
      ) : (
        <p className="tarjeta-acceso__pendiente">
          <span className="etiqueta-proximamente">Próximamente</span>
        </p>
      )}
    </li>
  )
}

export default TarjetaAcceso
