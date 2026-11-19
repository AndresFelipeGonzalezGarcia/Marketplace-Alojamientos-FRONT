import { Link } from 'react-router'
import type { PublicacionRevision } from '../../api/admin'
import FotoRevision from './FotoRevision'
import {
  etiquetaTipo,
  formatearFechaHora,
  formatearHaceCuanto,
  formatearPrecio,
  textoCapacidad,
} from './formatoRevision'

interface FilaRevisionProps {
  publicacion: PublicacionRevision
}

export interface EstadoNavegacionRevision {
  // La fila viaja al detalle para mostrar anfitrión y fecha de envío,
  // que PublicacionDetalle no trae.
  fila?: PublicacionRevision
}

function FilaRevision({ publicacion }: FilaRevisionProps) {
  const {
    id,
    titulo,
    ciudad,
    tipo,
    capacidad,
    precioNoche,
    anfitrionNombre,
    fechaEnvio,
    imagenPortada,
  } = publicacion
  const estado: EstadoNavegacionRevision = { fila: publicacion }

  return (
    <li className="fila-revision">
      <FotoRevision
        key={imagenPortada ?? ''}
        url={imagenPortada}
        alt=""
        textoSinFoto="Sin portada"
        className="fila-revision__portada"
      />
      <div className="fila-revision__cuerpo">
        <h2 className="fila-revision__titulo">
          {/* El enlace cubre toda la fila (ver admin.css). */}
          <Link
            className="fila-revision__enlace"
            to={`/admin/publicaciones/${encodeURIComponent(id)}`}
            state={estado}
          >
            {titulo}
          </Link>
        </h2>
        <p className="fila-revision__datos">
          <span>{ciudad}</span>
          <span>{etiquetaTipo(tipo)}</span>
          <span>{textoCapacidad(capacidad)}</span>
        </p>
        <p className="fila-revision__anfitrion">
          <span className="solo-lector">Anfitrión: </span>
          {anfitrionNombre}
        </p>
      </div>
      <div className="fila-revision__lateral">
        <p className="fila-revision__precio">
          {formatearPrecio(precioNoche)}
          <span className="fila-revision__unidad"> / noche</span>
        </p>
        <p className="fila-revision__envio">
          Enviada{' '}
          <time dateTime={fechaEnvio}>{formatearFechaHora(fechaEnvio)}</time>
          <span className="fila-revision__hace">
            {formatearHaceCuanto(fechaEnvio)}
          </span>
        </p>
      </div>
    </li>
  )
}

export default FilaRevision
