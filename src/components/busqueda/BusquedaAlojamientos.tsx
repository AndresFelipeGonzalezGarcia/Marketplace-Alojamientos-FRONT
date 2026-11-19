import { useEffect, useRef, useState } from 'react'
import { useLocation, useNavigate, useSearchParams } from 'react-router'
import {
  buscarAlojamientos,
  listarServiciosPublicos,
  type PaginaAlojamientos,
} from '../../api/alojamientos'
import type { ResultadoApi } from '../../api/cliente'
import type { ErrorApi } from '../../api/errores'
import '../formulario/formulario.css'
import '../publicacion/publicacion.css'
import BuscadorPrincipal, { type BusquedaPrincipal } from './BuscadorPrincipal'
import {
  aConsulta,
  escribirFiltros,
  FILTROS_VACIOS,
  hayFiltros as calcularHayFiltros,
  leerFiltros,
  MENSAJE_FECHAS_INVALIDAS,
  type ErroresBusqueda,
  type FiltrosBusqueda,
} from './filtrosBusqueda'
import FiltrosSecundarios, { type EstadoServicios } from './FiltrosSecundarios'
import ResultadosBusqueda, { type EstadoResultados } from './ResultadosBusqueda'
import './busqueda.css'

// Estado que el detalle recibe para volver a esta misma búsqueda.
export interface EstadoVolverBusqueda {
  desde: string
}

interface ErroresServidor extends ErroresBusqueda {
  precio?: string
}

// Un 400 se muestra junto al campo que lo causó, no como error general.
function erroresDeServidor(error: ErrorApi): ErroresServidor | null {
  if (error.codigo === 'FECHAS_INVALIDAS') {
    return { fechas: MENSAJE_FECHAS_INVALIDAS }
  }
  if (error.codigo !== 'SOLICITUD_INVALIDA') return null
  const campos = error.erroresPorCampo
  const errores: ErroresServidor = {}
  if (campos.ciudad) errores.ciudad = campos.ciudad
  if (campos.fechaLlegada || campos.fechaSalida) {
    errores.fechas = campos.fechaLlegada ?? campos.fechaSalida
  }
  if (campos.huespedes) errores.huespedes = campos.huespedes
  if (campos.precioMin || campos.precioMax) {
    errores.precio = campos.precioMin ?? campos.precioMax
  }
  return Object.keys(errores).length > 0 ? errores : null
}

interface Respuesta {
  // Qué búsqueda (y qué intento) contestó: si no es la actual, se está cargando.
  solicitud: string
  resultado: ResultadoApi<PaginaAlojamientos>
}

