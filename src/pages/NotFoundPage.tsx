import { Link } from 'react-router'
import MensajePantalla from '../components/publicacion/MensajePantalla'

function NotFoundPage() {
  return (
    <main className="publicacion-pagina">
      <MensajePantalla
        titulo="Página no encontrada"
        mensaje="La dirección que abriste no existe o cambió de lugar."
      >
        <Link className="boton-enlace" to="/">
          Volver al inicio
        </Link>
      </MensajePantalla>
    </main>
  )
}

export default NotFoundPage
