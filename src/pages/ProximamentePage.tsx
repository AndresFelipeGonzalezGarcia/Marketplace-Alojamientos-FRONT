import { Link } from 'react-router'
import MensajePantalla from '../components/publicacion/MensajePantalla'

interface ProximamentePageProps {
  titulo: string
  mensaje: string
}

// Próximamente
function ProximamentePage({ titulo, mensaje }: ProximamentePageProps) {
  return (
    <main className="publicacion-pagina">
      <MensajePantalla titulo={titulo} mensaje={mensaje}>
        <p>
          <span className="etiqueta-proximamente">Próximamente</span>
        </p>
        <Link className="boton-enlace" to="/">
          Volver al inicio
        </Link>
      </MensajePantalla>
    </main>
  )
}

export default ProximamentePage
