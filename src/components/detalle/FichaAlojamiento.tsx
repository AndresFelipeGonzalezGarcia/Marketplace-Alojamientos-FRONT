import type { AlojamientoDetalle } from '../../api/alojamientos'
import { etiquetaTipo, formatearPrecio, textoCapacidad } from '../formato/formato'
import { condicionCancelacion, separarReglas } from './formatoDetalle'
import MarcadorPendiente from './MarcadorPendiente'
import SeccionDetalle from './SeccionDetalle'

interface FichaAlojamientoProps {
  alojamiento: AlojamientoDetalle
}

// Toda la información del alojamiento en una sola columna de lectura,
// en el orden en que se decide: qué es, qué trae, qué reglas tiene.
function FichaAlojamiento({ alojamiento }: FichaAlojamientoProps) {
  const {
    titulo,
    ciudad,
    ubicacionTextual,
    tipo,
    capacidad,
    descripcion,
    anfitrionNombre,
    servicios = [],
    serviciosAdicionales = [],
    politicaCancelacion,
  } = alojamiento
  const reglas = separarReglas(alojamiento.reglas)
  const condicion = politicaCancelacion
    ? condicionCancelacion(politicaCancelacion)
    : null

  return (
    <div className="ficha-alojamiento">
      <header className="ficha-alojamiento__encabezado">
        <p className="ficha-alojamiento__lugar">
          {etiquetaTipo(tipo)} en {ciudad}
        </p>
        <h1 className="ficha-alojamiento__titulo">{titulo}</h1>
        <ul className="ficha-alojamiento__datos">
          <li>{ubicacionTextual}</li>
          <li>Hasta {textoCapacidad(capacidad)}</li>
        </ul>
        <p className="ficha-alojamiento__anfitrion">
          <span className="ficha-alojamiento__avatar" aria-hidden="true">
            {anfitrionNombre.trim().charAt(0).toUpperCase()}
          </span>
          <span>
            Anfitrión: <strong>{anfitrionNombre}</strong>
          </span>
        </p>
      </header>

      <SeccionDetalle titulo="Sobre este alojamiento">
        <p className="detalle-seccion__parrafo">{descripcion}</p>
      </SeccionDetalle>

      <SeccionDetalle titulo="Servicios incluidos">
        {servicios.length > 0 ? (
          <ul className="detalle-chips">
            {servicios.map((servicio) => (
              <li className="detalle-chip" key={servicio.id}>
                {servicio.nombre}
              </li>
            ))}
          </ul>
        ) : (
          <p className="detalle-seccion__vacio">
            El anfitrión no indicó servicios incluidos.
          </p>
        )}
      </SeccionDetalle>

      {serviciosAdicionales.length > 0 && (
        <SeccionDetalle titulo="Servicios adicionales">
          <p className="detalle-seccion__nota">
            Se pagan aparte, solo si los pides.
          </p>
          <ul className="detalle-adicionales">
            {serviciosAdicionales.map((servicio) => (
              <li key={servicio.nombre}>
                <span>{servicio.nombre}</span>
                <strong>{formatearPrecio(servicio.costo)}</strong>
              </li>
            ))}
          </ul>
        </SeccionDetalle>
      )}

      <SeccionDetalle titulo="Disponibilidad">
        <MarcadorPendiente
          titulo="Calendario de disponibilidad"
          mensaje="Aquí verás qué noches están libres para elegir tus fechas de llegada y salida."
        />
      </SeccionDetalle>

      <SeccionDetalle titulo="Reglas de la casa">
        {reglas.length > 0 ? (
          <ul className="detalle-reglas">
            {reglas.map((regla, indice) => (
              <li key={indice}>{regla}</li>
            ))}
          </ul>
        ) : (
          <p className="detalle-seccion__vacio">
            El anfitrión no indicó reglas especiales.
          </p>
        )}
      </SeccionDetalle>

      {politicaCancelacion && (
        <SeccionDetalle titulo="Política de cancelación">
          <p className="detalle-politica__nombre">
            {politicaCancelacion.nombre}
          </p>
          {condicion && (
            <p className="detalle-seccion__parrafo">{condicion}</p>
          )}
        </SeccionDetalle>
      )}
    </div>
  )
}

export default FichaAlojamiento
