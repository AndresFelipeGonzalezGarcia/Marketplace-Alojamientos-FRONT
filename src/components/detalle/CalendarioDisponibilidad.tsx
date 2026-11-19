import { useEffect, useRef, useState, type KeyboardEvent } from 'react'
import { MAXIMO_DIAS_CALENDARIO } from '../../api/alojamientos'
import { mensajeConReferencia } from '../../api/errores'
import { formatearDia } from '../busqueda/filtrosBusqueda'
import { hoyEnBogota } from '../disponibilidad/validacionPeriodo'
import type { EstadoDia, RolDia } from './DiaCalendario'
import { useEstadia } from './estadia'
import {
  diaDeLaSemana,
  diasIncluidos,
  mesDe,
  primerDia,
  sumarDias,
  sumarMeses,
  ultimoDia,
} from './fechasCalendario'
import LeyendaCalendario from './LeyendaCalendario'
import MesCalendario from './MesCalendario'
import ResumenEstadia from './ResumenEstadia'
import { nochesLibres, puedeLlegar, puedeSalir, salidaMaxima } from './seleccionEstadia'
import { useCalendario } from './useCalendario'

interface CalendarioDisponibilidadProps {
  alojamientoId: string
}

// Se ven dos meses a la vez; se puede avanzar hasta un año desde el actual.
const MESES_VISIBLES = 2
const MESES_HACIA_ADELANTE = 11

const MOVIMIENTOS: Record<string, number> = {
  ArrowLeft: -1,
  ArrowRight: 1,
  ArrowUp: -7,
  ArrowDown: 7,
}

// Meses que hay que tener cargados: los visibles y el siguiente, y al
// entrar con fechas, los que cubren la estadía para poder comprobarla.
// Siempre contiguos y sin pasar de 365 días, lo que admite el contrato.
function mesesACargar(mesVisible: string, hastaFecha: string | null) {
  let ultimo = sumarMeses(mesVisible, MESES_VISIBLES)
  if (hastaFecha && mesDe(hastaFecha) > ultimo) ultimo = mesDe(hastaFecha)
  const meses: string[] = []
  for (let mes = mesVisible; mes <= ultimo; mes = sumarMeses(mes, 1)) {
    if (diasIncluidos(primerDia(mesVisible), ultimoDia(mes)) > MAXIMO_DIAS_CALENDARIO) break
    meses.push(mes)
  }
  return meses
}

