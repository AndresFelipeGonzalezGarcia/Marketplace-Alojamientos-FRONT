import type { Cotizacion } from '../../api/cotizaciones'
import { formatearImporte, formatearPorcentaje } from '../formato/formato'

interface DesgloseCotizacionProps {
  cotizacion: Cotizacion
}

// Desglose
function DesgloseCotizacion({ cotizacion }: DesgloseCotizacionProps) {
  const {
    noches,
    precioNoche,
    subtotal,
    tarifaLimpieza,
    tarifaServicio,
    porcentajeTarifaServicio,
    total,
    moneda,
  } = cotizacion
  const importe = (valor: number) => formatearImporte(valor, moneda)

  const filas: [string, string][] = [
    ['Precio por noche', importe(precioNoche)],
    ['Noches', String(noches)],
    ['Subtotal', importe(subtotal)],
    ['Tarifa de limpieza', importe(tarifaLimpieza)],
    [`Tarifa de servicio (${formatearPorcentaje(porcentajeTarifaServicio)})`, importe(tarifaServicio)],
  ]

  return (
    <dl className="desglose" aria-label="Desglose del precio">
      {filas.map(([concepto, valor]) => (
        <div className="desglose__fila" key={concepto}>
          <dt>{concepto}</dt>
          <dd>{valor}</dd>
        </div>
      ))}
      <div className="desglose__fila desglose__fila--total">
        <dt>Total</dt>
        <dd>{importe(total)}</dd>
      </div>
    </dl>
  )
}

export default DesgloseCotizacion
