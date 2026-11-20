import { useParams } from 'react-router'
import PagoReserva from '../components/pago/PagoReserva'

function PagoReservaPage() {
  const { id = '' } = useParams()
  return (
    <main className="publicacion-pagina">
      <PagoReserva key={id} reservaId={id} />
    </main>
  )
}

export default PagoReservaPage
