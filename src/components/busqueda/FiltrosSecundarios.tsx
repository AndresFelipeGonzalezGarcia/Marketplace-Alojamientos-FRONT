import { useId, useState, type FormEvent } from 'react'
import type { Servicio } from '../../api/catalogos'
import {
  TIPOS_ALOJAMIENTO,
  type TipoAlojamiento,
} from '../../api/publicaciones'
import {
  leerPrecioEscrito,
  validarPrecios,
  type FiltrosBusqueda,
} from './filtrosBusqueda'

export type EstadoServicios =
  | { fase: 'cargando' }
  | { fase: 'lista'; servicios: Servicio[] }
  | { fase: 'error' }

type CambiosFiltros = Partial<
  Pick<FiltrosBusqueda, 'precioMin' | 'precioMax' | 'tipo' | 'servicios'>
>

interface FiltrosSecundariosProps {
  filtros: FiltrosBusqueda
  servicios: EstadoServicios
  // Error de precio
  errorPrecioServidor?: string
  onCambiar: (cambios: CambiosFiltros) => void
}

const aTexto = (valor: number | null) => (valor === null ? '' : String(valor))

// Filtros secundarios
function FiltrosSecundarios({
  filtros,
  servicios,
  errorPrecioServidor,
  onCambiar,
}: FiltrosSecundariosProps) {
  const id = useId()
  const [minimo, setMinimo] = useState(aTexto(filtros.precioMin))
  const [maximo, setMaximo] = useState(aTexto(filtros.precioMax))
  const [errorPrecio, setErrorPrecio] = useState<string | null>(null)
  const errorVisible = errorPrecio ?? errorPrecioServidor

  function aplicarPrecio(evento: FormEvent) {
    evento.preventDefault()
    const problema = validarPrecios(minimo, maximo)
    setErrorPrecio(problema)
    if (problema) return
    onCambiar({
      precioMin: leerPrecioEscrito(minimo) ?? null,
      precioMax: leerPrecioEscrito(maximo) ?? null,
    })
  }

  function alternarServicio(servicioId: string, marcado: boolean) {
    onCambiar({
      servicios: marcado
        ? [...filtros.servicios, servicioId]
        : filtros.servicios.filter((actual) => actual !== servicioId),
    })
  }

  const describePrecio = [
    `${id}-precio-ayuda`,
    errorVisible ? `${id}-precio-error` : '',
  ]
    .filter(Boolean)
    .join(' ')

  return (
    <div className="filtros">
      <form className="filtros__grupo" noValidate onSubmit={aplicarPrecio}>
        <fieldset className="filtros__fieldset">
          <legend className="filtros__titulo">Precio por noche</legend>
          <div className="filtros__precios">
            <div className="campo">
              <label className="campo__etiqueta" htmlFor={`${id}-min`}>
                Desde
              </label>
              <input
                id={`${id}-min`}
                className="campo__control"
                inputMode="numeric"
                placeholder="0"
                value={minimo}
                aria-invalid={errorVisible ? true : undefined}
                aria-describedby={describePrecio}
                onChange={(evento) => setMinimo(evento.target.value)}
              />
            </div>
            <div className="campo">
              <label className="campo__etiqueta" htmlFor={`${id}-max`}>
                Hasta
              </label>
              <input
                id={`${id}-max`}
                className="campo__control"
                inputMode="numeric"
                placeholder="Sin límite"
                value={maximo}
                aria-invalid={errorVisible ? true : undefined}
                aria-describedby={describePrecio}
                onChange={(evento) => setMaximo(evento.target.value)}
              />
            </div>
          </div>
          <p id={`${id}-precio-ayuda`} className="campo__ayuda filtros__ayuda">
            En pesos colombianos.
          </p>
          {errorVisible && (
            <p id={`${id}-precio-error`} className="campo__error">
              {errorVisible}
            </p>
          )}
          <button className="boton-secundario filtros__aplicar" type="submit">
            Aplicar precio
          </button>
        </fieldset>
      </form>

      <fieldset className="filtros__grupo filtros__fieldset">
        <legend className="filtros__titulo">Tipo de alojamiento</legend>
        <div className="chips">
          {[{ valor: null, etiqueta: 'Todos' }, ...TIPOS_ALOJAMIENTO].map(
            ({ valor, etiqueta }) => (
              <label key={etiqueta} className="chip">
                <input
                  type="radio"
                  name={`${id}-tipo`}
                  checked={filtros.tipo === valor}
                  onChange={() =>
                    onCambiar({ tipo: valor as TipoAlojamiento | null })
                  }
                />
                {etiqueta}
              </label>
            ),
          )}
        </div>
      </fieldset>

      {/* Servicios */}
      {servicios.fase !== 'error' && (
        <fieldset className="filtros__grupo filtros__fieldset">
          <legend className="filtros__titulo">Servicios</legend>
          {servicios.fase === 'cargando' ? (
            <p className="filtros__cargando">Cargando servicios…</p>
          ) : (
            <div className="chips">
              {servicios.servicios.map((servicio) => (
                <label key={servicio.id} className="chip">
                  <input
                    type="checkbox"
                    checked={filtros.servicios.includes(servicio.id)}
                    onChange={(evento) =>
                      alternarServicio(servicio.id, evento.target.checked)
                    }
                  />
                  {servicio.nombre}
                </label>
              ))}
            </div>
          )}
        </fieldset>
      )}
    </div>
  )
}

export default FiltrosSecundarios
