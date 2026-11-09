import type { Periodo } from '../../api/periodos'
import { formatearFecha } from './validacionPeriodo'

interface FilaPeriodoProps {
  periodo: Periodo
  confirmando: boolean
  ocupado: boolean
  onEditar: () => void
  onPedirEliminar: () => void
  onCancelarEliminar: () => void
  onEliminar: () => void
}

function FilaPeriodo({
  periodo,
  confirmando,
  ocupado,
  onEditar,
  onPedirEliminar,
  onCancelarEliminar,
  onEliminar,
}: FilaPeriodoProps) {
  const rango = `${formatearFecha(periodo.fechaInicio)} al ${formatearFecha(periodo.fechaFin)}`

  return (
    <li className="fila-periodo">
      <span className="fila-periodo__rango">{rango}</span>
      {confirmando ? (
        <div className="fila-periodo__acciones">
          <span className="fila-periodo__pregunta">¿Eliminar este periodo?</span>
          <button
            className="boton-compacto boton-compacto--peligro"
            type="button"
            disabled={ocupado}
            onClick={onEliminar}
          >
            {ocupado ? 'Eliminando…' : 'Sí, eliminar'}
          </button>
          <button
            className="boton-compacto"
            type="button"
            disabled={ocupado}
            onClick={onCancelarEliminar}
          >
            Cancelar
          </button>
        </div>
      ) : (
        <div className="fila-periodo__acciones">
          <button
            className="boton-compacto"
            type="button"
            aria-label={`Editar periodo del ${rango}`}
            disabled={ocupado}
            onClick={onEditar}
          >
            Editar
          </button>
          <button
            className="boton-compacto boton-compacto--peligro"
            type="button"
            aria-label={`Eliminar periodo del ${rango}`}
            disabled={ocupado}
            onClick={onPedirEliminar}
          >
            Eliminar
          </button>
        </div>
      )}
    </li>
  )
}

export default FilaPeriodo
