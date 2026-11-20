import type { Ref } from 'react'
import { Link, type To } from 'react-router'
import { TAMANO_PAGINA, type PaginaAlojamientos } from '../../api/alojamientos'
import { mensajeConReferencia, type ErrorApi } from '../../api/errores'
import EsqueletoTarjeta from './EsqueletoTarjeta'
import {
  contarNoches,
  formatearDia,
  textoNoches,
  type FiltrosBusqueda,
} from './filtrosBusqueda'
import Paginacion from './Paginacion'
import TarjetaAlojamiento from './TarjetaAlojamiento'

export type EstadoResultados =
  | { fase: 'cargando' }
  | { fase: 'lista'; pagina: PaginaAlojamientos }
  // Error de validación
  | { fase: 'filtros_invalidos' }
  | { fase: 'error'; error: ErrorApi }

interface ResultadosBusquedaProps {
  estado: EstadoResultados
  filtros: FiltrosBusqueda
  hayFiltros: boolean
  enlaceDetalle: (id: string) => To
  enlacePagina: (pagina: number) => To
  estadoNavegacion: unknown
  onLimpiar: () => void
  onReintentar: () => void
  onCambiarPagina: () => void
  // Contenedor de resultados
  refTitulo?: Ref<HTMLHeadingElement>
}

function resumen(total: number, filtros: FiltrosBusqueda) {
  const cantidad = `${total} ${total === 1 ? 'alojamiento' : 'alojamientos'}`
  const noches = contarNoches(filtros.llegada, filtros.salida)
  if (noches === null) return cantidad
  return `${cantidad} para ${textoNoches(noches)}, del ${formatearDia(filtros.llegada)} al ${formatearDia(filtros.salida)}`
}

function ResultadosBusqueda({
  estado,
  filtros,
  hayFiltros,
  enlaceDetalle,
  enlacePagina,
  estadoNavegacion,
  onLimpiar,
  onReintentar,
  onCambiarPagina,
  refTitulo,
}: ResultadosBusquedaProps) {
  const titulo = (
    <h2 ref={refTitulo} className="resultados__titulo" tabIndex={-1}>
      {estado.fase === 'lista'
        ? resumen(estado.pagina.total, filtros)
        : 'Resultados'}
    </h2>
  )

  if (estado.fase === 'cargando') {
    return (
      <section
        className="resultados"
        aria-busy="true"
        aria-labelledby="resultados-titulo"
      >
        <h2 id="resultados-titulo" className="resultados__titulo">
          Resultados
        </h2>
        <p className="solo-lector" role="status">
          Buscando alojamientos…
        </p>
        <ul className="resultados__rejilla">
          {Array.from({ length: 6 }, (_, indice) => (
            <EsqueletoTarjeta key={indice} />
          ))}
        </ul>
      </section>
    )
  }

  if (estado.fase === 'filtros_invalidos') {
    return (
      <section className="resultados">
        {titulo}
        <div className="resultados__mensaje">
          <p className="resultados__mensaje-titulo">Revisa la búsqueda</p>
          <p>Corrige lo que está marcado arriba para ver alojamientos.</p>
        </div>
      </section>
    )
  }

  if (estado.fase === 'error') {
    return (
      <section className="resultados">
        {titulo}
        <div className="resultados__mensaje" role="alert">
          <p className="resultados__mensaje-titulo">
            No pudimos cargar los alojamientos
          </p>
          <p>{mensajeConReferencia(estado.error)}</p>
          <button
            className="boton-principal"
            type="button"
            onClick={onReintentar}
          >
            Reintentar
          </button>
        </div>
      </section>
    )
  }

  const { contenido, total, totalPaginas } = estado.pagina
  const desde = (filtros.pagina - 1) * TAMANO_PAGINA + 1

  if (total === 0) {
    return (
      <section className="resultados">
        {titulo}
        <div className="resultados__mensaje resultados__mensaje--vacio">
          {hayFiltros ? (
            <>
              <p className="resultados__mensaje-titulo">
                No encontramos alojamientos con estos filtros
              </p>
              <p>
                Prueba con otras fechas, menos huéspedes, otra ciudad o un rango
                de precio más amplio.
              </p>
              <button
                className="boton-principal"
                type="button"
                onClick={onLimpiar}
              >
                Limpiar filtros
              </button>
            </>
          ) : (
            <>
              <p className="resultados__mensaje-titulo">
                Todavía no hay alojamientos publicados
              </p>
              <p>
                Vuelve pronto: los anfitriones están preparando sus espacios.
              </p>
            </>
          )}
        </div>
      </section>
    )
  }

  // Página inexistente
  if (contenido.length === 0) {
    return (
      <section className="resultados">
        {titulo}
        <div className="resultados__mensaje">
          <p className="resultados__mensaje-titulo">
            Esta página ya no tiene resultados
          </p>
          <p>Los resultados cambiaron desde que se creó el enlace.</p>
          <Link className="boton-enlace" to={enlacePagina(1)}>
            Ir a la primera página
          </Link>
        </div>
      </section>
    )
  }

  return (
    <section className="resultados">
      {titulo}
      <ul className="resultados__rejilla" aria-label="Alojamientos encontrados">
        {contenido.map((alojamiento) => (
          <TarjetaAlojamiento
            key={alojamiento.id}
            alojamiento={alojamiento}
            destino={enlaceDetalle(alojamiento.id)}
            estadoNavegacion={estadoNavegacion}
          />
        ))}
      </ul>
      {totalPaginas > 1 && (
        <p className="resultados__rango">
          Mostrando {desde}–{desde + contenido.length - 1} de {total}
        </p>
      )}
      <Paginacion
        pagina={filtros.pagina}
        totalPaginas={totalPaginas}
        enlaceA={enlacePagina}
        onNavegar={onCambiarPagina}
      />
    </section>
  )
}

export default ResultadosBusqueda
