import { useLocation } from 'react-router'
import BandejaRevision, {
  type EstadoBandeja,
  type ResultadoRevision,
} from '../components/admin/BandejaRevision'

function leerResultado(estado: unknown): ResultadoRevision | undefined {
  const resultado = (estado as EstadoBandeja | null)?.resultado
  return typeof resultado?.id === 'string' &&
    typeof resultado.titulo === 'string' &&
    (resultado.decision === 'aprobada' || resultado.decision === 'rechazada')
    ? resultado
    : undefined
}

function AdminBandejaPage() {
  const location = useLocation()

  return (
    <main className="publicacion-pagina">
      <BandejaRevision resultado={leerResultado(location.state)} />
    </main>
  )
}

export default AdminBandejaPage
