import type { ChangeEvent } from 'react'

type Control = HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement

interface CampoFormularioProps {
  id: string
  etiqueta: string
  valor: string
  onCambio: (valor: string) => void
  control?: 'texto' | 'numero' | 'area' | 'lista' | 'fecha'
  opciones?: string[]
  marcador?: string
  error?: string
}

function CampoFormulario({
  id,
  etiqueta,
  valor,
  onCambio,
  control = 'texto',
  opciones = [],
  marcador,
  error,
}: CampoFormularioProps) {
  const idError = error ? `${id}-error` : undefined
  const comunes = {
    id,
    className: 'campo__control',
    value: valor,
    'aria-invalid': error ? true : undefined,
    'aria-describedby': idError,
    onChange: (evento: ChangeEvent<Control>) => onCambio(evento.target.value),
  }

  return (
    <div className="campo">
      <label className="campo__etiqueta" htmlFor={id}>
        {etiqueta}
      </label>
      {control === 'area' && (
        <textarea {...comunes} rows={3} placeholder={marcador} />
      )}
      {control === 'lista' && (
        <select {...comunes}>
          <option value="">Selecciona una opción</option>
          {opciones.map((opcion) => (
            <option key={opcion} value={opcion}>
              {opcion}
            </option>
          ))}
        </select>
      )}
      {(control === 'texto' || control === 'numero' || control === 'fecha') && (
        <input
          {...comunes}
          type={control === 'fecha' ? 'date' : 'text'}
          inputMode={control === 'numero' ? 'numeric' : undefined}
          placeholder={marcador}
        />
      )}
      {error && (
        <p id={idError} className="campo__error">
          {error}
        </p>
      )}
    </div>
  )
}

export default CampoFormulario
