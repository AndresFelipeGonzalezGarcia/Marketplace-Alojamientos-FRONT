import { useId } from 'react'
import { textoCapacidad } from '../formato/formato'

interface SelectorHuespedesProps {
  valor: number
  capacidad: number
  error?: string
  onCambiar: (huespedes: number) => void
}

// Contador de huéspedes con botones, entre 1 y la capacidad. Si la URL trajo
// más de los que caben, se muestra tal cual: el backend responde
// CAPACIDAD_EXCEDIDA y el error queda aquí, junto al selector.
function SelectorHuespedes({ valor, capacidad, error, onCambiar }: SelectorHuespedesProps) {
  const id = useId()
  const idEtiqueta = `${id}-etiqueta`
  const idAyuda = `${id}-ayuda`
  const idError = `${id}-error`

  return (
    <div className="selector-huespedes">
      <p className="selector-huespedes__etiqueta" id={idEtiqueta}>
        Huéspedes
      </p>
      <div
        className={`selector-huespedes__control${error ? ' selector-huespedes__control--error' : ''}`}
        role="group"
        aria-labelledby={idEtiqueta}
        aria-describedby={error ? `${idError} ${idAyuda}` : idAyuda}
      >
        <button
          className="selector-huespedes__boton"
          type="button"
          aria-label="Quitar un huésped"
          disabled={valor <= 1}
          onClick={() => onCambiar(valor - 1)}
        >
          <span aria-hidden="true">−</span>
        </button>
        <output className="selector-huespedes__valor" aria-live="polite">
          {textoCapacidad(valor)}
        </output>
        <button
          className="selector-huespedes__boton"
          type="button"
          aria-label="Agregar un huésped"
          disabled={valor >= capacidad}
          onClick={() => onCambiar(valor + 1)}
        >
          <span aria-hidden="true">+</span>
        </button>
      </div>
      <p className="selector-huespedes__ayuda" id={idAyuda}>
        Máximo {textoCapacidad(capacidad)}.
      </p>
      {error && (
        <p className="campo-error-cotizacion" id={idError} role="alert">
          {error}
        </p>
      )}
    </div>
  )
}

export default SelectorHuespedes
