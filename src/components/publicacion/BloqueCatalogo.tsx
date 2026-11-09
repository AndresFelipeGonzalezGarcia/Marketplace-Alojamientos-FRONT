import type { ReactNode } from 'react'
import { mensajeConReferencia } from '../../api/errores'
import type { EstadoCatalogo } from './useCatalogos'

interface BloqueCatalogoProps<T> {
  etiqueta: string
  estado: EstadoCatalogo<T>
  textoVacio: string
  errorCampo?: string
  onReintentar: () => void
  children: (items: T[]) => ReactNode
}

function BloqueCatalogo<T>({
  etiqueta,
  estado,
  textoVacio,
  errorCampo,
  onReintentar,
  children,
}: BloqueCatalogoProps<T>) {
  if (estado.fase === 'lista' && estado.items.length > 0) {
    return children(estado.items)
  }

  return (
    <div className="campo">
      <span className="campo__etiqueta">{etiqueta}</span>
      {estado.fase === 'cargando' && (
        <p className="catalogo-mensaje" role="status">
          Cargando opciones…
        </p>
      )}
      {estado.fase === 'lista' && (
        <p className="catalogo-mensaje">{textoVacio}</p>
      )}
      {estado.fase === 'error' && (
        <div className="catalogo-error" role="alert">
          <p className="catalogo-mensaje">
            {mensajeConReferencia(estado.error)}
          </p>
          <button
            className="imagen-fila__quitar"
            type="button"
            onClick={onReintentar}
          >
            Reintentar
          </button>
        </div>
      )}
      {errorCampo && <p className="campo__error">{errorCampo}</p>}
    </div>
  )
}

export default BloqueCatalogo
