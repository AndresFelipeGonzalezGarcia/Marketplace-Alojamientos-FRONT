import { Link } from 'react-router'
import type { Destino } from './destinos'

interface EnlaceNavegacionProps {
  destino: Destino
  activo: boolean
  variante?: 'menu' | 'cuenta'
}

function EnlaceNavegacion({
  destino,
  activo,
  variante = 'menu',
}: EnlaceNavegacionProps) {
  const clases = [
    'navegacion-enlace',
    `navegacion-enlace--${variante}`,
    activo ? 'navegacion-enlace--activo' : '',
  ]
    .filter(Boolean)
    .join(' ')

  if (!destino.disponible) {
    return (
      <span
        className={`${clases} navegacion-enlace--deshabilitado`}
        aria-disabled="true"
        aria-current={activo ? 'page' : undefined}
      >
        {destino.etiqueta}
        <span className="etiqueta-proximamente">Próximamente</span>
      </span>
    )
  }

  return (
    <Link
      className={clases}
      to={destino.ruta}
      aria-current={activo ? 'page' : undefined}
    >
      {destino.etiqueta}
    </Link>
  )
}

export default EnlaceNavegacion
