import { useLocation, useParams } from 'react-router'
import DetalleReserva from '../components/reservas/DetalleReserva'
import type { EstadoReservaCreada } from '../components/detalle/useReserva'

function DetalleReservaPage() {
  const { id = '' } = useParams()
  const location = useLocation()
  const recienCreada =
    (location.state as Partial<EstadoReservaCreada> | null)?.recienCreada === true

  return (
    <main className="publicacion-pagina">
      {/* key: al pasar a otra reserva se empieza de cero. */}
      <DetalleReserva key={id} id={id} recienCreada={recienCreada} />
    </main>
  )
}

export default DetalleReservaPage