function CalendarioDisponibilidad({ alojamientoId }: CalendarioDisponibilidadProps) {
  const hoy = hoyEnBogota()
  const mesActual = mesDe(hoy)
  const mesMaximo = sumarMeses(mesActual, MESES_HACIA_ADELANTE - (MESES_VISIBLES - 1))
  const { estadia, fechasDescartadas, elegir, limpiar, descartar } = useEstadia()

  const ajustarMes = (mes: string) =>
    mes < mesActual ? mesActual : mes > mesMaximo ? mesMaximo : mes
  const [mesVisible, setMesVisible] = useState(() =>
    ajustarMes(estadia ? mesDe(estadia.llegada) : mesActual),
  )
  const [llegadaPendiente, setLlegadaPendiente] = useState<string | null>(null)
  const [foco, setFoco] = useState(() => estadia?.llegada ?? hoy)
  const enfocarAlPintar = useRef(false)
  const raiz = useRef<HTMLDivElement>(null)

  const meses = Array.from({ length: MESES_VISIBLES }, (_, i) => sumarMeses(mesVisible, i))
  // Solo si la estadía empieza en lo visible: antes ya se comprobó o se quitó.
  const ultimaNoche =
    estadia && estadia.llegada >= primerDia(mesVisible) ? sumarDias(estadia.salida, -1) : null
  const { disponible, estadoMes, reintentar } = useCalendario(
    alojamientoId,
    mesesACargar(mesVisible, ultimaNoche),
  )

  // Las fechas de la búsqueda pueden haber dejado de estar libres: si alguna
  // noche está ocupada se quitan y se avisa.
  const libres = estadia ? nochesLibres(estadia.llegada, estadia.salida, disponible) : undefined
  useEffect(() => {
    if (estadia && libres === false) descartar(estadia)
  })

  // El teclado mueve el foco entre días; se aplica después de pintar.
  useEffect(() => {
    if (!enfocarAlPintar.current) return
    enfocarAlPintar.current = false
    raiz.current?.querySelector<HTMLButtonElement>(`[data-fecha="${foco}"]`)?.focus()
  })

  const ultimaVisible = ultimoDia(meses[meses.length - 1])
  const minimoNavegable = primerDia(mesActual)
  const maximoNavegable = ultimoDia(sumarMeses(mesMaximo, MESES_VISIBLES - 1))
  // Solo un día del calendario entra en el orden de tabulación.
  const focoVisible =
    foco >= primerDia(mesVisible) && foco <= ultimaVisible
      ? foco
      : hoy >= primerDia(mesVisible) && hoy <= ultimaVisible
        ? hoy
        : primerDia(mesVisible)

  const limiteSalida = llegadaPendiente ? salidaMaxima(llegadaPendiente, disponible) : null

  function estadoDia(fecha: string): EstadoDia {
    const pasado = fecha < hoy
    const libre = disponible(fecha)
    let rol: RolDia = null
    let habilitado: boolean
    let soloSalida = false

    if (llegadaPendiente) {
      if (fecha === llegadaPendiente) rol = 'llegada'
      const comoSalida = puedeSalir(fecha, llegadaPendiente, disponible)
      soloSalida = comoSalida && libre === false
      // Antes de la llegada se puede cambiar de llegada; después, solo
      // salidas que no crucen noches ocupadas.
      habilitado =
        comoSalida || (fecha <= llegadaPendiente && puedeLlegar(fecha, hoy, disponible))
    } else {
      if (estadia) {
        if (fecha === estadia.llegada) rol = 'llegada'
        else if (fecha === estadia.salida) rol = 'salida'
        else if (fecha > estadia.llegada && fecha < estadia.salida) rol = 'noche'
      }
      habilitado = puedeLlegar(fecha, hoy, disponible)
    }
    return { fecha, pasado, libre, habilitado, rol, soloSalida }
  }

  function alElegir(fecha: string) {
    setFoco(fecha)
    if (llegadaPendiente && puedeSalir(fecha, llegadaPendiente, disponible)) {
      setLlegadaPendiente(null)
      elegir(llegadaPendiente, fecha)
      return
    }
    if (!puedeLlegar(fecha, hoy, disponible)) return
    setLlegadaPendiente(fecha)
    // Mientras se elige la salida no hay estadía que cotizar.
    if (estadia || fechasDescartadas) limpiar()
  }

  function borrar() {
    setLlegadaPendiente(null)
    limpiar()
  }

  function moverFoco(destino: string) {
    const nuevo =
      destino < minimoNavegable ? minimoNavegable : destino > maximoNavegable ? maximoNavegable : destino
    if (mesDe(nuevo) < mesVisible) setMesVisible(mesDe(nuevo))
    else if (nuevo > ultimaVisible) setMesVisible(sumarMeses(mesDe(nuevo), -(MESES_VISIBLES - 1)))
    setFoco(nuevo)
    enfocarAlPintar.current = true
  }

  function alPulsarTecla(evento: KeyboardEvent) {
    const actual = focoVisible
    let destino: string | null = null
    if (evento.key in MOVIMIENTOS) destino = sumarDias(actual, MOVIMIENTOS[evento.key])
    else if (evento.key === 'Home') destino = sumarDias(actual, -diaDeLaSemana(actual))
    else if (evento.key === 'End') destino = sumarDias(actual, 6 - diaDeLaSemana(actual))
    else if (evento.key === 'PageUp' || evento.key === 'PageDown') {
      const mes = sumarMeses(mesDe(actual), evento.key === 'PageUp' ? -1 : 1)
      const dia = `${mes}-${actual.slice(8)}`
      destino = dia > ultimoDia(mes) ? ultimoDia(mes) : dia
    } else if (evento.key === 'Escape' && llegadaPendiente) {
      setLlegadaPendiente(null)
    }
    if (destino === null) return
    evento.preventDefault()
    moverFoco(destino)
  }

  const estados = meses.map(estadoMes)
  const rangoInvalido = estados.find((e) => e.fase === 'rango_invalido')
  const errorCarga = estados.find((e) => e.fase === 'error')
  const cargando = estados.some((e) => e.fase === 'cargando')

  return (
    <div className="calendario" ref={raiz}>
      {fechasDescartadas && !estadia && !llegadaPendiente && (
        <p className="calendario__aviso" role="status">
          Las fechas de tu búsqueda (del {formatearDia(fechasDescartadas.llegada)} al{' '}
          {formatearDia(fechasDescartadas.salida)}) ya no están libres en este
          alojamiento. Elige otras en el calendario.
        </p>
      )}

      {rangoInvalido?.fase === 'rango_invalido' ? (
        <div className="calendario__error" role="alert">
          <p className="calendario__error-titulo">No pudimos consultar esas fechas</p>
          <p>{mensajeConReferencia(rangoInvalido.error)}</p>
          <button className="boton-secundario" type="button" onClick={() => setMesVisible(mesActual)}>
            Volver al mes actual
          </button>
        </div>
      ) : (
        errorCarga?.fase === 'error' && (
          <div className="calendario__error" role="alert">
            <p className="calendario__error-titulo">No pudimos cargar la disponibilidad</p>
            <p>{mensajeConReferencia(errorCarga.error)}</p>
            <button className="boton-principal" type="button" onClick={reintentar}>
              Reintentar
            </button>
          </div>
        )
      )}

      <div className="calendario__navegacion">
        <button
          className="calendario__flecha"
          type="button"
          aria-label="Mes anterior"
          disabled={mesVisible <= mesActual}
          onClick={() => setMesVisible(sumarMeses(mesVisible, -1))}
        >
          <span aria-hidden="true">‹</span>
        </button>
        <p className="calendario__estado" role="status">
          {cargando ? 'Cargando disponibilidad…' : ''}
        </p>
        <button
          className="calendario__flecha"
          type="button"
          aria-label="Mes siguiente"
          disabled={mesVisible >= mesMaximo}
          onClick={() => setMesVisible(sumarMeses(mesVisible, 1))}
        >
          <span aria-hidden="true">›</span>
        </button>
      </div>

      <div
        className={`calendario__meses${cargando ? ' calendario__meses--cargando' : ''}`}
        onKeyDown={alPulsarTecla}
        aria-busy={cargando}
      >
        {meses.map((mes) => (
          <MesCalendario
            key={mes}
            mes={mes}
            estadoDia={estadoDia}
            foco={focoVisible}
            onElegir={alElegir}
          />
        ))}
      </div>

      <LeyendaCalendario />
      <ResumenEstadia
        estadia={llegadaPendiente ? null : estadia}
        llegadaPendiente={llegadaPendiente}
        salidaMaxima={limiteSalida}
        onLimpiar={borrar}
      />
    </div>
  )
}

export default CalendarioDisponibilidad
