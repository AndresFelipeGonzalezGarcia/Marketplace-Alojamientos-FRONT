import { useLocation, useParams } from 'react-router'
import DetalleReserva from '../components/reservas/DetalleReserva'
import type { EstadoReservaCreada } from '../components/detalle/useReserva'
import type { EstadoPagoAprobado } from '../components/pago/usePago'

function DetalleReservaPage() {
  const { id = '' } = useParams()
  const location = useLocation()
  const estado = location.state as Partial<EstadoReservaCreada & EstadoPagoAprobado> | null
  // Aviso
  const aviso = estado?.pagoAprobado === true ? 'pagada' : estado?.recienCreada === true ? 'creada' : null

  return (
    <main className="publicacion-pagina">
      {/* Detalle de la reserva */}
      <DetalleReserva key={id} id={id} aviso={aviso} />
    </main>
  )
}

export default DetalleReservaPage
