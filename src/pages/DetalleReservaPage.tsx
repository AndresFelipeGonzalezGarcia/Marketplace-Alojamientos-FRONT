import { useLocation, useParams } from 'react-router'
import DetalleReserva from '../components/reservas/DetalleReserva'
import type { EstadoReservaCreada } from '../components/detalle/useReserva'
import type { EstadoPagoAprobado } from '../components/pago/usePago'

function DetalleReservaPage() {
  const { id = '' } = useParams()
  const location = useLocation()
  const estado = location.state as Partial<EstadoReservaCreada & EstadoPagoAprobado> | null
  // Se llega justo después de reservar o de pagar: se anuncia el desenlace.
  const aviso = estado?.pagoAprobado === true ? 'pagada' : estado?.recienCreada === true ? 'creada' : null

  return (
    <main className="publicacion-pagina">
      {/* key: al pasar a otra reserva se empieza de cero. */}
      <DetalleReserva key={id} id={id} aviso={aviso} />
    </main>
  )
}

export default DetalleReservaPage
