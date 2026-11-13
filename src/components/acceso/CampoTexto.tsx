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

// Campo con etiqueta flotante: la etiqueta ocupa el lugar del texto mientras
// el campo está vacío y sube cuando recibe foco o tiene valor.
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
    <div className={`campo-flotante${error ? ' campo-flotante--error' : ''}`}>
      <div className="campo-flotante__caja">
        <Icono nombre={icono} className="campo-flotante__icono" />
        <input
          id={id}
          className={`campo-flotante__control${esContrasena ? ' campo-flotante__control--con-boton' : ''}`}
          type={esContrasena && contrasenaVisible ? 'text' : tipo}
          value={valor}
          // Un espacio permite detectar con CSS si el campo está vacío.
          placeholder=" "
          autoComplete={autoComplete}
          aria-invalid={error ? true : undefined}
          aria-describedby={descripcion}
          onChange={(evento) => onCambio(evento.target.value)}
        />
        <label className="campo-flotante__etiqueta" htmlFor={id}>
          {etiqueta}
        </label>
        {esContrasena && (
          <button
            className="campo-flotante__alternar"
            type="button"
            aria-label={`${contrasenaVisible ? 'Ocultar' : 'Mostrar'} campo ${etiqueta}`}
            aria-pressed={contrasenaVisible}
            onClick={() => setContrasenaVisible((actual) => !actual)}
          >
            <Icono nombre={contrasenaVisible ? 'ojo-tachado' : 'ojo'} />
          </button>
        )}
      </div>
      {ayuda && (
        <p id={idAyuda} className="campo-flotante__ayuda">
          {ayuda}
        </p>
      )}
      {error && (
        <p id={idError} className="campo-flotante__error">
          <Icono nombre="alerta" className="campo-flotante__error-icono" />
          {error}
        </p>
      )}
    </div>
  )
}

export default CampoTexto
