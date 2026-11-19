import { useId, useState, type FormEvent } from 'react'
import { hoyEnBogota } from '../disponibilidad/validacionPeriodo'
import {
  describirEstadia,
  MAXIMO_CIUDAD,
  MAXIMO_HUESPEDES,
  validarBusqueda,
  type BorradorBusqueda,
  type ErroresBusqueda,
  type FiltrosBusqueda,
} from './filtrosBusqueda'

export interface BusquedaPrincipal {
  ciudad: string
  llegada: string
  salida: string
  huespedes: number | null
}

interface BuscadorPrincipalProps {
  filtros: FiltrosBusqueda
  // Errores que devolvió la API (p. ej. FECHAS_INVALIDAS), junto a su campo.
  erroresServidor: ErroresBusqueda
  onBuscar: (busqueda: BusquedaPrincipal) => void
}

function siguienteDia(fecha: string) {
  const dia = new Date(`${fecha}T00:00:00Z`)
  dia.setUTCDate(dia.getUTCDate() + 1)
  return dia.toISOString().slice(0, 10)
}

// Ciudad, fechas y huéspedes. Quien lo usa le da una `key` con los valores
// de la URL para que vuelva a leerlos si cambian (atrás, limpiar filtros).
function BuscadorPrincipal({
  filtros,
  erroresServidor,
  onBuscar,
}: BuscadorPrincipalProps) {
  const id = useId()
  const [borrador, setBorrador] = useState<BorradorBusqueda>({
    ciudad: filtros.ciudad,
    llegada: filtros.llegada,
    salida: filtros.salida,
    huespedes: filtros.huespedes === null ? '' : String(filtros.huespedes),
  })
  const [errores, setErrores] = useState<ErroresBusqueda | null>(null)
  const hoy = hoyEnBogota()

  // Los errores propios mandan después de intentar buscar; si no, los del servidor.
  const visibles = errores ?? erroresServidor
  const estadia = describirEstadia(borrador.llegada, borrador.salida)

  function cambiar(campo: keyof BorradorBusqueda, valor: string) {
    const siguiente = { ...borrador, [campo]: valor }
    // Una salida que ya no es posterior a la nueva llegada se descarta.
    if (
      campo === 'llegada' &&
      siguiente.salida &&
      valor &&
      siguiente.salida <= valor
    ) {
      siguiente.salida = ''
    }
    setBorrador(siguiente)
    if (errores) setErrores(validarBusqueda(siguiente, hoy))
  }

  function enviar(evento: FormEvent) {
    evento.preventDefault()
    const encontrados = validarBusqueda(borrador, hoy)
    setErrores(encontrados)
    if (Object.keys(encontrados).length > 0) {
      const primero = encontrados.ciudad
        ? 'ciudad'
        : encontrados.fechas
          ? 'llegada'
          : 'huespedes'
      document.getElementById(`${id}-${primero}`)?.focus()
      return
    }
    const huespedes = borrador.huespedes.trim()
    onBuscar({
      ciudad: borrador.ciudad.trim(),
      llegada: borrador.llegada,
      salida: borrador.salida,
      huespedes: huespedes ? Number(huespedes) : null,
    })
  }

  const descripcionFechas = [
    `${id}-fechas-ayuda`,
    visibles.fechas ? `${id}-fechas-error` : '',
  ]
    .filter(Boolean)
    .join(' ')

  return (
    <form
      className="buscador"
      role="search"
      aria-label="Buscar alojamientos"
      noValidate
      onSubmit={enviar}
    >
      <div className="buscador__campo buscador__campo--ciudad">
        <label className="buscador__etiqueta" htmlFor={`${id}-ciudad`}>
          Destino
        </label>
        <input
          id={`${id}-ciudad`}
          className="buscador__control"
          type="search"
          placeholder="¿A qué ciudad vas?"
          autoComplete="off"
          maxLength={MAXIMO_CIUDAD}
          value={borrador.ciudad}
          aria-invalid={visibles.ciudad ? true : undefined}
          aria-describedby={visibles.ciudad ? `${id}-ciudad-error` : undefined}
          onChange={(evento) => cambiar('ciudad', evento.target.value)}
        />
        {visibles.ciudad && (
          <p id={`${id}-ciudad-error`} className="buscador__error">
            {visibles.ciudad}
          </p>
        )}
      </div>

      <fieldset className="buscador__fechas">
        <legend className="solo-lector">Fechas de la estadía</legend>
        <div className="buscador__campo">
          <label className="buscador__etiqueta" htmlFor={`${id}-llegada`}>
            Llegada
          </label>
          <input
            id={`${id}-llegada`}
            className="buscador__control"
            type="date"
            min={hoy}
            value={borrador.llegada}
            aria-invalid={visibles.fechas ? true : undefined}
            aria-describedby={descripcionFechas}
            onChange={(evento) => cambiar('llegada', evento.target.value)}
          />
        </div>
        <div className="buscador__campo">
          <label className="buscador__etiqueta" htmlFor={`${id}-salida`}>
            Salida
          </label>
          <input
            id={`${id}-salida`}
            className="buscador__control"
            type="date"
            min={borrador.llegada ? siguienteDia(borrador.llegada) : hoy}
            value={borrador.salida}
            aria-invalid={visibles.fechas ? true : undefined}
            aria-describedby={descripcionFechas}
            onChange={(evento) => cambiar('salida', evento.target.value)}
          />
        </div>
        {/* La salida es exclusiva: se dice en noches para que no haya dudas. */}
        <p
          id={`${id}-fechas-ayuda`}
          className="buscador__ayuda"
          aria-live="polite"
        >
          {estadia ?? 'La noche del día de salida no se cuenta.'}
        </p>
        {visibles.fechas && (
          <p id={`${id}-fechas-error`} className="buscador__error">
            {visibles.fechas}
          </p>
        )}
      </fieldset>

      <div className="buscador__campo buscador__campo--huespedes">
        <label className="buscador__etiqueta" htmlFor={`${id}-huespedes`}>
          Huéspedes
        </label>
        <input
          id={`${id}-huespedes`}
          className="buscador__control"
          type="number"
          inputMode="numeric"
          min={1}
          max={MAXIMO_HUESPEDES}
          placeholder="¿Cuántos?"
          value={borrador.huespedes}
          aria-invalid={visibles.huespedes ? true : undefined}
          aria-describedby={
            visibles.huespedes ? `${id}-huespedes-error` : undefined
          }
          onChange={(evento) => cambiar('huespedes', evento.target.value)}
        />
        {visibles.huespedes && (
          <p id={`${id}-huespedes-error`} className="buscador__error">
            {visibles.huespedes}
          </p>
        )}
      </div>

      <button className="boton-principal buscador__boton" type="submit">
        Buscar
      </button>
    </form>
  )
}

export default BuscadorPrincipal
