import { Link, type To } from 'react-router'
import { paginasVisibles } from './filtrosBusqueda'

interface PaginacionProps {
  // Página actual
  pagina: number
  totalPaginas: number
  enlaceA: (pagina: number) => To
  onNavegar?: () => void
}

// Paginación
function Paginacion({
  pagina,
  totalPaginas,
  enlaceA,
  onNavegar,
}: PaginacionProps) {
  if (totalPaginas <= 1) return null

  return (
    <nav className="paginacion" aria-label="Paginación de resultados">
      <ul className="paginacion__lista">
        <li>
          {pagina > 1 ? (
            <Link
              className="paginacion__paso"
              to={enlaceA(pagina - 1)}
              onClick={onNavegar}
            >
              ← Anterior
            </Link>
          ) : (
            <span
              className="paginacion__paso paginacion__paso--inactivo"
              aria-disabled="true"
            >
              ← Anterior
            </span>
          )}
        </li>
        {paginasVisibles(pagina, totalPaginas).map((n, indice) =>
          n === '…' ? (
            <li
              key={`salto-${indice}`}
              className="paginacion__salto"
              aria-hidden="true"
            >
              …
            </li>
          ) : (
            <li key={n}>
              <Link
                className={`paginacion__numero${n === pagina ? ' paginacion__numero--actual' : ''}`}
                to={enlaceA(n)}
                aria-label={`Página ${n}`}
                aria-current={n === pagina ? 'page' : undefined}
                onClick={onNavegar}
              >
                {n}
              </Link>
            </li>
          ),
        )}
        <li>
          {pagina < totalPaginas ? (
            <Link
              className="paginacion__paso"
              to={enlaceA(pagina + 1)}
              onClick={onNavegar}
            >
              Siguiente →
            </Link>
          ) : (
            <span
              className="paginacion__paso paginacion__paso--inactivo"
              aria-disabled="true"
            >
              Siguiente →
            </span>
          )}
        </li>
      </ul>
    </nav>
  )
}

export default Paginacion
