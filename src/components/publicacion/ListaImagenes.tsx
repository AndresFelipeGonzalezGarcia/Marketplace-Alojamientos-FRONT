interface ListaImagenesProps {
  imagenes: string[]
  onCambiar: (imagenes: string[]) => void
}

function ListaImagenes({ imagenes, onCambiar }: ListaImagenesProps) {
  return (
    <div className="campo">
      <span className="campo__etiqueta">Imágenes</span>
      <div className="imagenes">
        {imagenes.map((imagen, indice) => {
          const numero = indice + 1
          const id = `publicacion-imagen-${numero}`
          return (
            <div className="imagen-fila" key={indice}>
              <div className="imagen-fila__recuadro" aria-hidden="true">
                Foto {numero}
              </div>
              <label className="imagen-fila__etiqueta" htmlFor={id}>
                Ruta o URL de la foto {numero}
              </label>
              <input
                id={id}
                className="campo__control"
                type="text"
                value={imagen}
                onChange={(evento) =>
                  onCambiar(
                    imagenes.map((actual, posicion) =>
                      posicion === indice ? evento.target.value : actual,
                    ),
                  )
                }
              />
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
          onClick={() => onCambiar([...imagenes, ''])}
        >
          + Agregar foto
        </button>
      </div>
    </div>
  )
}

export default ListaImagenes