function BusquedaAlojamientos() {
  const [parametros, setParametros] = useSearchParams()
  const { search } = useLocation()
  const navigate = useNavigate()
  const filtros = leerFiltros(parametros)
  // Forma canónica de la búsqueda: dos URL equivalentes no consultan dos veces.
  const clave = escribirFiltros(filtros).toString()

  const [intento, setIntento] = useState(0)
  const [respuesta, setRespuesta] = useState<Respuesta | null>(null)
  const [servicios, setServicios] = useState<EstadoServicios>({
    fase: 'cargando',
  })
  const [filtrosAbiertos, setFiltrosAbiertos] = useState(false)
  const tituloResultados = useRef<HTMLHeadingElement>(null)
  const enfocarAlCargar = useRef(false)
  const solicitud = `${clave}#${intento}`

  useEffect(() => {
    let vigente = true
    buscarAlojamientos(aConsulta(leerFiltros(new URLSearchParams(clave)))).then(
      (resultado) => {
        if (vigente)
          setRespuesta({ solicitud: `${clave}#${intento}`, resultado })
      },
    )
    return () => {
      vigente = false
    }
  }, [clave, intento])

  useEffect(() => {
    let vigente = true
    listarServiciosPublicos().then((resultado) => {
      if (!vigente) return
      setServicios(
        resultado.estado === 'ok'
          ? { fase: 'lista', servicios: resultado.datos }
          : { fase: 'error' },
      )
    })
    return () => {
      vigente = false
    }
  }, [])

  let estado: EstadoResultados
  let erroresServidor: ErroresServidor = {}
  if (!respuesta || respuesta.solicitud !== solicitud) {
    estado = { fase: 'cargando' }
  } else if (respuesta.resultado.estado === 'ok') {
    estado = { fase: 'lista', pagina: respuesta.resultado.datos }
  } else {
    const deCampo = erroresDeServidor(respuesta.resultado.error)
    erroresServidor = deCampo ?? {}
    estado = deCampo
      ? { fase: 'filtros_invalidos' }
      : { fase: 'error', error: respuesta.resultado.error }
  }

  // Tras cambiar de página se lleva el foco (y la vista) al inicio de los
  // resultados, para no quedarse al final de la lista anterior.
  useEffect(() => {
    if (estado.fase !== 'cargando' && enfocarAlCargar.current) {
      enfocarAlCargar.current = false
      tituloResultados.current?.focus()
      tituloResultados.current?.scrollIntoView?.({ block: 'start' })
    }
  })

  // La búsqueda principal y la paginación crean una entrada en el historial;
  // retocar los filtros secundarios la reemplaza, para que «atrás» no
  // recorra cada casilla marcada.
  function aplicar(cambios: Partial<FiltrosBusqueda>, reemplazar: boolean) {
    setParametros(escribirFiltros({ ...filtros, ...cambios, pagina: 1 }), {
      replace: reemplazar,
    })
  }

  function buscar(busqueda: BusquedaPrincipal) {
    aplicar(busqueda, false)
  }

  function limpiar() {
    navigate('/alojamientos')
  }

  function enlaceA(pagina: number) {
    const texto = escribirFiltros({ ...filtros, pagina }).toString()
    return { pathname: '/alojamientos', search: texto ? `?${texto}` : '' }
  }

  // El detalle recibe las fechas y huéspedes (los usará para cotizar) y
  // cómo volver a esta búsqueda exacta.
  function enlaceDetalle(id: string) {
    const estadia = escribirFiltros({
      ...FILTROS_VACIOS,
      llegada: filtros.llegada,
      salida: filtros.salida,
      huespedes: filtros.huespedes,
    }).toString()
    return {
      pathname: `/alojamientos/${encodeURIComponent(id)}`,
      search: estadia ? `?${estadia}` : '',
    }
  }

  const estadoVolver: EstadoVolverBusqueda = { desde: search }
  const filtrosActivos =
    (filtros.precioMin !== null || filtros.precioMax !== null ? 1 : 0) +
    (filtros.tipo ? 1 : 0) +
    filtros.servicios.length

  return (
    <>
      <section className="busqueda-portada">
        <div className="busqueda-portada__texto">
          <h1 className="busqueda-portada__titulo">Encuentra dónde quedarte</h1>
          <p className="busqueda-portada__entrada">
            Casas, apartamentos y cabañas en toda Colombia, publicados por
            anfitriones verificados.
          </p>
        </div>
        <BuscadorPrincipal
          key={`${filtros.ciudad}|${filtros.llegada}|${filtros.salida}|${filtros.huespedes}`}
          filtros={filtros}
          erroresServidor={erroresServidor}
          onBuscar={buscar}
        />
      </section>

      <div className="busqueda-cuerpo">
        <aside
          className="busqueda-filtros"
          aria-labelledby="busqueda-filtros-titulo"
        >
          <div className="busqueda-filtros__cabecera">
            <h2
              id="busqueda-filtros-titulo"
              className="busqueda-filtros__titulo"
            >
              Filtros
            </h2>
            <button
              className="boton-secundario busqueda-filtros__alternar"
              type="button"
              aria-expanded={filtrosAbiertos}
              aria-controls="busqueda-filtros-panel"
              onClick={() => setFiltrosAbiertos((actual) => !actual)}
            >
              {filtrosAbiertos ? 'Ocultar filtros' : 'Mostrar filtros'}
              {filtrosActivos > 0 && ` (${filtrosActivos})`}
            </button>
          </div>
          <div
            id="busqueda-filtros-panel"
            className={`busqueda-filtros__panel${filtrosAbiertos ? ' busqueda-filtros__panel--abierto' : ''}`}
          >
            <FiltrosSecundarios
              key={`${filtros.precioMin}|${filtros.precioMax}`}
              filtros={filtros}
              servicios={servicios}
              errorPrecioServidor={erroresServidor.precio}
              onCambiar={(cambios) => aplicar(cambios, true)}
            />
            {calcularHayFiltros(filtros) && (
              <button
                className="busqueda-filtros__limpiar"
                type="button"
                onClick={limpiar}
              >
                Limpiar todos los filtros
              </button>
            )}
          </div>
        </aside>

        <ResultadosBusqueda
          refTitulo={tituloResultados}
          estado={estado}
          filtros={filtros}
          hayFiltros={calcularHayFiltros(filtros)}
          enlaceDetalle={enlaceDetalle}
          enlacePagina={enlaceA}
          estadoNavegacion={estadoVolver}
          onLimpiar={limpiar}
          onReintentar={() => setIntento((actual) => actual + 1)}
          onCambiarPagina={() => {
            enfocarAlCargar.current = true
          }}
        />
      </div>
    </>
  )
}

export default BusquedaAlojamientos
