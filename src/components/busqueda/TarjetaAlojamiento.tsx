import { useState } from 'react'
import { Link, type To } from 'react-router'
import type { AlojamientoResumen } from '../../api/alojamientos'
import { etiquetaTipo, formatearPrecio } from '../formato/formato'

interface TarjetaAlojamientoProps {
  alojamiento: AlojamientoResumen
  destino: To
  // Búsqueda de origen
  estadoNavegacion: unknown
}

// Tarjeta de alojamiento
function TarjetaAlojamiento({
  alojamiento,
  destino,
  estadoNavegacion,
}: TarjetaAlojamientoProps) {
  const {
    titulo,
    ciudad,
    tipo,
    capacidad,
    precioNoche,
    imagenPortada,
    modoReserva,
  } = alojamiento
  const [fallo, setFallo] = useState(false)
  const foto = imagenPortada?.trim()

  return (
    <li className="tarjeta-alojamiento">
      <div className="tarjeta-alojamiento__foto">
        {foto && !fallo ? (
          <img
            src={foto}
            alt=""
            loading="lazy"
            decoding="async"
            onError={() => setFallo(true)}
          />
        ) : (
          <span className="tarjeta-alojamiento__sin-foto">Sin foto</span>
        )}
        {modoReserva === 'INMEDIATA' && (
          <span className="tarjeta-alojamiento__insignia">
            Reserva inmediata
          </span>
        )}
      </div>
      <div className="tarjeta-alojamiento__cuerpo">
        <p className="tarjeta-alojamiento__lugar">
          {ciudad} · {etiquetaTipo(tipo)}
        </p>
        <h3 className="tarjeta-alojamiento__titulo">
          <Link
            className="tarjeta-alojamiento__enlace"
            to={destino}
            state={estadoNavegacion}
          >
            {titulo}
          </Link>
        </h3>
        <p className="tarjeta-alojamiento__capacidad">
          Hasta {capacidad} {capacidad === 1 ? 'huésped' : 'huéspedes'}
        </p>
        <p className="tarjeta-alojamiento__precio">
          <strong>{formatearPrecio(precioNoche)}</strong>
          <span> / noche</span>
        </p>
      </div>
    </li>
  )
}

export default TarjetaAlojamiento
