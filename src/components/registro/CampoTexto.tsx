import { useState } from 'react'
import Icono, { type NombreIcono } from './Icono'

interface CampoTextoProps {
  id: string
  etiqueta: string
  tipo: 'text' | 'email' | 'tel' | 'password'
  icono: NombreIcono
  valor: string
  autoComplete: string
  ayuda?: string
  error?: string
  onCambio: (valor: string) => void
}

function CampoTexto({
  id,
  etiqueta,
  tipo,
  icono,
  valor,
  autoComplete,
  ayuda,
  error,
  onCambio,
}: CampoTextoProps) {
  const [contrasenaVisible, setContrasenaVisible] = useState(false)
  const esContrasena = tipo === 'password'
  const idAyuda = ayuda ? `${id}-ayuda` : undefined
  const idError = error ? `${id}-error` : undefined
  const descripcion = [idAyuda, idError].filter(Boolean).join(' ') || undefined

  return (
    <div className="campo">
      <label className="campo__etiqueta" htmlFor={id}>
        {etiqueta}
      </label>
      <div className="campo__entrada">
        <Icono nombre={icono} className="campo__icono" />
        <input
          id={id}
          className={`campo__control${esContrasena ? ' campo__control--con-boton' : ''}`}
          type={esContrasena && contrasenaVisible ? 'text' : tipo}
          value={valor}
          autoComplete={autoComplete}
          aria-invalid={error ? true : undefined}
          aria-describedby={descripcion}
          onChange={(evento) => onCambio(evento.target.value)}
        />
        {esContrasena && (
          <button
            className="campo__alternar"
            type="button"
            aria-label={`${contrasenaVisible ? 'Ocultar' : 'Mostrar'} campo ${etiqueta}`}
            onClick={() => setContrasenaVisible((actual) => !actual)}
          >
            <Icono nombre={contrasenaVisible ? 'ojo-tachado' : 'ojo'} />
          </button>
        )}
      </div>
      {ayuda && (
        <p id={idAyuda} className="campo__ayuda">
          {ayuda}
        </p>
      )}
      {error && (
        <p id={idError} className="campo__error">
          {error}
        </p>
      )}
    </div>
  )
}

export default CampoTexto
