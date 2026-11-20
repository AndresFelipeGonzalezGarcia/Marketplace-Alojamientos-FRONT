import { formatearDia, textoNoches } from '../busqueda/filtrosBusqueda'
import type { Estadia } from './estadia'

interface ResumenEstadiaProps {
  estadia: Estadia | null
  llegadaPendiente: string | null
  salidaMaxima: string | null
  onLimpiar: () => void
}

// Resumen de la estadía
function ResumenEstadia({
  estadia,
  llegadaPendiente,
  salidaMaxima,
  onLimpiar,
}: ResumenEstadiaProps) {
  let contenido
  if (llegadaPendiente) {
    contenido = (
      <>
        <p className="resumen-estadia__principal">
          Llegada el {formatearDia(llegadaPendiente)}. Ahora elige el día de salida.
        </p>
        {salidaMaxima && (
          <p className="resumen-estadia__nota">
            Como máximo puedes salir el {formatearDia(salidaMaxima)}: después hay
            noches ocupadas o sin disponibilidad.
          </p>
        )}
      </>
    )
  } else if (estadia) {
    contenido = (
      <>
        <p className="resumen-estadia__principal">
          <strong className="resumen-estadia__noches">{textoNoches(estadia.noches)}</strong>{' '}
          del {formatearDia(estadia.llegada)} al {formatearDia(estadia.salida)}
        </p>
        <p className="resumen-estadia__nota">
          El {formatearDia(estadia.salida)} es el día de salida: esa noche no se
          cuenta ni se ocupa.
        </p>
      </>
    )
  } else {
    contenido = (
      <p className="resumen-estadia__principal">
        Elige el día de llegada y después el de salida.
      </p>
    )
  }

  return (
    <div className="resumen-estadia">
      <div aria-live="polite">{contenido}</div>
      {(estadia || llegadaPendiente) && (
        <button className="boton-secundario resumen-estadia__limpiar" type="button" onClick={onLimpiar}>
          Borrar fechas
        </button>
      )}
    </div>
  )
}

export default ResumenEstadia
