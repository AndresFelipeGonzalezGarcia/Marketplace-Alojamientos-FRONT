import { useLocation, useParams } from 'react-router'
import DetalleAlojamiento from '../components/detalle/DetalleAlojamiento'
import { rutaVolverBusqueda } from '../components/detalle/volverBusqueda'

// Detalle público de un alojamiento: funciona con o sin sesión.
function AlojamientoDetallePage() {
  const { id = '' } = useParams()
  const location = useLocation()

  return (
    <main className="detalle-pagina">
      <DetalleAlojamiento
        id={id}
        rutaVolver={rutaVolverBusqueda(location.state)}
      />
    </main>
  )
}

export default AlojamientoDetallePage
