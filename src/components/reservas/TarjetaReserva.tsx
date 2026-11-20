import { Link } from 'react-router'
import type { ReservaResumen } from '../../api/reservas'
import FotoRevision from '../admin/FotoRevision'
import { formatearPrecio } from '../formato/formato'
import { PRESENTACION_RESERVA } from './estadoReserva'
import { formatearFecha, rutaReserva, textoEstadia } from './formatoReserva'
import InsigniaReserva from './InsigniaReserva'

interface TarjetaReservaProps {
  reserva: ReservaResumen
}

// Tarjeta de reserva
function TarjetaReserva({ reserva }: TarjetaReservaProps) {
  const {
    id,
    estado,
    alojamientoTitulo,
    alojamientoCiudad,
    imagenPortada,
    fechaLlegada,
    fechaSalida,
    numeroHuespedes,
    total,
  } = reserva
  const { tono, descripcion } = PRESENTACION_RESERVA[estado]
  const debePagar = estado === 'PENDIENTE_PAGO'

  return (
    <li className={`tarjeta-reserva tarjeta-reserva--${tono}`}>
      <FotoRevision
        key={imagenPortada ?? ''}
        url={imagenPortada}
        alt=""
        textoSinFoto="Sin foto"
        className="tarjeta-reserva__foto"
      />
      <div className="tarjeta-reserva__cuerpo">
        <div className="tarjeta-reserva__estado">
          <InsigniaReserva estado={estado} />
          <span className="tarjeta-reserva__explicacion">{descripcion}</span>
        </div>
        <h2 className="tarjeta-reserva__titulo">
          <Link className="tarjeta-reserva__enlace" to={rutaReserva(id)}>
            {alojamientoTitulo}
          </Link>
        </h2>
        <p className="tarjeta-reserva__ciudad">{alojamientoCiudad}</p>
        <p className="tarjeta-reserva__fechas">
          <time dateTime={fechaLlegada}>{formatearFecha(fechaLlegada)}</time>
          <span aria-hidden="true"> → </span>
          <span className="solo-lector"> al </span>
          <time dateTime={fechaSalida}>{formatearFecha(fechaSalida)}</time>
        </p>
        <p className="tarjeta-reserva__estadia">
          {textoEstadia(fechaLlegada, fechaSalida, numeroHuespedes)}
        </p>
      </div>
      <div className="tarjeta-reserva__lateral">
        <p className="tarjeta-reserva__total">
          <span className="tarjeta-reserva__total-etiqueta">Total</span>
          {formatearPrecio(total)}
        </p>
        {debePagar && (
          <Link
            className="boton-enlace tarjeta-reserva__pagar"
            to={`${rutaReserva(id)}/pago`}
            aria-label={`Pagar la reserva en ${alojamientoTitulo}`}
          >
            Pagar ahora
          </Link>
        )}
      </div>
    </li>
  )
}

export default TarjetaReserva
