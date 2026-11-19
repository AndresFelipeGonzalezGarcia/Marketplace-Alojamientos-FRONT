import { fechaCompleta } from './fechasCalendario'

export type RolDia = 'llegada' | 'noche' | 'salida' | null

export interface EstadoDia {
  fecha: string
  pasado: boolean
  // undefined mientras no se ha cargado.
  libre: boolean | undefined
  habilitado: boolean
  rol: RolDia
  // Ocupado, pero vale como salida: la noche de ese día no se usa.
  soloSalida: boolean
}

interface DiaCalendarioProps {
  dia: EstadoDia
  enfocable: boolean
  onElegir: (fecha: string) => void
}

const TEXTO_ROL: Record<Exclude<RolDia, null>, string> = {
  llegada: 'tu llegada',
  noche: 'noche de tu estadía',
  salida: 'tu salida, esa noche no se cuenta',
}

function textoDisponibilidad({ pasado, libre, soloSalida }: EstadoDia) {
  if (pasado) return 'fecha pasada'
  if (libre === undefined) return 'cargando disponibilidad'
  if (soloSalida) return 'ocupado, pero puedes salir este día'
  return libre ? 'disponible' : 'no disponible'
}

// Un día es un botón. Los que no se pueden elegir siguen siendo enfocables
// (aria-disabled) para que el teclado recorra el mes sin saltos.
function DiaCalendario({ dia, enfocable, onElegir }: DiaCalendarioProps) {
  const { fecha, pasado, libre, habilitado, rol, soloSalida } = dia
  const clases = [
    'dia-calendario',
    pasado && 'dia-calendario--pasado',
    !pasado && libre === false && !soloSalida && 'dia-calendario--ocupado',
    !pasado && libre === undefined && 'dia-calendario--sin-datos',
    soloSalida && 'dia-calendario--solo-salida',
    !habilitado && 'dia-calendario--inhabilitado',
    rol && `dia-calendario--${rol}`,
  ]
    .filter(Boolean)
    .join(' ')

  const etiqueta = [fechaCompleta(fecha), rol && TEXTO_ROL[rol], textoDisponibilidad(dia)]
    .filter(Boolean)
    .join(', ')

  return (
    <button
      className={clases}
      type="button"
      data-fecha={fecha}
      tabIndex={enfocable ? 0 : -1}
      aria-label={etiqueta}
      aria-pressed={rol !== null}
      aria-disabled={!habilitado}
      onClick={() => habilitado && onElegir(fecha)}
    >
      {Number(fecha.slice(8))}
    </button>
  )
}

export default DiaCalendario
