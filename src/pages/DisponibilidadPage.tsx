import { useParams } from 'react-router'
import GestorDisponibilidad from '../components/disponibilidad/GestorDisponibilidad'

function DisponibilidadPage() {
  const { id = '' } = useParams()

  return (
    <main className="publicacion-pagina">
      <GestorDisponibilidad key={id} publicacionId={id} />
    </main>
  )
}

export default DisponibilidadPage
