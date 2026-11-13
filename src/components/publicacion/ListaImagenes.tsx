import {
  MAXIMO_IMAGENES,
  rutaErrorImagen,
  type ErroresFormulario,
} from './validacion'
import VistaFoto from './VistaFoto'

interface ListaImagenesProps {
  imagenes: string[]
  errores: ErroresFormulario
  onCambiar: (imagenes: string[]) => void
}

function ListaImagenes({ imagenes, errores, onCambiar }: ListaImagenesProps) {
  return (
    <div className="campo">
      <span className="campo__etiqueta">Imágenes (opcional)</span>
      <div className="imagenes">
        {imagenes.map((imagen, indice) => {
          const numero = indice + 1
          const ruta = rutaErrorImagen(indice)
          const id = `publicacion-${ruta}`
          const error = errores[ruta]
          const idError = error ? `${id}-error` : undefined
          return (
            <div
              className={`imagen-fila${indice === 0 ? ' imagen-fila--portada' : ''}`}
              key={indice}
            >
              <VistaFoto
                key={imagen.trim()}
                url={imagen}
                numero={numero}
                portada={indice === 0}
              />
              <label className="imagen-fila__etiqueta" htmlFor={id}>
                Ruta o URL de la foto {numero}
              </label>
              <input
                id={id}
                className="campo__control"
                type="text"
                value={imagen}
                aria-invalid={error ? true : undefined}
                aria-describedby={idError}
                onChange={(evento) =>
                  onCambiar(
                    imagenes.map((actual, posicion) =>
                      posicion === indice ? evento.target.value : actual,
                    ),
                  )
                }
              />
              {error && (
                <p id={idError} className="campo__error">
                  {error}
                </p>
              )}
              <button
                className="imagen-fila__quitar"
                type="button"
                aria-label={`Quitar foto ${numero}`}
                onClick={() =>
                  onCambiar(
                    imagenes.filter((_, posicion) => posicion !== indice),
                  )
                }
              >
                Quitar
              </button>
            </div>
          )
        })}
        <button
          className="boton-secundario imagenes__agregar"
          type="button"
          disabled={imagenes.length >= MAXIMO_IMAGENES}
          onClick={() => onCambiar([...imagenes, ''])}
        >
          + Agregar foto
        </button>
      </div>
      <p className="campo__ayuda">
        Hasta {MAXIMO_IMAGENES} imágenes. La primera es la portada.
      </p>
      {errores.imagenes && <p className="campo__error">{errores.imagenes}</p>}
    </div>
  )
}

export default ListaImagenes
