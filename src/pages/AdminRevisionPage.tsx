import { useLocation, useParams } from 'react-router'
import type { PublicacionRevision } from '../api/admin'
import DetalleRevision from '../components/admin/DetalleRevision'
import type { EstadoNavegacionRevision } from '../components/admin/FilaRevision'

// La fila solo se usa si corresponde a la publicación de la URL.
function leerFila(estado: unknown, id: string): PublicacionRevision | undefined {
  const fila = (estado as EstadoNavegacionRevision | null)?.fila
  return fila?.id === id && typeof fila.anfitrionNombre === 'string'
    ? fila
    : undefined
}

function AdminRevisionPage() {
  const { id = '' } = useParams()
  const location = useLocation()

  return (
    <main className="publicacion-pagina">
      <DetalleRevision
        key={id}
        publicacionId={id}
        fila={leerFila(location.state, id)}
      />
    </main>
  )
}

export default AdminRevisionPage
