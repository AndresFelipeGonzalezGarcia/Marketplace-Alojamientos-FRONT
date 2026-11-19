import { useId, useState } from 'react'
import { mensajeConReferencia } from '../../api/errores'
import { useSesion } from '../../auth/useSesion'
import { formatearDia, textoNoches } from '../busqueda/filtrosBusqueda'
import { textoCapacidad } from '../formato/formato'
import AccesoCotizacion from './AccesoCotizacion'
import DesgloseCotizacion from './DesgloseCotizacion'
import { useEstadia, type Estadia } from './estadia'
import { irAlCalendario } from './irAlCalendario'
import SelectorHuespedes from './SelectorHuespedes'
import { useCotizacion } from './useCotizacion'

interface CotizacionEstadiaProps {
  alojamientoId: string
  capacidad: number
  // Avisa al detalle para que el calendario vuelva a cargar lo ocupado.
  onFechasOcupadas: () => void
}

const mismaEstadia = (a: Estadia | null, b: { llegada: string; salida: string } | null) =>
  !!a && !!b && a.llegada === b.llegada && a.salida === b.salida

// La cotización vive en el lateral: lee las fechas del calendario y los
// huéspedes de la URL, y muestra el desglose que calcula el backend.
function CotizacionEstadia({ alojamientoId, capacidad, onFechasOcupadas }: CotizacionEstadiaProps) {
  const sesion = useSesion()
  const idNotaReservar = useId()
  const esHuesped = sesion?.usuario.rol === 'HUESPED'
  const { estadia, huespedes: huespedesUrl, elegirHuespedes } = useEstadia()
  const huespedes = huespedesUrl ?? 1
  // Las últimas fechas que el backend dijo ocupadas: el aviso sigue a la
  // vista cuando el calendario, al recargar, las quita.
  const [ocupadas, setOcupadas] = useState<Estadia | null>(null)

  const { estado, reintentar } = useCotizacion({
    alojamientoId,
    estadia,
    huespedes,
    activa: esHuesped,
    onPeriodoNoDisponible: (estadiaOcupada) => {
      setOcupadas(estadiaOcupada)
      onFechasOcupadas()
    },
  })

  const codigo = estado.fase === 'error' ? estado.error.codigo : null
  const errorFechas = estado.fase === 'error' && codigo === 'FECHAS_INVALIDAS' ? estado.error.mensaje : undefined
  const errorHuespedes =
    estado.fase === 'error' && codigo === 'CAPACIDAD_EXCEDIDA'
      ? `Este alojamiento admite hasta ${textoCapacidad(capacidad)}. Quita huéspedes para cotizar.`
      : undefined
  const conflicto =
    codigo === 'PERIODO_NO_DISPONIBLE' || (ocupadas !== null && (!estadia || mismaEstadia(estadia, ocupadas)))

  const fechas = (
    <div className="cotizacion__fechas">
      <p className="cotizacion__etiqueta">Fechas</p>
      {estadia ? (
        <p>
          <strong>{textoNoches(estadia.noches)}</strong>: del {formatearDia(estadia.llegada)} al{' '}
          {formatearDia(estadia.salida)}
        </p>
      ) : (
        <p className="cotizacion__vacio">Elige tus fechas en el calendario de disponibilidad.</p>
      )}
      <button className="cotizacion__enlace" type="button" onClick={irAlCalendario}>
        {estadia ? 'Cambiar fechas' : 'Ir al calendario'}
      </button>
      {errorFechas && (
        <p className="campo-error-cotizacion" role="alert">
          {errorFechas}
        </p>
      )}
    </div>
  )

  if (!esHuesped) {
    return (
      <section className="cotizacion" aria-label="Cotización">
        {fechas}
        <AccesoCotizacion rol={sesion?.usuario.rol ?? null} />
      </section>
    )
  }

  let resultado = null
  if (conflicto) {
    resultado = (
      <div className="cotizacion__aviso" role="alert">
        <p className="cotizacion__aviso-titulo">Estas fechas ya no están libres</p>
        <p>Alguien las reservó mientras mirabas. Elige otras fechas en el calendario.</p>
        <button className="boton-secundario" type="button" onClick={irAlCalendario}>
          Elegir otras fechas
        </button>
      </div>
    )
  } else if (estado.fase === 'cargando') {
    resultado = (
      <div className="desglose desglose--cargando">
        <p className="solo-lector" role="status">
          Calculando el total…
        </p>
        {Array.from({ length: 5 }, (_, i) => (
          <span key={i} className="esqueleto esqueleto--linea" aria-hidden="true" />
        ))}
      </div>
    )
  } else if (estado.fase === 'lista') {
    resultado = <DesgloseCotizacion cotizacion={estado.cotizacion} />
  } else if (estado.fase === 'error' && !errorFechas && !errorHuespedes) {
    resultado = (
      <div className="cotizacion__aviso cotizacion__aviso--error" role="alert">
        <p className="cotizacion__aviso-titulo">No pudimos calcular el total</p>
        <p>{mensajeConReferencia(estado.error)}</p>
        <button className="boton-principal" type="button" onClick={reintentar}>
          Reintentar
        </button>
      </div>
    )
  }

  return (
    <section className="cotizacion" aria-label="Cotización">
      {fechas}
      <SelectorHuespedes
        valor={huespedes}
        capacidad={capacidad}
        error={errorHuespedes}
        onCambiar={elegirHuespedes}
      />
      {resultado}
      <button className="boton-principal cotizacion__reservar" type="button" disabled aria-describedby={idNotaReservar}>
        Reservar
      </button>
      <p className="cotizacion__nota" id={idNotaReservar}>
        {estado.fase === 'lista'
          ? 'Aún no se te cobra nada. La reserva estará disponible muy pronto.'
          : 'La reserva estará disponible muy pronto.'}
      </p>
    </section>
  )
}

export default CotizacionEstadia
