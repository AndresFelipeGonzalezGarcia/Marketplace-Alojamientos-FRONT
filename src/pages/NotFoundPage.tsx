import { Link } from 'react-router'

function NotFoundPage() {
  return (
    <main>
      <h1>Página no encontrada</h1>
      <Link to="/">Volver al inicio</Link>
    </main>
  )
}

export default NotFoundPage
