import type { ReactNode } from 'react'

interface BotonCargaProps {
  cargando: boolean
  textoCargando: string
  children: ReactNode
}

// Botón principal de envío con estado de carga propio: se deshabilita,
// anuncia el cambio y muestra un indicador sin cambiar de tamaño.
function BotonCarga({ cargando, textoCargando, children }: BotonCargaProps) {
  return (
    <button
      className={`boton-acceso${cargando ? ' boton-acceso--cargando' : ''}`}
      type="submit"
      disabled={cargando}
      aria-busy={cargando || undefined}
    >
      {cargando ? (
        <>
          <span className="boton-acceso__indicador" aria-hidden="true" />
          {textoCargando}
        </>
      ) : (
        children
      )}
    </button>
  )
}

export default BotonCarga
