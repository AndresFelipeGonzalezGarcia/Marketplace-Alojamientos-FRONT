import type { Servicio } from '../../api/catalogos'

interface CasillasServiciosProps {
  servicios: Servicio[]
  seleccionados: string[]
  error?: string
  onCambiar: (seleccionados: string[]) => void
}

function CasillasServicios({
  servicios,
  seleccionados,
  error,
  onCambiar,
}: CasillasServiciosProps) {
  return (
    <fieldset className="grupo-opciones">
      <legend className="campo__etiqueta">Servicios incluidos (opcional)</legend>
      <div className="chips">
        {servicios.map(({ id, nombre }) => {
          const activo = seleccionados.includes(id)
          return (
            <label key={id} className={`chip${activo ? ' chip--activo' : ''}`}>
              <input
                type="checkbox"
                checked={activo}
                onChange={() =>
                  onCambiar(
                    activo
                      ? seleccionados.filter((actual) => actual !== id)
                      : [...seleccionados, id],
                  )
                }
              />
              {nombre}
            </label>
          )
        })}
      </div>
      {error && <p className="campo__error">{error}</p>}
    </fieldset>
  )
}

export default CasillasServicios
