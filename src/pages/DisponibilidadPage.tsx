import { useParams } from 'react-router'
import GestorDisponibilidad from '../components/disponibilidad/GestorDisponibilidad'
import EncabezadoAnfitrion from '../components/publicacion/EncabezadoAnfitrion'

function DisponibilidadPage() {
  const { id = '' } = useParams()

  return (
    <>
      <EncabezadoAnfitrion />
      <main className="publicacion-pagina">
        <GestorDisponibilidad key={id} publicacionId={id} />
      </main>
    </>
  )
}

export default DisponibilidadPage
