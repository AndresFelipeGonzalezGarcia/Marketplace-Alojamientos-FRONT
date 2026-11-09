import CampoFormulario from './CampoFormulario'
import {
  MAXIMO_SERVICIOS_ADICIONALES,
  rutaErrorAdicional,
  type ErroresFormulario,
  type FilaServicioAdicional,
} from './validacion'

interface ServiciosAdicionalesProps {
  filas: FilaServicioAdicional[]
  errores: ErroresFormulario
  onCambiar: (filas: FilaServicioAdicional[]) => void
}

function ServiciosAdicionales({
  filas,
  errores,
  onCambiar,
}: ServiciosAdicionalesProps) {
  const enLimite = filas.length >= MAXIMO_SERVICIOS_ADICIONALES

  function cambiarFila(
    indice: number,
    campo: keyof FilaServicioAdicional,
    valor: string,
  ) {
    onCambiar(
      filas.map((fila, posicion) =>
        posicion === indice ? { ...fila, [campo]: valor } : fila,
      ),
    )
  }

  return (
    <div className="campo">
      <span className="campo__etiqueta">Servicios adicionales con costo (opcional)</span>
      <div className="adicionales">
        {filas.map((fila, indice) => {
          const numero = indice + 1
          const rutaNombre = rutaErrorAdicional(indice, 'nombre')
          const rutaCosto = rutaErrorAdicional(indice, 'costo')
          return (
            <div className="adicional-fila" key={indice}>
              <CampoFormulario
                id={`publicacion-${rutaNombre}`}
                etiqueta={`Nombre del servicio ${numero}`}
                valor={fila.nombre}
                error={errores[rutaNombre]}
                onCambio={(valor) => cambiarFila(indice, 'nombre', valor)}
              />
              <CampoFormulario
                id={`publicacion-${rutaCosto}`}
                etiqueta={`Costo del servicio ${numero} (COP)`}
                control="numero"
                valor={fila.costo}
                error={errores[rutaCosto]}
                onCambio={(valor) => cambiarFila(indice, 'costo', valor)}
              />
              <button
                className="imagen-fila__quitar adicional-fila__quitar"
                type="button"
                aria-label={`Quitar servicio ${numero}`}
                onClick={() =>
                  onCambiar(filas.filter((_, posicion) => posicion !== indice))
                }
              >
                Quitar
              </button>
            </div>
          )
        })}
        <button
          className="boton-secundario adicionales__agregar"
          type="button"
          disabled={enLimite}
          onClick={() => onCambiar([...filas, { nombre: '', costo: '' }])}
        >
          + Agregar servicio
        </button>
        <p className="campo__ayuda">
          Hasta {MAXIMO_SERVICIOS_ADICIONALES} servicios.
        </p>
      </div>
      {errores.serviciosAdicionales && (
        <p className="campo__error">{errores.serviciosAdicionales}</p>
      )}
    </div>
  )
}

export default ServiciosAdicionales
