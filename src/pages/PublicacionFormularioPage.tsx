import { useLocation, useNavigate, useParams } from 'react-router'
import type { Publicacion } from '../api/publicaciones'
import EditorPublicacion from '../components/publicacion/EditorPublicacion'
import '../components/formulario/formulario.css'

function PublicacionFormularioPage() {
  const { id } = useParams()
  const navigate = useNavigate()
  const location = useLocation()
  const estadoNavegacion = location.state as {
    borradorGuardado?: boolean
  } | null

  function irAEdicion(publicacion: Publicacion) {
    navigate(`/publicaciones/${encodeURIComponent(publicacion.id)}/editar`, {
      replace: true,
      state: { borradorGuardado: true },
    })
  }

  return (
    <main className="publicacion-pagina">
      <EditorPublicacion
        key={id ?? 'nueva'}
        id={id}
        borradorRecienGuardado={estadoNavegacion?.borradorGuardado === true}
        onCreada={irAEdicion}
      />
    </main>
  )
}

export default PublicacionFormularioPage
