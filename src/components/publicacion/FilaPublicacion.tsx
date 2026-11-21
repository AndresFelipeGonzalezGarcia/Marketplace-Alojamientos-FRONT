import { Link } from 'react-router'
import type { PublicacionResumen } from '../../api/publicaciones'
import { formatearPrecio, textoCapacidad } from '../formato/formato'
import InsigniaEstado from './InsigniaEstado'
import '../admin/admin.css'
import './publicacion.css'

interface FilaPublicacionProps {
  publicacion: PublicacionResumen
}

// Fila de publicación
function FilaPublicacion({ publicacion }: FilaPublicacionProps) {
  const { id, titulo, ciudad, estado, capacidad, precioNoche } = publicacion
  const ruta = `/publicaciones/${encodeURIComponent(id)}`

  return (
    <li className="fila-revision fila-publicacion">
      <div className="fila-revision__cuerpo">
        <InsigniaEstado estado={estado} />
        <h2 className="fila-revision__titulo fila-publicacion__titulo">{titulo}</h2>
        <p className="fila-revision__datos">
          <span>{ciudad}</span>
          <span>{textoCapacidad(capacidad)}</span>
        </p>
      </div>
      <div className="fila-revision__lateral fila-publicacion__lateral">
        <p className="fila-revision__precio">
          {formatearPrecio(precioNoche)}
          <span className="fila-revision__unidad"> / noche</span>
        </p>
        <div className="fila-publicacion__acciones">
          <Link
            className="boton-enlace boton-enlace--secundario"
            to={`${ruta}/disponibilidad`}
            aria-label={`Disponibilidad de ${titulo}`}
          >
            Disponibilidad
          </Link>
          <Link
            className="boton-enlace"
            to={`${ruta}/editar`}
            aria-label={`Editar ${titulo}`}
          >
            Editar
          </Link>
        </div>
      </div>
    </li>
  )
}

export default FilaPublicacion
